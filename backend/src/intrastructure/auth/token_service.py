from __future__ import annotations

from datetime import timedelta
from uuid import uuid4

import jwt

from src.shared.config import settings
from src.shared.logger.factories import infra_logger
from src.shared.schemas.auth import CurrentUser, TokenClaims, TokenPair
from src.shared.utils import now_utc

logger = infra_logger.bind(component="token_service")


class TokenVerificationError(RuntimeError):
    """JWT 解析失败."""


class TokenService:
    """生成/校验内部 JWT."""

    def __init__(
        self,
        secret_key: str | None = None,
        algorithm: str | None = None,
        access_token_expire_minutes: int | None = None,
        refresh_token_expire_days: int | None = None,
    ) -> None:
        jwt_settings = settings.jwt
        self._secret_key = secret_key or jwt_settings.SECRET_KEY
        self._algorithm = algorithm or jwt_settings.ALGORITHM
        self._access_token_expire_minutes = access_token_expire_minutes or jwt_settings.ACCESS_TOKEN_EXPIRE_MINUTES
        self._refresh_token_expire_days = refresh_token_expire_days or jwt_settings.REFRESH_TOKEN_EXPIRE_DAYS

    def _encode(self, payload: dict, expires_delta: timedelta) -> str:
        to_encode = payload.copy()
        to_encode["exp"] = now_utc() + expires_delta
        return jwt.encode(to_encode, self._secret_key, algorithm=self._algorithm)

    def create_token_pair(self, user: CurrentUser, trace_id: str | None = None) -> TokenPair:
        """生成 access + refresh token."""
        trace = trace_id or str(uuid4())
        user_payload = user.model_dump()
        base_payload = {
            "sub": user.user_id,
            "trace_id": trace,
            "user": user_payload,
        }
        access = self._encode(base_payload, timedelta(minutes=self._access_token_expire_minutes))
        refresh = self._encode(
            {
                **base_payload,
                "type": "refresh",
            },
            timedelta(days=self._refresh_token_expire_days),
        )
        logger.info("token pair created", user_id=user.user_id)
        return TokenPair(access_token=access, refresh_token=refresh, expires_in=self._access_token_expire_minutes * 60)

    def decode(self, token: str, verify_type: str | None = None) -> TokenClaims:
        """解析 token."""
        try:
            data = jwt.decode(token, self._secret_key, algorithms=[self._algorithm])
        except jwt.PyJWTError as exc:
            logger.warning("token decode failed", reason=str(exc))
            raise TokenVerificationError("invalid or expired token") from exc
        claims = TokenClaims.model_validate(data)
        if verify_type and claims.type != verify_type:
            raise TokenVerificationError("token type mismatch")
        return claims

    def build_current_user(self, claims: TokenClaims) -> CurrentUser:
        return claims.user
