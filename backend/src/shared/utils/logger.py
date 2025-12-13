"""Lightweight logging helpers for brace-style formatting."""

import logging

from structlog.stdlib import BoundLogger


def logf(logger: BoundLogger, level: int, template: str, *args, **kwargs) -> None:
    """
    Log with Python's logger using ``str.format`` style placeholders.

    Example:
        logf(logger, logging.INFO, "errors -> {}, {}, {}", a, b, c)
    """
    logger.log(level, template.format(*args, **kwargs))


def infof(logger: BoundLogger, template: str, *args, **kwargs) -> None:
    """Shorthand for logf with INFO level."""
    logf(logger, logging.INFO, template, *args, **kwargs)


def errorf(logger: BoundLogger, template: str, *args, **kwargs) -> None:
    """Shorthand for logf with ERROR level."""
    logf(logger, logging.ERROR, template, *args, **kwargs)
