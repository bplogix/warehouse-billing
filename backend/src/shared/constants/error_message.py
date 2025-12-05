from .error_code import ErrorCode


class ErrorMessage:
    """错误信息映射"""

    MESSAGES: dict[ErrorCode, dict[str, str]] = {
        # 通用错误码 (1000-1999)
        ErrorCode.SYSTEM_ERROR: {
            "zh": "系统内部错误，请稍后重试",
            "en": "Internal server error, please try again later",
            "ja": "システム内部エラーです。しばらく後に再試行してください",
        },
        ErrorCode.INVALID_PARAMETER: {
            "zh": "参数无效",
            "en": "Invalid parameter",
            "ja": "パラメータが無効です",
        },
        ErrorCode.UNAUTHORIZED: {
            "zh": "未授权访问",
            "en": "Unauthorized access",
            "ja": "未承認のアクセス",
        },
        ErrorCode.FORBIDDEN: {
            "zh": "禁止访问",
            "en": "Forbidden access",
            "ja": "アクセス禁止",
        },
        ErrorCode.NOT_FOUND: {
            "zh": "资源不存在",
            "en": "Resource not found",
            "ja": "リソースが見つかりません",
        },
        ErrorCode.RESOURCE_NOT_FOUND: {
            "zh": "指定的资源未找到",
            "en": "Specified resource not found",
            "ja": "指定されたリソースが見つかりません",
        },
        ErrorCode.TRANSACTION_ERROR: {
            "zh": "事务执行失败",
            "en": "Transaction failed",
            "ja": "トランザクションが失敗しました",
        },
    }

    @classmethod
    def get_message(cls, error_code: ErrorCode, lang: str = "zh", **kwargs) -> str:
        """
        获取错误信息

        Args:
            error_code: 错误码
            lang: 语言 (zh/en/ja)
            **kwargs: 格式化参数

        Returns:
            str: 错误信息
        """
        messages = cls.MESSAGES.get(error_code, {})
        message = messages.get(lang, messages.get("zh", str(error_code)))

        # 支持参数格式化
        try:
            return message.format(**kwargs)
        except (KeyError, ValueError):
            return message
