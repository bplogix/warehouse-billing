from __future__ import annotations

import logging

import structlog
from structlog.types import Processor


def build_pre_chain() -> list[Processor]:
    """Processor 链，确保 stdlib/structlog 输出一致."""
    return [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
    ]


def configure_structlog() -> None:
    """统一 structlog wrapper 配置."""
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def reset_root_logger(level: int) -> logging.Logger:
    """清理并设置 root logger."""
    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(level)
    return root


def silence_third_party(level: int) -> None:
    """使 uvicorn/fastapi 只向 root 冒泡."""
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
        logger = logging.getLogger(name)
        logger.handlers.clear()
        logger.setLevel(level)
        logger.propagate = True
