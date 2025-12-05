"""统一响应模型"""

from pydantic import BaseModel, Field

from src.shared.constants.error_code import ErrorCode
from src.shared.constants.error_message import ErrorMessage


class SuccessResponse[T](BaseModel):
    """成功响应"""

    success: bool = Field(default=True, description="是否成功")
    data: T | None = Field(default=None, description="响应数据")
    message: str = Field(default="", description="消息")


class ErrorResponse(BaseModel):
    """错误响应"""

    success: bool = Field(default=False, description="是否成功")
    error_code: str = Field(default=ErrorCode.SYSTEM_ERROR, description="错误码")
    message: str = Field(default=ErrorMessage.get_message(ErrorCode.SYSTEM_ERROR), description="错误消息")
    data: dict | None = Field(default=None, description="错误详情")
