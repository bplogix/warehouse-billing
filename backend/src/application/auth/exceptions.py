class AuthenticationFailedError(RuntimeError):
    """登录失败."""


class AuthorizationError(RuntimeError):
    """鉴权失败."""
