"""
reset_user_password.py — Administrative CLI utility to reset an account password.
Usage:
    python backend/scripts/reset_user_password.py <email> <new_password>
"""

import sys
import os

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, '.env'))

from database.db import init_database, get_db_session, is_db_available
from database.models import User
from auth import hash_password, verify_password

def reset_password(email: str, new_password: str):
    if len(new_password) < 8:
        print(f"Error: Password must be at least 8 characters long.")
        return False

    init_database()
    if not is_db_available():
        print("Error: Database is not available.")
        return False

    with get_db_session() as db:
        user = db.query(User).filter_by(email=email.strip().lower()).first()
        if not user:
            print(f"Error: No user found with email '{email}'.")
            return False

        user.password_hash = hash_password(new_password)
        db.commit()
        print(f"Success: Password for '{user.email}' has been successfully reset to '{new_password}'.")
        print(f"Verification: {verify_password(new_password, user.password_hash)}")
        return True

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python backend/scripts/reset_user_password.py <email> <new_password>")
        sys.exit(1)

    target_email = sys.argv[1]
    target_pwd = sys.argv[2]
    success = reset_password(target_email, target_pwd)
    sys.exit(0 if success else 1)

