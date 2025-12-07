"""Auth application layer."""

from .exceptions import AuthenticationFailedError, AuthorizationError
from .qr_login_service import DingTalkQrLoginService, InvalidQrLoginStateTransitionError, QrLoginStateNotFoundError
from .use_cases import AuthenticateUserUseCase, AuthorizeRequestService

__all__ = [
    "AuthenticateUserUseCase",
    "AuthorizeRequestService",
    "DingTalkQrLoginService",
    "QrLoginStateNotFoundError",
    "InvalidQrLoginStateTransitionError",
    "AuthenticationFailedError",
    "AuthorizationError",
]
