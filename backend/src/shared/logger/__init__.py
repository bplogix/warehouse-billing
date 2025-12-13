from __future__ import annotations

import logging
import sys

from rich.logging import RichHandler
from structlog.stdlib import ProcessorFormatter

from src.shared.config import settings
from src.shared.logger.formatters import get_dev_renderer, get_json_renderer
from src.shared.logger.setup_utils import build_pre_chain, configure_structlog, reset_root_logger, silence_third_party


def setup_logging() -> None:
    """根据配置初始化日志系统（dev=Rich，prod=JSON）."""
    fmt = (settings.log.LOG_FORMAT or "prod").lower()
    level_name = (settings.log.LOG_LEVEL or "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    root = reset_root_logger(level)

    if fmt == "dev":
        handler = _create_dev_handler()
    else:
        handler = _create_prod_handler()

    root.addHandler(handler)

    configure_structlog()
    silence_third_party(level)


def _create_dev_handler() -> logging.Handler:
    """Rich + structlog 输出，适合本地调试."""
    handler = RichHandler(markup=True, rich_tracebacks=True, show_time=False, show_path=False)
    handler.setFormatter(
        ProcessorFormatter(
            processor=get_dev_renderer(),
            foreign_pre_chain=build_pre_chain(),
        )
    )
    return handler


def _create_prod_handler() -> logging.Handler:
    """JSON 输出（生产环境）."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        ProcessorFormatter(
            processor=get_json_renderer(),
            foreign_pre_chain=build_pre_chain(),
        )
    )
    return handler
