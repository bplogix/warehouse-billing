from __future__ import annotations

from structlog import get_logger
from structlog.stdlib import BoundLogger

# 通用 logger，适用于跨层或工具类
log: BoundLogger = get_logger("app")
# DDD 各层专用 logger
domain_logger: BoundLogger = get_logger("domain")
app_logger: BoundLogger = get_logger("application")
infra_logger: BoundLogger = get_logger("infrastructure")
presentation_logger: BoundLogger = get_logger("presentation")

__all__ = [
    "log",
    "domain_logger",
    "app_logger",
    "infra_logger",
    "presentation_logger",
]
