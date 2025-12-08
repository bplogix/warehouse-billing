from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from src.intrastructure.clients.dingtalk_client import DingTalkClient, DingTalkClientError, DingTalkConfig
from src.shared.config import settings
from src.shared.logger.factories import infra_logger
from src.shared.schemas.auth import DingTalkUserPayload
from src.shared.utils.random import generate_urlsafe_code

logger = infra_logger.bind(component="dingtalk_gateway")


class DingTalkGatewayError(RuntimeError):
    """钉钉接口调用异常."""


class DingTalkAuthGateway(ABC):
    """钉钉认证网关协议."""

    @abstractmethod
    async def exchange_code(self, auth_code: str) -> DingTalkUserPayload:
        """根据 authCode 获取用户信息."""

    @abstractmethod
    def build_login_url(self, state: str, redirect_uri: str) -> str:
        """构建钉钉扫码登录 URL."""


class RealDingTalkAuthGateway(DingTalkAuthGateway):
    """真实钉钉接口实现."""

    def __init__(self, client: DingTalkClient | None = None, timeout: float = 10.0) -> None:
        conf = settings.dingtalk
        cfg = DingTalkConfig(app_key=conf.APP_KEY, app_secret=conf.APP_SECRET, base_url=str(conf.BASE_URL))
        self._client = client or DingTalkClient(cfg, timeout=timeout)

    @staticmethod
    def _require_str(field: str, value: Any) -> str:
        if not isinstance(value, str) or not value.strip():
            raise DingTalkGatewayError(f"{field} is missing in response")
        return value

    async def exchange_code(self, auth_code: str) -> DingTalkUserPayload:
        if not auth_code:
            raise DingTalkGatewayError("auth_code is required")

        try:
            access_token = await self._client.get_user_access_token(auth_code)
            user_data = await self._client.get_user_info(access_token.access_token)
            # await self._client.get_userid_by_unionid(user_data.unionId)
            # await self._client.get_user_info_by_user_id(user_data.unionId)
        except DingTalkClientError as exc:
            raise DingTalkGatewayError(str(exc)) from exc

        payload = DingTalkUserPayload(
            userid=self._require_str("userid", user_data.unionId),
            unionid=self._require_str("unionid", user_data.unionId),
            name=self._require_str("name", user_data.name or user_data.nick),
            avatar=user_data.avatarUrl,
            # mobile=user_data.get("mobile"),
            # email=user_data.get("email"),
            # roles=user_data.role_list or user_data.roles or [],
            roles=["WAREHOUSE"]
            # departments=user_data.get("dept_id_list") or user_data.get("departments") or [],
        )
        logger.info("dingtalk user fetched", user_id=payload.user_id)
        return payload

    def build_login_url(self, state: str, redirect_uri: str) -> str:
        return self._client.build_login_url(redirect_uri=redirect_uri, state=state)


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

    def build_login_url(self, state: str, redirect_uri: str) -> str:
        code = generate_urlsafe_code()
        return f"{redirect_uri}?state={state}&authCode={code}"
