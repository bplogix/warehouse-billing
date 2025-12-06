from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, cast

import httpx

from src.shared.config import settings
from src.shared.logger.factories import infra_logger
from src.shared.schemas.auth import DingTalkUserPayload

logger = infra_logger.bind(component="dingtalk_gateway")


class DingTalkGatewayError(RuntimeError):
    """钉钉接口调用异常."""


class DingTalkAuthGateway(ABC):
    """钉钉认证网关协议."""

    @abstractmethod
    async def exchange_code(self, auth_code: str) -> DingTalkUserPayload:
        """根据 authCode 获取用户信息."""


class RealDingTalkAuthGateway(DingTalkAuthGateway):
    """真实钉钉接口实现."""

    def __init__(self, timeout: float = 10.0) -> None:
        self._settings = settings.dingtalk
        self._timeout = timeout

    @staticmethod
    def _require_str(field: str, value: Any) -> str:
        if not isinstance(value, str) or not value.strip():
            raise DingTalkGatewayError(f"{field} is missing in response")
        return value

    async def _get_access_token(self) -> str:
        payload = {
            "appkey": self._settings.APP_KEY,
            "appsecret": self._settings.APP_SECRET,
        }
        async with httpx.AsyncClient(base_url=str(self._settings.BASE_URL), timeout=self._timeout) as client:
            response = await client.get("/gettoken", params=payload)
        response.raise_for_status()
        data: dict[str, Any] = response.json()
        if data.get("errcode") != 0:
            logger.error(
                "failed to fetch dingtalk access token", errcode=data.get("errcode"), errmsg=data.get("errmsg")
            )
            raise DingTalkGatewayError(data.get("errmsg", "failed to fetch access token"))
        return self._require_str("access_token", data.get("access_token"))

    async def _request_user_info(self, auth_code: str, access_token: str) -> dict[str, Any]:
        payload = {"code": auth_code}
        params = {"access_token": access_token}
        async with httpx.AsyncClient(base_url=str(self._settings.BASE_URL), timeout=self._timeout) as client:
            response = await client.post("/topapi/v2/user/getuserinfo", params=params, json=payload)
        response.raise_for_status()
        data: dict[str, Any] = response.json()
        if data.get("errcode") != 0:
            logger.error(
                "failed to exchange dingtalk auth code",
                errcode=data.get("errcode"),
                errmsg=data.get("errmsg"),
            )
            raise DingTalkGatewayError(data.get("errmsg", "failed to exchange auth code"))
        result = data.get("result", data)
        return cast("dict[str, Any]", result)

    async def exchange_code(self, auth_code: str) -> DingTalkUserPayload:
        if not auth_code:
            raise DingTalkGatewayError("auth_code is required")

        access_token = await self._get_access_token()
        user_data = await self._request_user_info(auth_code, access_token)
        payload = DingTalkUserPayload(
            userid=self._require_str("userid", user_data.get("userid") or user_data.get("userId")),
            unionid=self._require_str("unionid", user_data.get("unionid") or user_data.get("unionId")),
            name=self._require_str("name", user_data.get("name") or user_data.get("nick")),
            avatar=user_data.get("avatar"),
            mobile=user_data.get("mobile"),
            email=user_data.get("email"),
            roles=user_data.get("role_list") or user_data.get("roles") or [],
            departments=user_data.get("dept_id_list") or user_data.get("departments") or [],
        )
        logger.info("dingtalk user fetched", user_id=payload.user_id)
        return payload


class MockDingTalkAuthGateway(DingTalkAuthGateway):
    """Mock 实现."""

    async def exchange_code(self, auth_code: str) -> DingTalkUserPayload:
        conf = settings.dingtalk
        logger.warning("using mock dingtalk gateway", auth_code=auth_code)
        return DingTalkUserPayload(
            userid=conf.MOCK_USER_ID,
            unionid=conf.MOCK_UNION_ID or conf.MOCK_USER_ID,
            name=conf.MOCK_USER_NAME,
            avatar=conf.MOCK_AVATAR,
            roles=conf.MOCK_ROLES,
            departments=[],
            trace_id=f"mock-{auth_code}",
        )
