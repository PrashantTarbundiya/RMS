"""
version.py — Single source of truth for the RMS Face AI application version.

This module is imported by:
  - server.py (for /api/health and /api/system/info)
  - update_checker.py (for version comparison)
  - The update application flow (to confirm post-update version)

Version format: Semantic Versioning (MAJOR.MINOR.PATCH)
"""

APP_VERSION = "1.0.0"
APP_NAME = "RMS Face AI"
