from __future__ import annotations

from typing import Annotated

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class DingTalkAuthSettings(BaseSettings):
    """钉钉认证配置."""

    APP_KEY: str = ""
    APP_SECRET: str = ""
    BASE_URL: Annotated[AnyHttpUrl | str, Field(default="https://oapi.dingtalk.com")] = "https://oapi.dingtalk.com"
    AUTH_MODE: str = "mock"  # real | mock
    ROLE_DOMAIN_MAPPING: dict[str, list[str]] = Field(default_factory=dict)

    MOCK_USER_ID: str = "mock-user"
    MOCK_UNION_ID: str = "mock-union"
    MOCK_USER_NAME: str = "Mock User"
    MOCK_AVATAR: str | None = None
    MOCK_ROLES: list[str] = Field(default_factory=lambda: ["ROLE_STD_AGENT"])

    @classmethod
    @field_validator("BASE_URL", mode="before")
    def _validate_url(cls, v: AnyHttpUrl | str) -> AnyHttpUrl:
        if isinstance(v, str):
            return AnyHttpUrl(v)
        return v

    model_config = SettingsConfigDict(
        env_prefix="DINGTALK_",
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


class JwtSettings(BaseSettings):
    """JWT token 配置."""

    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    model_config = SettingsConfigDict(
        env_prefix="JWT_",
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )
