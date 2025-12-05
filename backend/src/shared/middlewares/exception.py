from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from src.shared.error.app_error import AppError, handle_app_error
from src.shared.error.handle import handle_error


class ExceptionHandlerMiddleware(BaseHTTPMiddleware):
    """统一异常处理中间件"""

    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        try:
            return await call_next(request)
        except AppError as exc:
            return handle_app_error(request, exc)
        except Exception as exc:
            return handle_error(request, exc)
