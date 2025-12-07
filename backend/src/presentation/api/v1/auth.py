from __future__ import annotations

from fastapi import APIRouter, Depends

from src.presentation.dependencies.auth import (
    authenticate_user_dependency,
    get_current_user,
)
from src.shared.schemas.auth import AuthenticationResult, AuthTokensResponse, CurrentUser

router = APIRouter(prefix="/auth")


@router.post("/dingtalk/login", response_model=AuthTokensResponse)
async def dingtalk_login(result: AuthenticationResult = Depends(authenticate_user_dependency)) -> AuthTokensResponse:
    return AuthTokensResponse(user=result.user, tokens=result.tokens)


@router.get("/me", response_model=CurrentUser)
async def me(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    return current_user
