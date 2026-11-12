import sys
import os
sys.path.insert(0, '/app')

from database.db import init_database, get_db, is_db_available
from database.models import (
    Base, User, Organization, SupportTicket, Subscription, 
    UserRole, PlanTier, SubscriptionStatus
)

init_database()

if not is_db_available():
    print("Database unavailable!")
    sys.exit(1)

from database.db import _engine
Base.metadata.create_all(bind=_engine)

from auth import hash_password

db = get_db()
try:
    default_org = db.query(Organization).filter_by(id='default-org').first()
    if not default_org:
        default_org = db.query(Organization).first()
    org_id = default_org.id if default_org else 'default-org'

    target_email = 'vatsalvadgama04@gmail.com'
    user = db.query(User).filter_by(email=target_email).first()
    
    # Hash password directly using auth.hash_password
    pwd_hash = hash_password('Admin@12345')

    if user:
        user.role = UserRole.platform_owner
        user.password_hash = pwd_hash
        user.is_active = True
        print(f"Updated password & role for {target_email} to platform_owner.")
    else:
        new_user = User(
            org_id=org_id,
            email=target_email,
            password_hash=pwd_hash,
            name='Vatsal Vadgama',
            role=UserRole.platform_owner,
            is_active=True
        )
        db.add(new_user)
        print(f"Created new user {target_email} as platform_owner.")

    user2 = db.query(User).filter_by(email='vatsalvadgama02@gmail.com').first()
    if user2:
        user2.role = UserRole.org_admin
        print("Set vatsalvadgama02@gmail.com to org_admin (not platform_owner).")

    # Demote any other user that might have been accidentally marked platform_owner
    other_owners = db.query(User).filter(User.email != target_email, User.role == UserRole.platform_owner).all()
    for o in other_owners:
        o.role = UserRole.org_admin
        print(f"Demoted non-superadmin {o.email} from platform_owner to org_admin.")

    db.commit()
    print("Database user password updated successfully.")
except Exception as e:
    db.rollback()
    print(f"Database error: {e}")
    sys.exit(1)
finally:
    db.close()
