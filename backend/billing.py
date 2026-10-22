"""
billing.py — Subscription enforcement and Stripe billing integration.

Provides:
  - check_subscription_limit(): Enforces max_employees per-org
  - check_camera_limit(): Enforces max_cameras per-org
  - get_subscription_info(): Returns plan details for frontend display
  - handle_stripe_webhook(): Processes Stripe webhook events

Enforcement is SERVER-SIDE — the UI shows limits, but these functions
are the actual gate. Direct API calls that bypass the UI will still
be rejected here.
"""

import os
import json
import logging
from datetime import datetime, timezone
from flask import jsonify

logger = logging.getLogger('rms-billing')


# ─── Employee Limit Enforcement ─────────────────────────────────────

def check_subscription_limit(org_id, new_employees_count=1):
    """
    Checks if adding `new_employees_count` will exceed the organization's
    subscription limit.

    Returns (allowed: bool, error_response: tuple/None)

    If PostgreSQL is not connected, checks against license-based limits
    for local-mode installs.
    """
    from database.db import is_db_available

    if not is_db_available():
        # Local mode: check against license limits
        return _check_local_employee_limit(org_id, new_employees_count)

    from database.models import Subscription, Employee
    from database.db import get_db_session
    from sqlalchemy import func

    with get_db_session() as session:
        sub = session.query(Subscription).filter_by(org_id=org_id).first()
        if not sub:
            # No subscription row — default to starter limits (200 employees)
            max_allowed = 200
        else:
            # Auto-upgrade starter or legacy organizations below 200
            if not sub.max_employees or sub.max_employees < 200:
                sub.max_employees = 200
                try:
                    session.commit()
                except Exception as commit_err:
                    session.rollback()
            max_allowed = sub.max_employees or 200

            # Check subscription status
            status_msg = _check_subscription_status(sub)
            if status_msg:
                return False, (jsonify({
                    'error': status_msg,
                    'error_code': 'SUBSCRIPTION_INACTIVE',
                    'upgrade_url': '/profile'
                }), 402)

        # Count active employees
        current_count = session.query(func.count(Employee.id)).filter_by(
            org_id=org_id, status='active'
        ).scalar() or 0

        if current_count + new_employees_count > max_allowed:
            return False, (jsonify({
                'error': (
                    f'Employee limit reached. Your {_get_plan_name(sub)} plan allows '
                    f'up to {max_allowed} employees. You currently have {current_count} '
                    f'active employees. Please upgrade your plan to add more.'
                ),
                'error_code': 'EMPLOYEE_LIMIT_REACHED',
                'current_count': current_count,
                'max_allowed': max_allowed,
                'upgrade_url': '/profile'
            }), 402)

        return True, None


def _check_local_employee_limit(org_id, new_employees_count):
    """Check employee limits for local/on-prem installs using license.py."""
    try:
        from license import enforce_local_license
        license_data = enforce_local_license()
        max_allowed = license_data.get('max_employees', 100)
    except Exception:
        # License validation failed — use conservative default
        max_allowed = 100

    from org_storage import get_dataset_cleaned_dir
    org_dataset_dir = get_dataset_cleaned_dir(org_id)

    current_count = 0
    if os.path.exists(org_dataset_dir):
        current_count = len([
            name for name in os.listdir(org_dataset_dir)
            if os.path.isdir(os.path.join(org_dataset_dir, name))
        ])

    if current_count + new_employees_count > max_allowed:
        return False, (jsonify({
            'error': (
                f'License employee limit reached ({current_count}/{max_allowed}). '
                f'Contact sales to increase your limit.'
            ),
            'error_code': 'LICENSE_EMPLOYEE_LIMIT',
            'current_count': current_count,
            'max_allowed': max_allowed,
        }), 402)

    return True, None


# ─── Camera Limit Enforcement ───────────────────────────────────────

