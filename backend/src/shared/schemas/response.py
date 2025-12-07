"""统一响应模型"""

from typing import TypeVar

from pydantic import BaseModel, ConfigDict, Field

from src.shared.constants.error_code import ErrorCode
from src.shared.constants.error_message import ErrorMessage

T = TypeVar("T")


class BaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class SuccessResponse[T](BaseResponse):
    """成功响应"""

    success: bool = Field(default=True, description="是否成功")
    data: T | None = Field(default=None, description="响应数据")
    message: str = Field(default="", description="消息")


class ErrorResponse(BaseResponse):
    """错误响应"""

    success: bool = Field(default=False, description="是否成功")
    data: dict | None = Field(default=None, description="错误详情")
    code: str = Field(default=ErrorCode.SYSTEM_ERROR, description="错误码")
    message: str = Field(default=ErrorMessage.get_message(ErrorCode.SYSTEM_ERROR), description="错误消息")
