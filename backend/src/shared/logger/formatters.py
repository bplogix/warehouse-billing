import structlog


def get_json_renderer():
    """生产环境 JSON 日志输出"""
    return structlog.processors.JSONRenderer()


def get_dev_renderer():
    """开发环境彩色日志输出（rich 格式）"""
    return structlog.dev.ConsoleRenderer(
        colors=True,
        exception_formatter=structlog.dev.rich_traceback,
    )