def check_camera_limit(org_id, new_cameras_count=1):
    """
    Checks if adding `new_cameras_count` will exceed the organization's
    camera limit.

    Returns (allowed: bool, error_response: tuple/None)
    """
    from database.db import is_db_available
    if not is_db_available():
        # Local mode: no camera limit enforcement (typically 1 camera)
        return True, None

    from database.models import Subscription, Camera
    from database.db import get_db_session
    from sqlalchemy import func

    with get_db_session() as session:
        sub = session.query(Subscription).filter_by(org_id=org_id).first()
        if not sub:
            max_cameras = 1
        else:
            max_cameras = sub.max_cameras or 1

            # Check subscription status
            status_msg = _check_subscription_status(sub)
            if status_msg:
                return False, (jsonify({
                    'error': status_msg,
                    'error_code': 'SUBSCRIPTION_INACTIVE',
                    'upgrade_url': '/profile'
                }), 402)

        # Count active cameras
        current_count = session.query(func.count(Camera.id)).filter_by(
            org_id=org_id, is_active=True
        ).scalar() or 0

        if current_count + new_cameras_count > max_cameras:
            return False, (jsonify({
                'error': (
                    f'Camera limit reached. Your {_get_plan_name(sub)} plan allows '
                    f'up to {max_cameras} cameras. You currently have {current_count} '
                    f'active cameras. Please upgrade your plan to add more.'
                ),
                'error_code': 'CAMERA_LIMIT_REACHED',
                'current_count': current_count,
                'max_allowed': max_cameras,
                'upgrade_url': '/profile'
            }), 402)

        return True, None


# ─── Subscription Status Helpers ────────────────────────────────────

def _check_subscription_status(sub):
    """
    Check if a subscription is in a state that should block operations.
    Returns an error message string, or None if OK.
    """
    if not sub:
        return None

    if sub.status.value == 'cancelled':
        return (
            'Your subscription has been cancelled. '
            'Please reactivate your plan to continue using the service.'
        )

    if sub.status.value == 'past_due':
        return (
            'Your payment is past due. Please update your payment method '
            'to continue using the service.'
        )

    return None


def _get_plan_name(sub):
    """Get a human-readable plan name."""
    if not sub:
        return 'Starter'
    return sub.plan_tier.value.capitalize()


# ─── Subscription Info for Frontend ─────────────────────────────────

def get_subscription_info(org_id):
    """
    Returns subscription details for the frontend to display usage bars
    and upgrade prompts.
    """
    from database.db import is_db_available

    if not is_db_available():
        # Local mode
        try:
            from license import enforce_local_license
            license_data = enforce_local_license()
            max_employees = license_data.get('max_employees', 100)
        except Exception:
            max_employees = 100

        from org_storage import get_dataset_cleaned_dir
        org_dataset_dir = get_dataset_cleaned_dir(org_id)
        current_employees = 0
        if os.path.exists(org_dataset_dir):
            current_employees = len([
                name for name in os.listdir(org_dataset_dir)
                if os.path.isdir(os.path.join(org_dataset_dir, name))
            ])

        return {
            'plan_tier': 'local_license',
            'status': 'active',
            'max_employees': max_employees,
            'current_employees': current_employees,
            'max_cameras': 999,  # No camera limit in local mode
            'current_cameras': 0,
            'usage_percent_employees': round(
                (current_employees / max_employees * 100) if max_employees else 0, 1
            ),
        }

    from database.models import Subscription, Employee, Camera
    from database.db import get_db_session
    from sqlalchemy import func

    with get_db_session() as session:
        sub = session.query(Subscription).filter_by(org_id=org_id).first()
        current_employees = session.query(func.count(Employee.id)).filter_by(
            org_id=org_id, status='active'
        ).scalar() or 0
        current_cameras = session.query(func.count(Camera.id)).filter_by(
            org_id=org_id, is_active=True
        ).scalar() or 0

        if not sub:
            return {
                'plan_tier': 'starter',
                'status': 'trial',
                'max_employees': 200,
                'current_employees': current_employees,
                'max_cameras': 5,
                'current_cameras': current_cameras,
                'usage_percent_employees': round(
                    (current_employees / 200 * 100), 1
                ),
                'usage_percent_cameras': round(
                    (current_cameras / 5 * 100), 1
                ),
            }

        # Auto-upgrade starter or legacy subscriptions below 200
        if not sub.max_employees or sub.max_employees < 200:
            sub.max_employees = 200
            try:
                session.commit()
            except Exception:
                session.rollback()

        max_emp = sub.max_employees or 200
        max_cam = sub.max_cameras or 5

        return {
            'plan_tier': sub.plan_tier.value,
            'status': sub.status.value,
            'max_employees': max_emp,
            'current_employees': current_employees,
            'max_cameras': max_cam,
            'current_cameras': current_cameras,
            'usage_percent_employees': round(
                (current_employees / max_emp * 100) if max_emp else 0, 1
            ),
            'usage_percent_cameras': round(
                (current_cameras / max_cam * 100) if max_cam else 0, 1
            ),
            'stripe_customer_id': sub.stripe_customer_id,
            'current_period_end': (
                sub.current_period_end.isoformat() if sub.current_period_end else None
            ),
        }


