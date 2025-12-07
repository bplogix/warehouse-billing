from urllib.parse import urlencode

import httpx

# from alibabacloud_dingtalk.oauth2_1_0 import models as dingtalk_models
# from alibabacloud_dingtalk.oauth2_1_0.client import Client as DingTalkOAuthClient
# from alibabacloud_tea_openapi import models as OpenApiConfig
from pydantic import BaseModel

from src.shared.logger.factories import infra_logger

logger = infra_logger.bind(component="dingtalk_gateway")


class DingTalkConfig(BaseModel):
    app_key: str
    app_secret: str


class AccessTokenResponse(BaseModel):
    """访问凭证数据"""

    accessToken: str
    refreshToken: str
    expireIn: int


class DingTalkClient:
    def __init__(self, cfg: DingTalkConfig):
        self.cfg = cfg

        # ★ 这是正确的 SDK Config 初始化方式
        # config = OpenApiConfig.Config(protocol="https", region_id="central")

    async def get_access_token(self, code: str) -> AccessTokenResponse:
        """
        获取钉钉应用的访问令牌（OIDC）
        """
        logger.info("=== 钉钉登陆回调 ===")

        url = "https://api.dingtalk.com/v1.0/oauth2/userAccessToken"

        payload = {
            "clientId": self.cfg.app_key,
            "clientSecret": self.cfg.app_secret,
            "code": code,
            "grantType": "authorization_code",
        }

        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.post(url, json=payload)

        logger.info(f"获取钉钉访问令牌，响应状态码: {res.status_code}")

        if res.is_error:
            logger.error(f"获取钉钉访问令牌失败: {res.status_code}, {res.text}")
            res.raise_for_status()

        data = res.json()
        logger.info(f"获取钉钉访问令牌成功: {data}")

        return AccessTokenResponse(**data)

    def build_login_url(self, redirect_uri: str, state: str):
        """构造长链 loginUrl（完全按钉钉规则）"""

        # 构造钉钉OAuth参数
        params = {
            "response_type": "code",
            "client_id": self.cfg.app_key,
            "redirect_uri": redirect_uri,
            "state": state,
            "prompt": "consent",
            "scope": "openid",
        }

        # 生成钉钉OAuth URL
        return f"https://login.dingtalk.com/oauth2/auth?{urlencode(params)}"
