from __future__ import annotations

from datetime import UTC, datetime


def now_utc() -> datetime:
    """Return current UTC time."""
    return datetime.now(tz=UTC)