# ─── Stripe Webhook Handler ────────────────────────────────────────

# Plan tier → limits mapping (server-side source of truth)
PLAN_LIMITS = {
    'starter': {'max_employees': 200, 'max_cameras': 5},
    'business': {'max_employees': 500, 'max_cameras': 20},
    'enterprise': {'max_employees': 10000, 'max_cameras': 100},
}

STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', '')


def handle_stripe_webhook(payload, sig_header):
    """
    Process incoming Stripe webhook events.
    Updates the local subscriptions table based on Stripe events.

    Supported events:
      - customer.subscription.created
      - customer.subscription.updated
      - customer.subscription.deleted
      - invoice.payment_failed

    Returns (success: bool, message: str, status_code: int)
    """
    if not STRIPE_SECRET_KEY:
        logger.warning("Stripe not configured — webhook ignored")
        return False, "Stripe not configured", 501

    try:
        import stripe
        stripe.api_key = STRIPE_SECRET_KEY

        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return False, "Invalid payload", 400
    except Exception as e:
        return False, f"Signature verification failed: {str(e)}", 400

    event_type = event.get('type', '')
    data_object = event['data']['object']

    logger.info(f"Stripe webhook: {event_type}")

    from database.db import get_db_session
    from database.models import Subscription, SubscriptionStatus, PlanTier

    if event_type in (
        'customer.subscription.created',
        'customer.subscription.updated',
    ):
        stripe_customer_id = data_object.get('customer')
        stripe_sub_id = data_object.get('id')
        status = data_object.get('status')  # active, past_due, canceled, etc.

        # Map Stripe status to our enum
        status_map = {
            'active': SubscriptionStatus.active,
            'trialing': SubscriptionStatus.trial,
            'past_due': SubscriptionStatus.past_due,
            'canceled': SubscriptionStatus.cancelled,
            'unpaid': SubscriptionStatus.past_due,
        }

        # Extract plan tier from Stripe metadata
        metadata = data_object.get('metadata', {})
        plan_tier_str = metadata.get('plan_tier', 'starter')

        with get_db_session() as session:
            sub = session.query(Subscription).filter_by(
                stripe_customer_id=stripe_customer_id
            ).first()

            if not sub:
                sub = session.query(Subscription).filter_by(
                    stripe_subscription_id=stripe_sub_id
                ).first()

            if sub:
                sub.stripe_subscription_id = stripe_sub_id
                sub.status = status_map.get(status, SubscriptionStatus.active)

                if plan_tier_str in [t.value for t in PlanTier]:
                    sub.plan_tier = PlanTier(plan_tier_str)
                    limits = PLAN_LIMITS.get(plan_tier_str, {})
                    sub.max_employees = limits.get('max_employees', sub.max_employees)
                    sub.max_cameras = limits.get('max_cameras', sub.max_cameras)

                # Update billing period
                period_start = data_object.get('current_period_start')
                period_end = data_object.get('current_period_end')
                if period_start:
                    sub.current_period_start = datetime.fromtimestamp(
                        period_start, tz=timezone.utc
                    )
                if period_end:
                    sub.current_period_end = datetime.fromtimestamp(
                        period_end, tz=timezone.utc
                    )

                session.commit()
                logger.info(
                    f"Subscription updated: {stripe_sub_id} → "
                    f"{sub.plan_tier.value}/{sub.status.value}"
                )
            else:
                logger.warning(
                    f"No subscription found for Stripe customer {stripe_customer_id}"
                )

    elif event_type == 'customer.subscription.deleted':
        stripe_sub_id = data_object.get('id')

        with get_db_session() as session:
            sub = session.query(Subscription).filter_by(
                stripe_subscription_id=stripe_sub_id
            ).first()

            if sub:
                sub.status = SubscriptionStatus.cancelled
                session.commit()
                logger.info(f"Subscription cancelled: {stripe_sub_id}")

    elif event_type == 'invoice.payment_failed':
        stripe_customer_id = data_object.get('customer')

        with get_db_session() as session:
            sub = session.query(Subscription).filter_by(
                stripe_customer_id=stripe_customer_id
            ).first()

            if sub:
                sub.status = SubscriptionStatus.past_due
                session.commit()
                logger.info(
                    f"Payment failed for customer {stripe_customer_id} — "
                    f"marked as past_due"
                )

    return True, "Webhook processed", 200
