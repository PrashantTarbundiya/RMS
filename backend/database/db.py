"""
database/db.py — Database engine initialization and session management.

Dual-mode design:
  - If DATABASE_URL is set → connects to PostgreSQL (Supabase) via SQLAlchemy.
  - If DATABASE_URL is absent → the system operates in single-tenant file-based mode
    (the original behavior). Database functions return None and callers must check.

Usage in Flask routes:
    from database.db import get_db, is_db_available

    if is_db_available():
        db = get_db()
        org = db.query(Organization).filter_by(id=org_id).first()
        db.close()
"""

import os
import logging
from contextlib import contextmanager

logger = logging.getLogger('rms-api')

# Module-level state
_engine = None
_SessionLocal = None
_db_available = False


def init_database(database_url=None):
    """
    Initialize the SQLAlchemy engine and session factory.

    Call this once during Flask app startup. If database_url is None,
    the system enters file-based fallback mode.

    Args:
        database_url: PostgreSQL connection string (from DATABASE_URL env var).

    Returns:
        bool: True if database was successfully initialized, False otherwise.
    """
    global _engine, _SessionLocal, _db_available

    if database_url is None:
        database_url = os.environ.get('DATABASE_URL')

    if not database_url:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_dir = os.path.join(backend_dir, 'data')
        os.makedirs(data_dir, exist_ok=True)
        sqlite_path = os.path.join(data_dir, 'rms.db').replace('\\', '/')
        database_url = f"sqlite:///{sqlite_path}"
        logger.info(f"DATABASE_URL not set — using local SQLite database: {sqlite_path}")

    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        if database_url.startswith("sqlite"):
            _engine = create_engine(
                database_url,
                connect_args={"check_same_thread": False},
                echo=False,
            )
        else:
            # Supabase uses postgres:// or postgresql://, but SQLAlchemy 2.0 requires postgresql+psycopg2://
            if database_url.startswith("postgres://"):
                database_url = database_url.replace("postgres://", "postgresql+psycopg2://", 1)
            elif database_url.startswith("postgresql://") and not database_url.startswith("postgresql+"):
                database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)

            # Auto-enable sslmode=require for Supabase cloud connections if missing
            if "supabase.com" in database_url and "sslmode" not in database_url:
                separator = "&" if "?" in database_url else "?"
                database_url = f"{database_url}{separator}sslmode=require"

            # Strip unsupported connection query parameters (e.g. ?pgbouncer=true from Supabase/Prisma)
            # which cause psycopg2.ProgrammingError: invalid connection option "pgbouncer"
            try:
                from urllib.parse import urlsplit, parse_qsl, urlencode, urlunsplit
                parts = urlsplit(database_url)
                if parts.query:
                    query_params = parse_qsl(parts.query, keep_blank_values=True)
                    filtered = [
                        (k, v) for k, v in query_params
                        if k.lower() not in ('pgbouncer', 'connection_limit', 'pool_timeout')
                    ]
                    database_url = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(filtered), parts.fragment))
            except Exception as parse_err:
                logger.warning(f"Failed to sanitize database URL query params: {parse_err}")

            _engine = create_engine(
                database_url,
                pool_size=5,
                max_overflow=10,
                pool_timeout=15,
                pool_recycle=300,  # Recycle connections every 5 min (prevents cloud pooler dropouts)
                pool_pre_ping=True, # Auto-detect dead connections immediately
                echo=False,
                connect_args={
                    'connect_timeout': 10,
                    'keepalives': 1,
                    'keepalives_idle': 30,
                    'keepalives_interval': 10,
                    'keepalives_count': 3,
                },
            )

        _SessionLocal = sessionmaker(bind=_engine, autocommit=False, autoflush=False)
        _db_available = True
        logger.info("Database connected successfully.")
        return True

    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        _db_available = False
        return False


def create_tables():
    """
    Create all tables defined in models.py if they don't exist.
    Only call this in development. In production, use Alembic migrations.
    """
    if not _db_available or _engine is None:
        logger.warning("Cannot create tables — database not available.")
        return False

    try:
        from database.models import Base
        Base.metadata.create_all(bind=_engine)
        logger.info("Database tables created/verified.")
        return True
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        return False


def get_db():
    """
    Get a new database session. Caller is responsible for closing it.

    Usage:
        db = get_db()
        try:
            # ... queries ...
            db.commit()
        except:
            db.rollback()
            raise
        finally:
            db.close()

    Returns:
        SQLAlchemy Session, or None if database is not available.
    """
    if not _db_available or _SessionLocal is None:
        return None
    return _SessionLocal()


@contextmanager
def get_db_session():
    """
    Context manager for database sessions with automatic cleanup.

    Usage:
        with get_db_session() as db:
            org = db.query(Organization).filter_by(id=org_id).first()
            # auto-commits on success, auto-rollbacks on exception

    Yields:
        SQLAlchemy Session, or None if database is not available.
    """
    if not _db_available or _SessionLocal is None:
        yield None
        return

    session = _SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def is_db_available():
    """Check if the PostgreSQL database is connected and available."""
    return _db_available


def get_engine():
    """Get the raw SQLAlchemy engine (for Alembic migrations, etc.)."""
    return _engine
