from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import datetime

from src.intrastructure.auth import DingTalkAuthGateway
from src.intrastructure.cache.dingtalk_qr_state import DingTalkQrStateRepository, QRStatus
from src.shared.logger.factories import app_logger

logger = app_logger.bind(component="dingtalk_qr_login_service")


class QrLoginStateNotFoundError(RuntimeError):
    """未找到二维码登录状态."""


class InvalidQrLoginStateTransitionError(RuntimeError):
    """非法状态流转."""


@dataclass(slots=True)
class QrLoginSession:
    """二维码登录会话."""

    auth_state: str
    login_url: str
    expire_at: datetime


@dataclass(slots=True)
class QrLoginStatus:
    """二维码状态视图."""

    status: QRStatus
    auth_code: str | None
    expire_at: datetime


class DingTalkQrLoginService:
    """聚合二维码登录核心流程."""

    def __init__(
        self,
        qr_state_repo: DingTalkQrStateRepository,
        gateway: DingTalkAuthGateway,
    ) -> None:
        self._qr_state_repo = qr_state_repo
        self._gateway = gateway

    def _generate_state(self) -> str:
        return secrets.token_urlsafe(32)

    async def create_session(self, redirect_uri: str) -> QrLoginSession:
        """生成新的扫码登录会话."""

        auth_state = self._generate_state()
        record = await self._qr_state_repo.create(auth_state)
        login_url = self._gateway.build_login_url(state=auth_state, redirect_uri=redirect_uri)
        logger.info("qr login session created", auth_state=auth_state, expire_at=record.expire_at.isoformat())
        return QrLoginSession(auth_state=auth_state, login_url=login_url, expire_at=record.expire_at)

    async def get_status(self, auth_state: str) -> QrLoginStatus:
        """查询当前二维码状态."""

        record = await self._qr_state_repo.get(auth_state)
        if record is None:
            raise QrLoginStateNotFoundError(f"{auth_state} not found")
        return QrLoginStatus(status=record.status, auth_code=record.auth_code, expire_at=record.expire_at)

    async def update_from_callback(
        self,
        auth_state: str,
        *,
        auth_code: str | None = None,
    ) -> QrLoginStatus:
        """根据钉钉回调更新状态."""

        if auth_code is None:
            status = QRStatus.SCANNED
        else:
            status = QRStatus.CONFIRMED
        try:
            record = await self._qr_state_repo.update(auth_state, status=status, auth_code=auth_code)
        except KeyError as exc:
            raise QrLoginStateNotFoundError(str(exc)) from exc
        logger.info(
            "qr state updated",
            auth_state=auth_state,
            status=record.status.value,
        )
        return QrLoginStatus(status=record.status, auth_code=record.auth_code, expire_at=record.expire_at)
