from http import HTTPStatus

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

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
        f"业务接口的异常 - URL: {request.url} - 错误类型: {type(exc).__name__} - 错误信息: {exc!s}",
        exc_info=False,
    )
    response = ErrorResponse(code=ErrorCode.SYSTEM_ERROR, message=ErrorMessage.get_message(ErrorCode.SYSTEM_ERROR))
    return JSONResponse(status_code=HTTPStatus.OK, content=response.model_dump(by_alias=True))


def handle_validation_error(_: Request, exc: Exception) -> JSONResponse:
    message = ""

    # 1️⃣ FastAPI / Pydantic 参数校验
    if isinstance(exc, RequestValidationError):
        # 取第一个错误，最有价值
        err = exc.errors()[0]
        message = err.get("msg", "参数错误")

    if isinstance(exc, ValidationError):
        err = exc.errors()[0]
        message = err.get("msg", "数据校验失败")

    response = ErrorResponse(code=ErrorCode.INVALID_PARAMETER, message=message)
    return JSONResponse(status_code=HTTPStatus.OK, content=response.model_dump(by_alias=True))
