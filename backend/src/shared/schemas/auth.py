from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field

from src.shared.models import UserContext


class QRStatus(StrEnum):
    """二维码登录状态."""

    WAITING = "waiting"
    SCANNED = "scanned"
    CONFIRMED = "confirmed"
    EXPIRED = "expired"


class DingTalkUserPayload(BaseModel):
    """钉钉返回的用户信息."""

    user_id: str = Field(alias="userid")
    union_id: str = Field(alias="unionid")
    name: str
    avatar: str | None = None
    mobile: str | None = None
    email: str | None = None
    roles: list[str] = Field(default_factory=list)
    departments: list[str] = Field(default_factory=list)
    trace_id: str | None = None

    model_config = {
        "populate_by_name": True,
    }


class CurrentUser(BaseModel):
    """系统内部的当前用户模型."""

    user_id: str
    union_id: str
    name: str
    avatar: str | None = None
    domain_codes: list[str] = Field(default_factory=list)

    def to_context(self) -> UserContext:
        """转换为轻量级上下文模型."""
        return UserContext(
            user_id=self.user_id,
            union_id=self.union_id,
            name=self.name,
            avatar=self.avatar,
            domain_codes=list(self.domain_codes),
        )

    @classmethod
    def from_context(cls, context: UserContext) -> CurrentUser:
        """从上下文模型构造 Pydantic 用户."""
        return cls(
            user_id=context.user_id,
            union_id=context.union_id,
            name=context.name,
            avatar=context.avatar,
            domain_codes=list(context.domain_codes),
        )


class TokenPair(BaseModel):
    """JWT token 对."""

    access_token: str
    refresh_token: str
    token_type: str = Field(default="Bearer")
    expires_in: int


class AuthenticationResult(BaseModel):
    """登录结果."""

    user: CurrentUser
    tokens: TokenPair


class TokenClaims(BaseModel):
    """JWT 载荷."""

    sub: str
    trace_id: str
    user: CurrentUser
    type: str = "access"


class DingTalkLoginRequest(BaseModel):
    """前端传入钉钉 authCode."""

    auth_code: str = Field(..., min_length=1, alias="authCode")

    model_config = {
        "populate_by_name": True,
    }


class AuthTokensResponse(BaseModel):
    """统一返回结构."""

    user: CurrentUser
    tokens: TokenPair


class DingTalkQrCreateRequest(BaseModel):
    """生成二维码的请求."""

    client_type: Literal["pc"] = Field(default="pc", alias="clientType")

    model_config = {
        "populate_by_name": True,
    }


class DingTalkQrCreateResponse(BaseModel):
    """生成二维码响应."""

    auth_state: str = Field(alias="authState")
    login_url: str = Field(alias="loginUrl")
    expire_at: datetime = Field(alias="expireAt")

    model_config = {
        "populate_by_name": True,
    }


class DingTalkQrStatusResponse(BaseModel):
    """二维码状态响应."""

    status: QRStatus
    auth_code: str | None = Field(default=None, alias="authCode")
    expire_at: datetime = Field(alias="expireAt")

    model_config = {
        "populate_by_name": True,
        "use_enum_values": True,
    }


class DingTalkCallbackPayload(BaseModel):
    """钉钉回调载荷."""

    state: str
    status: QRStatus
    auth_code: str | None = Field(default=None, alias="authCode")

    model_config = {
        "populate_by_name": True,
    }
