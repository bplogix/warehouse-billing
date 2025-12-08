from __future__ import annotations

from urllib.parse import urlencode

import httpx
from alibabacloud_dingtalk.contact_1_0.client import Client as ContactClient
from alibabacloud_dingtalk.oauth2_1_0 import models as dingtalk_models
from alibabacloud_dingtalk.oauth2_1_0.client import Client as DingTalkOAuthClient
from alibabacloud_tea_openapi import models as open_api
from pydantic import BaseModel, ConfigDict, Field

from src.shared.logger.factories import infra_logger

logger = infra_logger.bind(component="dingtalk_client")


class DingTalkClientError(RuntimeError):
    """钉钉客户端异常."""


class DingTalkConfig(BaseModel):
    """钉钉客户端配置."""

    app_key: str
    app_secret: str
    base_url: str = Field(default="https://oapi.dingtalk.com")


class AccessTokenResponse(BaseModel):
    """访问凭证数据."""

    access_token: str = Field(alias="accessToken")
    expire_in: int = Field(alias="expireIn")
    model_config = ConfigDict(populate_by_name=True)


class UserAccessTokenResponse(AccessTokenResponse):
    """访问凭证数据."""

    access_token: str = Field(alias="accessToken")
    refresh_token: str = Field(alias="refreshToken")
    expire_in: int = Field(alias="expireIn")


# class UserInfoSchema(BaseModel):
#     """用户信息数据"""

#     device_id: str  # 设备ID
#     name: str  # 用户名
#     sys: bool  # 是否是管理员
#     sys_level: int  # 管理员级别
#     unionid: str  # 用户unionId
#     userid: str  # 用户的userId。


class UserInfoSchema(BaseModel):
    """用户信息数据"""

    nick: str  # 昵称
    unionId: str  # 用户在钉钉的唯一标识
    openId: str  # 用户在当前应用的唯一标识
    visitor: bool  # 是否为访客
    avatarUrl: str | None = None  # 用户头像
    name: str | None = None


# class UserInfoResponse(BaseModel):
#     """用户信息响应"""

#     errcode: int
#     errmsg: str
#     result: UserInfoSchema
#     request_id: str


class DingTalkClient:
    """封装钉钉开放平台 API."""

    ACCESS_TOKEN: str

    def __init__(self, cfg: DingTalkConfig, *, timeout: float = 10.0) -> None:
        self.cfg = cfg
        self._timeout = timeout
        self.api_config = open_api.Config(protocol="https", region_id="central")
        self.get_access_token()

    def get_access_token(self) -> None:
        logger.info("=== 钉钉获取企业访问token ===")
        req = dingtalk_models.GetAccessTokenRequest(app_key=self.cfg.app_key, app_secret=self.cfg.app_secret)
        resp = DingTalkOAuthClient(self.api_config).get_access_token(req)
        logger.info(f"获取钉钉企业访问token信息成功: {resp.body.to_map()}")
        self.ACCESS_TOKEN = resp.body.access_token or ""

    async def get_user_access_token(self, auth_code: str) -> UserAccessTokenResponse:
        """authCode → access_token"""
        logger.info("=== 钉钉通过认证code获取用户访问token ===")
        req_token = dingtalk_models.GetUserTokenRequest(
            client_id=self.cfg.app_key,
            client_secret=self.cfg.app_secret,
            code=auth_code,
            grant_type="authorization_code",
        )
        resp = await DingTalkOAuthClient(self.api_config).get_user_token_async(req_token)
        logger.info(f"获取钉钉用户访问token信息成功: {resp.to_map()}")
        return UserAccessTokenResponse(**resp.body.to_map())

    async def get_oapi_access_token(self):
        logger.info("=== 钉钉获取oapi访问token ===")
        url = "https://oapi.dingtalk.com/gettoken"
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                url,
                params={
                    "appkey": self.cfg.app_key,
                    "appsecret": self.cfg.app_secret,
                },
            )

        data = resp.json()
        logger.info(f"获取oapi access_token 返回: {data}")
        return data

    async def get_user_info_by_user_id(self, user_id: str):
        """authCode → access_token"""
        logger.info("=== 钉钉通过用户unionID获取用户详情 ===")
        # api_config = self.api_config

        # resp = await ContactClient(api_config).get_user_async(union_id)
        # logger.info(f"获取钉钉用户信息成功: {resp.to_map()}")
        # return resp.body.to_map()
        url = f"https://api.dingtalk.com/v1.0/contact/users/{user_id}"
        headers = {"x-acs-dingtalk-access-token": self.ACCESS_TOKEN}
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        logger.info(f"获取钉钉用户信息成功: {data}")
        return data

    async def get_user_info(self, access_token: str) -> UserInfoSchema:
        """
        获取钉钉用户信息（/contact/users/me）
        使用 OAuth2 user_token 或 access_token（取决于你的授权方式）
        """

        logger.info("=== 钉钉获取用户信息 ===")

        headers = {"x-acs-dingtalk-access-token": access_token}

        url = "https://api.dingtalk.com/v1.0/contact/users/me"

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                res = await client.get(url, headers=headers)
                res.raise_for_status()
            except httpx.HTTPStatusError as exc:
                logger.error(
                    "获取钉钉用户信息失败",
                    status_code=exc.response.status_code,
                    response_text=exc.response.text,
                )
                raise
            except httpx.RequestError as exc:
                logger.error("网络请求失败", error=str(exc))
                raise

        data = res.json()
        logger.info(f"获取钉钉用户信息成功: {data}")

        return UserInfoSchema(**data)

    async def get_userid_by_unionid(self, union_id: str):
        """
        获取钉钉用户ID（/user/getbyunionid
        """
        access_token = await self.get_oapi_access_token()

        logger.info("=== 钉钉通过unionid获取用户ID ===")

        url = "https://oapi.dingtalk.com/topapi/v2/user/getbyunionid"

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                params={"access_token": access_token['access_token']},
                data={"unionid": union_id},
            )
        resp.raise_for_status()
        data = resp.json()
        logger.info(f"获取钉钉用户ID成功: {data}")
        return data

    def build_login_url(self, redirect_uri: str, state: str) -> str:
        """构造 loginUrl."""

        params = {
            "response_type": "code",
            "client_id": self.cfg.app_key,
            "redirect_uri": redirect_uri,
            "state": state,
            "prompt": "consent",
            "scope": "openid",
        }
        return f"https://login.dingtalk.com/oauth2/auth?{urlencode(params)}"
