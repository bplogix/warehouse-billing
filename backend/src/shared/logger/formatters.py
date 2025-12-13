import structlog


def get_json_renderer():
    """生产环境 JSON 日志输出"""
    return structlog.processors.JSONRenderer()


def get_dev_renderer():
    """开发环境使用 Rich 渲染时，避免重复嵌套 ANSI 颜色."""
    return structlog.dev.ConsoleRenderer(
        colors=False,
        exception_formatter=structlog.dev.rich_traceback,
    )
