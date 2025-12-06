import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from structlog.contextvars import bind_contextvars, clear_contextvars

from src.shared.context import clear_request_context, get_trace_id, set_trace_id


class RequestContextMiddleware(BaseHTTPMiddleware):
    """
    全局请求上下文中间件：
    - 自动生成 trace_id
    - 绑定 path / method
    - 可扩展 tenant_id / user_id
    """

    async def dispatch(self, request: Request, call_next):
        clear_contextvars()
        clear_request_context()
        trace_id = str(uuid.uuid4())
        set_trace_id(trace_id)

        bind_contextvars(
            trace_id=trace_id,
            path=request.url.path,
            method=request.method,
        )

        response = await call_next(request)
        current_trace_id = get_trace_id() or trace_id
        response.headers["X-Trace-Id"] = current_trace_id
        return response
