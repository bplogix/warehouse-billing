from enum import Enum


class ErrorCode(str, Enum):
    """统一错误码枚举"""

    # 通用错误码 (0000-0999)
    UNAUTHORIZED = "E0401"
    FORBIDDEN = "E0403"
    NOT_FOUND = "E0404"
    RESOURCE_NOT_FOUND = "E0405"
    INVALID_PARAMETER = "E0422"
    SYSTEM_ERROR = "E0500"
    HTTP_ERROR = "E0501"
    TRANSACTION_ERROR = "E1005"
