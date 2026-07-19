import os
from flask import jsonify
from database.db import get_session
from database.models import Subscription, Organization, Employee
from sqlalchemy import func

def check_subscription_limit(org_id, new_employees_count=1):
    """
    Checks if adding `new_employees_count` will exceed the organization's subscription limit.
    Returns (allowed: bool, error_response: tuple/None)
    If PostgreSQL is not connected, it defaults to allowed=True.
    """
    from database.db import is_db_available
    if not is_db_available():
        # Without DB, fallback to unlimited or check local files
        from org_storage import get_dataset_cleaned_dir
        org_dataset_dir = get_dataset_cleaned_dir(org_id)
        if os.path.exists(org_dataset_dir):
            current_count = len([name for name in os.listdir(org_dataset_dir) 
                               if os.path.isdir(os.path.join(org_dataset_dir, name))])
            if current_count + new_employees_count > 25: # Default local limit
                return False, (jsonify({'error': 'Local free tier is limited to 25 employees.'}), 402)
        return True, None

    with get_session() as session:
        sub = session.query(Subscription).filter_by(org_id=org_id).first()
        if not sub:
            # Fallback for dev mode where subscription might not exist yet
            max_allowed = 25
        else:
            max_allowed = sub.max_employees

        # Count active employees
        current_count = session.query(func.count(Employee.id)).filter_by(org_id=org_id, status='active').scalar()
        
        if current_count + new_employees_count > max_allowed:
            return False, (jsonify({
                'error': f'Subscription limit reached. You can enroll up to {max_allowed} employees. '
                         f'You currently have {current_count} active employees. Please upgrade your plan.'
            }), 402) # 402 Payment Required
            
        return True, None
