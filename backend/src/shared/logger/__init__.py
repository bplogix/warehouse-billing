import logging
import sys

import structlog
from rich.logging import RichHandler

from src.shared.config import settings
from src.shared.logger.formatters import get_dev_renderer, get_json_renderer


def setup_logging():
    """
    根据 Settings 自动初始化日志系统
    """
    fmt = settings.log.LOG_FORMAT.lower()

    # 先清空 root handlers，避免重复绑定
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.setLevel(logging.INFO)

    # 明确声明 handler 是“所有 Handler 的父类”
    handler: logging.Handler

    # dev 环境：rich 彩色输出
    if fmt == "dev":
        handler = RichHandler(
            rich_tracebacks=True,
            markup=True,
            show_time=False,
            omit_repeated_times=False,
        )
        renderer = get_dev_renderer()
    else:
        # prod 环境：JSON 输出
        handler = logging.StreamHandler(sys.stdout)
        renderer = get_json_renderer()

    logging.basicConfig(
        level=settings.log.LOG_LEVEL,
        handlers=[handler],
        format="%(message)s",
    )

    # structlog 配置
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,  # ← 关键：不用 rich_traceback
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
            # renderer,
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
