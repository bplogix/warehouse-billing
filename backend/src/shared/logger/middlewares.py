import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from structlog.contextvars import bind_contextvars, clear_contextvars


class RequestContextMiddleware(BaseHTTPMiddleware):
    """
    全局请求上下文中间件：
    - 自动生成 trace_id
    - 绑定 path / method
    - 可扩展 tenant_id / user_id
    """

    async def dispatch(self, request: Request, call_next):
        clear_contextvars()
        trace_id = str(uuid.uuid4())

        bind_contextvars(
            trace_id=trace_id,
            path=request.url.path,
            method=request.method,
        )

        response = await call_next(request)
        response.headers["X-Trace-Id"] = trace_id
        return response
