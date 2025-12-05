from http import HTTPStatus

from fastapi import Request
from fastapi.responses import JSONResponse

from src.shared.constants.error_code import ErrorCode
from src.shared.constants.error_message import ErrorMessage
from src.shared.logger.factories import log
from src.shared.schemas.response import ErrorResponse


class AppError(Exception):
    """Yamato API 错误基类"""

    def __init__(self, message: str, code: int | str | None = None):
        super().__init__(message)
        self.code = code
        self.message = message


def handle_app_error(request: Request, exc: Exception) -> JSONResponse:
    """处理通用异常"""
    log.error(
        f"Yamato远程接口的异常 - URL: {request.url} - 错误类型: {type(exc).__name__} - 错误信息: {exc!s}",
        exc_info=False,
    )
    response = ErrorResponse(
        error_code=ErrorCode.SYSTEM_ERROR, message=ErrorMessage.get_message(ErrorCode.SYSTEM_ERROR)
    )
    return JSONResponse(status_code=HTTPStatus.OK, content=response.model_dump(by_alias=True))
