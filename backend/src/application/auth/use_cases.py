from __future__ import annotations

from uuid import uuid4

from structlog.contextvars import bind_contextvars

from src.application.auth.exceptions import AuthenticationFailedError, AuthorizationError
from src.application.auth.services import UserDomainMappingService
from src.intrastructure.auth import DingTalkAuthGateway, TokenService, TokenVerificationError
from src.shared.context import set_current_user_context, set_trace_id
from src.shared.logger.factories import app_logger
from src.shared.schemas.auth import AuthenticationResult, CurrentUser, DingTalkLoginRequest

logger = app_logger.bind(component="auth_use_cases")


class AuthenticateUserUseCase:
    """负责钉钉登录流程."""

    def __init__(
        self,
        gateway: DingTalkAuthGateway,
        token_service: TokenService,
        domain_mapping: UserDomainMappingService,
    ) -> None:
        self._gateway = gateway
        self._token_service = token_service
        self._domain_mapping = domain_mapping

    async def execute(self, request: DingTalkLoginRequest) -> AuthenticationResult:
        try:
            payload = await self._gateway.exchange_code(request.auth_code)
        except Exception as exc:  # noqa: BLE001
            logger.error("dingtalk exchange failed", reason=str(exc))
            raise AuthenticationFailedError(str(exc)) from exc

        domain_codes = self._domain_mapping.map_roles(payload.roles)
        current_user = CurrentUser(
            user_id=payload.user_id,
            union_id=payload.union_id,
            name=payload.name,
            avatar=payload.avatar,
            domain_codes=domain_codes,
        )
        trace_id = payload.trace_id or str(uuid4())
        tokens = self._token_service.create_token_pair(current_user, trace_id)
        logger.info("user authenticated", user_id=current_user.user_id, domains=current_user.domain_codes)
        return AuthenticationResult(user=current_user, tokens=tokens)


class AuthorizeRequestService:
    """校验 Authorization header 并绑定当前用户."""

    def __init__(self, token_service: TokenService) -> None:
        self._token_service = token_service

    def _extract_token(self, authorization: str | None) -> str:
        if not authorization:
            raise AuthorizationError("Authorization header is required")
        if not authorization.lower().startswith("bearer "):
            raise AuthorizationError("Authorization header must start with Bearer")
        token = authorization.split(" ", 1)[1].strip()
        if not token:
            raise AuthorizationError("Authorization token is empty")
        return token

    def authorize(self, authorization: str | None) -> CurrentUser:
        token = self._extract_token(authorization)
        try:
            claims = self._token_service.decode(token)
            current_user = self._token_service.build_current_user(claims)
        except TokenVerificationError as exc:
            raise AuthorizationError(str(exc)) from exc

        trace_id = claims.trace_id
        if trace_id:
            set_trace_id(trace_id)
            bind_contextvars(trace_id=trace_id)
        set_current_user_context(current_user.to_context())
        bind_contextvars(user_id=current_user.user_id)
        logger.info("request authorized", user_id=current_user.user_id)
        return current_user


class RefreshTokenUseCase:
    """根据 refresh token 颁发新的 token 对."""

    def __init__(self, token_service: TokenService) -> None:
        self._token_service = token_service

    def execute(self, refresh_token: str) -> AuthenticationResult:
        if not refresh_token:
            raise AuthenticationFailedError("refresh token is required")

        try:
            claims = self._token_service.decode(refresh_token, verify_type="refresh")
        except TokenVerificationError as exc:
            logger.warning("refresh token invalid", reason=str(exc))
            raise AuthenticationFailedError("invalid refresh token") from exc

        current_user = self._token_service.build_current_user(claims)
        tokens = self._token_service.create_token_pair(current_user, claims.trace_id)
        logger.info("token refreshed", user_id=current_user.user_id)
        return AuthenticationResult(user=current_user, tokens=tokens)
