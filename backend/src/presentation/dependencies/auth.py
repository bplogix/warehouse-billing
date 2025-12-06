from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status

from src.application.auth.container import (
    get_authenticate_user_use_case,
    get_authorize_request_service,
)
from src.application.auth.exceptions import AuthenticationFailedError, AuthorizationError
from src.application.auth.use_cases import AuthenticateUserUseCase, AuthorizeRequestService
from src.shared.schemas.auth import AuthenticationResult, CurrentUser, DingTalkLoginRequest


async def authenticate_user_dependency(
    request: DingTalkLoginRequest,
    use_case: AuthenticateUserUseCase = Depends(get_authenticate_user_use_case),
) -> AuthenticationResult:
    try:
        return await use_case.execute(request)
    except AuthenticationFailedError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


def get_current_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
    service: AuthorizeRequestService = Depends(get_authorize_request_service),
) -> CurrentUser:
    try:
        return service.authorize(authorization)
    except AuthorizationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
