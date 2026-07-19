"""
database/ — SQLAlchemy ORM package for multi-tenant data persistence.

When DATABASE_URL is set, the system uses PostgreSQL via SQLAlchemy.
When DATABASE_URL is absent, the system falls back to local file-based
storage (encodings.pickle, config.json, recognition_history.json).
"""
