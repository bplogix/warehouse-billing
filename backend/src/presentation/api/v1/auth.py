from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from src.application.auth.container import get_dingtalk_qr_login_service
from src.application.auth.qr_login_service import (
    DingTalkQrLoginService,
    InvalidQrLoginStateTransitionError,
    QrLoginStateNotFoundError,
)
from src.presentation.dependencies.auth import (
    authenticate_user_dependency,
    get_current_user,
)
from src.shared.config import settings
from src.shared.schemas.auth import (
    AuthenticationResult,
    AuthTokensResponse,
    CurrentUser,
    DingTalkCallbackPayload,
    DingTalkQrCreateRequest,
    DingTalkQrCreateResponse,
    DingTalkQrStatusResponse,
)

router = APIRouter(prefix="/auth")


@router.post("/dingtalk/login", response_model=AuthTokensResponse)
async def dingtalk_login(result: AuthenticationResult = Depends(authenticate_user_dependency)) -> AuthTokensResponse:
    return AuthTokensResponse(user=result.user, tokens=result.tokens)


@router.get("/me", response_model=CurrentUser)
async def me(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    return current_user


@router.post(
    "/dingtalk/qr",
    response_model=DingTalkQrCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_dingtalk_qr_session(
    request: DingTalkQrCreateRequest,
    service: DingTalkQrLoginService = Depends(get_dingtalk_qr_login_service),
) -> DingTalkQrCreateResponse:
    redirect_uri = str(settings.dingtalk.QR_REDIRECT_URI)
    if not redirect_uri:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="QR redirect URI not configured")
    session = await service.create_session(redirect_uri=redirect_uri)
    return DingTalkQrCreateResponse(
        authState=session.auth_state, loginUrl=session.login_url, expireAt=session.expire_at
    )


@router.get(
    "/dingtalk/qr/{auth_state}/status",
    response_model=DingTalkQrStatusResponse,
)
async def get_dingtalk_qr_status(
    auth_state: str,
    service: DingTalkQrLoginService = Depends(get_dingtalk_qr_login_service),
) -> DingTalkQrStatusResponse:
    try:
        state = await service.get_status(auth_state)
    except QrLoginStateNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR session not found") from None
    return DingTalkQrStatusResponse(status=state.status, authCode=state.auth_code, expireAt=state.expire_at)


@router.post("/dingtalk/callback")
async def dingtalk_qr_callback(
    payload: DingTalkCallbackPayload,
    service: DingTalkQrLoginService = Depends(get_dingtalk_qr_login_service),
) -> dict[str, bool]:
    try:
        await service.update_from_callback(payload.state, status=payload.status, auth_code=payload.auth_code)
    except QrLoginStateNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR session not found") from None
    except InvalidQrLoginStateTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {"ok": True}
