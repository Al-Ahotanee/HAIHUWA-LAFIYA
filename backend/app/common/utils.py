"""Common utility functions compatible with Python 3.10+."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone


def utcnow() -> datetime:
    """Return timezone-aware UTC now."""
    return datetime.now(timezone.utc)


def generate_uuid() -> uuid.UUID:
    """Generate a new UUID4."""
    return uuid.uuid4()
