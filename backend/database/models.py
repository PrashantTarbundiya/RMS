"""
database/models.py — SQLAlchemy ORM models for multi-tenant RMS Face AI.

Every table carries an org_id column. Every query MUST be scoped by org_id.
The application layer enforces this via the @inject_org_id middleware decorator.

Table summary:
  - Organization: The tenant. Each paying customer is one organization.
  - User: Human operators (admins, managers, viewers) who log into the dashboard.
  - Employee: Individuals whose faces are enrolled for recognition.
  - Camera: Physical devices (kiosks, gates) that submit /predict requests.
  - AttendanceLog: Timestamped check-in/check-out events.
  - FeedbackLog: Audit trail of human corrections to ML predictions.
  - Subscription: Billing plan and usage limits per organization.
  - ConsentRecord: Legal audit trail for biometric data consent (BIPA/GDPR/DPDP).
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Float, Boolean, Integer, Text, JSON,
    DateTime, ForeignKey, Enum as SQLEnum, Index, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, DeclarativeBase
import enum


# ──────────────────────────────────────────────────────────────────────
# Base
# ──────────────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


def _uuid():
    """Generate a new UUID4 as a string for use as a primary key."""
    return str(uuid.uuid4())


# ──────────────────────────────────────────────────────────────────────
# Enums
# ──────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    """Roles for RBAC. Ordered from most to least privileged."""
    platform_owner = "platform_owner"
    org_admin = "org_admin"
    manager = "manager"
    viewer = "viewer"
    kiosk = "kiosk"


class DeploymentMode(str, enum.Enum):
    cloud = "cloud"
    local = "local"
    hybrid = "hybrid"


class PlanTier(str, enum.Enum):
    starter = "starter"
    business = "business"
    enterprise = "enterprise"


class EmployeeStatus(str, enum.Enum):
    active = "active"
    terminated = "terminated"
    suspended = "suspended"


class SubscriptionStatus(str, enum.Enum):
    active = "active"
    trial = "trial"
    past_due = "past_due"
    cancelled = "cancelled"


class AttendanceStatus(str, enum.Enum):
    on_time = "on_time"
    late = "late"
    early_departure = "early_departure"
    logged = "logged"


# ──────────────────────────────────────────────────────────────────────
# Organization — The Tenant
# ──────────────────────────────────────────────────────────────────────

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    deployment_mode = Column(
        SQLEnum(DeploymentMode, name="deployment_mode_enum"),
        default=DeploymentMode.cloud, nullable=False
    )
    plan_tier = Column(
        SQLEnum(PlanTier, name="plan_tier_enum"),
        default=PlanTier.starter, nullable=False
    )
    confirm_threshold = Column(Float, default=0.55, nullable=False)
    onboarding_state = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    employees = relationship("Employee", back_populates="organization", cascade="all, delete-orphan")
    cameras = relationship("Camera", back_populates="organization", cascade="all, delete-orphan")
    attendance_logs = relationship("AttendanceLog", back_populates="organization", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="organization", uselist=False,
                                cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Organization {self.name} ({self.id[:8]})>"


# ──────────────────────────────────────────────────────────────────────
# User — Dashboard Operators (Humans)
# ──────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    email = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=True)
    role = Column(
        SQLEnum(UserRole, name="user_role_enum"),
        default=UserRole.viewer, nullable=False
    )
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Unique email per org (two orgs can have the same email)
    __table_args__ = (
        UniqueConstraint("org_id", "email", name="uq_user_org_email"),
    )

    organization = relationship("Organization", back_populates="users")

    def __repr__(self):
        return f"<User {self.email} role={self.role.value}>"


# ──────────────────────────────────────────────────────────────────────
# RevokedToken — Token Blocklist for Session Revocation
# ──────────────────────────────────────────────────────────────────────

class RevokedToken(Base):
    """
    Blocklist for revoked refresh tokens.
    Checked on every /api/auth/refresh call.
    Entries are cleaned up periodically (tokens expire after 7 days anyway).
    """
    __tablename__ = "revoked_tokens"

    id = Column(String(36), primary_key=True, default=_uuid)
    jti = Column(String(64), nullable=False, unique=True, index=True)  # JWT ID (token hash)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    revoked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    reason = Column(String(100), nullable=True)  # "manual", "logout_all", "admin_action"

    __table_args__ = (
        Index("ix_revoked_user_time", "user_id", "revoked_at"),
    )

    def __repr__(self):
        return f"<RevokedToken jti={self.jti[:8]} user={self.user_id[:8]}>"


# ──────────────────────────────────────────────────────────────────────
# Employee — Faces Enrolled for Recognition
# ──────────────────────────────────────────────────────────────────────

class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(36), primary_key=True, default=_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    employee_code = Column(String(50), nullable=True)
    department = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    status = Column(
        SQLEnum(EmployeeStatus, name="employee_status_enum"),
        default=EmployeeStatus.active, nullable=False
    )
    image_count = Column(Integer, default=0, nullable=False)
    consent_given_at = Column(DateTime, nullable=True)
    consent_revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    # Unique name per org
    __table_args__ = (
        UniqueConstraint("org_id", "name", name="uq_employee_org_name"),
        Index("ix_employee_org_status", "org_id", "status"),
    )

    organization = relationship("Organization", back_populates="employees")
    attendance_logs = relationship("AttendanceLog", back_populates="employee", cascade="all, delete-orphan")
    consent_records = relationship("ConsentRecord", back_populates="employee", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Employee {self.name} org={self.org_id[:8]}>"


# ──────────────────────────────────────────────────────────────────────
# Camera — Physical Devices (Kiosks, Gates)
# ──────────────────────────────────────────────────────────────────────

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String(36), primary_key=True, default=_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(255), nullable=True)
    api_key = Column(String(64), nullable=True, unique=True, index=True)
    confirm_threshold_override = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    organization = relationship("Organization", back_populates="cameras")
    attendance_logs = relationship("AttendanceLog", back_populates="camera")

    def __repr__(self):
        return f"<Camera {self.name} @ {self.location}>"


# ──────────────────────────────────────────────────────────────────────
# AttendanceLog — Check-in / Check-out Events
# ──────────────────────────────────────────────────────────────────────

class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(String(36), primary_key=True, default=_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(String(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    camera_id = Column(String(36), ForeignKey("cameras.id", ondelete="SET NULL"), nullable=True)
    checkin_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    confidence = Column(Float, nullable=True)
    method = Column(String(50), nullable=True)
    status = Column(
        SQLEnum(AttendanceStatus, name="attendance_status_enum"),
        default=AttendanceStatus.logged, nullable=False
    )
    prediction_label = Column(String(100), nullable=True)
    is_confirmed = Column(Boolean, default=False, nullable=False)
    synced = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_attendance_org_time", "org_id", "checkin_time"),
        Index("ix_attendance_org_employee", "org_id", "employee_id"),
    )

    organization = relationship("Organization", back_populates="attendance_logs")
    employee = relationship("Employee", back_populates="attendance_logs")
    camera = relationship("Camera", back_populates="attendance_logs")

    def __repr__(self):
        return f"<AttendanceLog {self.prediction_label} @ {self.checkin_time}>"


# ──────────────────────────────────────────────────────────────────────
# FeedbackLog — Human-in-the-Loop Correction Audit Trail
# ──────────────────────────────────────────────────────────────────────

class FeedbackLog(Base):
    __tablename__ = "feedback_logs"

    id = Column(String(36), primary_key=True, default=_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    prediction_id = Column(String(20), nullable=False, index=True)
    predicted_name = Column(String(100), nullable=True)
    is_correct = Column(Boolean, nullable=False)
    correct_name = Column(String(100), nullable=True)
    distance = Column(Float, nullable=True)
    action_taken = Column(String(50), nullable=True)
    message = Column(Text, nullable=True)
    model_version = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_feedback_org_time", "org_id", "created_at"),
    )

    def __repr__(self):
        return f"<FeedbackLog {self.prediction_id} correct={self.is_correct}>"


# ──────────────────────────────────────────────────────────────────────
# Subscription — Billing & Plan Limits
# ──────────────────────────────────────────────────────────────────────

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"),
                    nullable=False, unique=True)
    plan_tier = Column(
        SQLEnum(PlanTier, name="plan_tier_enum", create_constraint=False),
        default=PlanTier.starter, nullable=False
    )
    max_employees = Column(Integer, default=200, nullable=False)
    max_cameras = Column(Integer, default=5, nullable=False)
    status = Column(
        SQLEnum(SubscriptionStatus, name="subscription_status_enum"),
        default=SubscriptionStatus.trial, nullable=False
    )
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    organization = relationship("Organization", back_populates="subscription")

    def __repr__(self):
        return f"<Subscription {self.plan_tier.value} for org={self.org_id[:8]}>"


# ──────────────────────────────────────────────────────────────────────
# ConsentRecord — Biometric Data Consent (BIPA / GDPR / DPDP)
# ──────────────────────────────────────────────────────────────────────

class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(String(36), primary_key=True, default=_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    consented_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    consent_type = Column(String(50), default="biometric_enrollment", nullable=False)
    consented_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    ip_address = Column(String(45), nullable=True)
    notes = Column(Text, nullable=True)

    __table_args__ = (
        Index("ix_consent_org_employee", "org_id", "employee_id"),
    )

    employee = relationship("Employee", back_populates="consent_records")

    def __repr__(self):
        return f"<ConsentRecord employee={self.employee_id[:8]} @ {self.consented_at}>"


# ──────────────────────────────────────────────────────────────────────
# SystemInfo — Singleton: Application Version & Update State
# ──────────────────────────────────────────────────────────────────────

class UpdateSeverity(str, enum.Enum):
    critical = "critical"
    recommended = "recommended"
    optional = "optional"

class SystemInfo(Base):
    """
    Singleton table (always has exactly one row with id=1).
    Tracks the install's current version and update state.
    NOT per-org — each local install is its own deployment.
    """
    __tablename__ = "system_info"

    id = Column(Integer, primary_key=True, default=1)
    app_version = Column(String(20), nullable=False, default="1.0.0")
    last_update_checked_at = Column(DateTime, nullable=True)
    latest_available_version = Column(String(20), nullable=True)
    update_severity = Column(
        SQLEnum(UpdateSeverity, name="update_severity_enum"),
        nullable=True
    )
    update_changelog = Column(Text, nullable=True)
    update_download_url = Column(String(500), nullable=True)
    update_checksum = Column(String(128), nullable=True)
    update_signature = Column(String(256), nullable=True)  # HMAC signature
    last_update_applied_at = Column(DateTime, nullable=True)
    last_backup_path = Column(String(500), nullable=True)

    def __repr__(self):
        return f"<SystemInfo v{self.app_version}>"


# ──────────────────────────────────────────────────────────────────────
# NotificationPreference — Per-User Alert Settings
# ──────────────────────────────────────────────────────────────────────

class NotificationPreference(Base):
    """
    Per-user notification preferences.
    Stores a JSON blob of which alerts to receive and via which channels.
    """
    __tablename__ = "notification_preferences"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False, unique=True, index=True)
    org_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"),
                    nullable=False, index=True)
    preferences = Column(Text, nullable=False, default='{}')  # JSON blob
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<NotificationPreference user={self.user_id[:8]}>"
