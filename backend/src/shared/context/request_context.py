from __future__ import annotations

from contextvars import ContextVar

from src.shared.models import UserContext

_trace_id_var: ContextVar[str | None] = ContextVar("trace_id", default=None)
_current_user_var: ContextVar[UserContext | None] = ContextVar("current_user", default=None)


def clear_request_context() -> None:
    """Reset context variables for a new request."""
    _trace_id_var.set(None)
    _current_user_var.set(None)


def set_trace_id(trace_id: str) -> None:
    """Bind trace id to current context."""
    _trace_id_var.set(trace_id)


def get_trace_id() -> str | None:
    """Get trace id from context."""
    return _trace_id_var.get()


def set_current_user_context(user: UserContext | None) -> None:
    """Bind current user object."""
    _current_user_var.set(user)


def get_current_user_context() -> UserContext | None:
    """Return current user from context."""
    return _current_user_var.get()
