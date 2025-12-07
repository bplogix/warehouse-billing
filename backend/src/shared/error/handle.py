from http import HTTPStatus

from fastapi import Request
from fastapi.responses import JSONResponse

from src.shared.constants.error_code import ErrorCode
from src.shared.constants.error_message import ErrorMessage
from src.shared.logger.factories import log
from src.shared.schemas.response import ErrorResponse


def handle_error(request: Request, exc: Exception) -> JSONResponse:
    """处理通用异常"""
    log.error(f"未处理的异常 - URL: {request.url} - 错误类型: {type(exc).__name__} - 错误信息: {exc!s}", exc_info=True)

    response = ErrorResponse(code=ErrorCode.SYSTEM_ERROR, message=ErrorMessage.get_message(ErrorCode.SYSTEM_ERROR))
    return JSONResponse(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, content=response.model_dump(by_alias=True))
