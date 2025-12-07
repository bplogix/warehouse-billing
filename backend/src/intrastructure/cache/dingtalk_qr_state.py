from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from typing import Any

from redis.asyncio import Redis

from src.intrastructure.cache.redis import get_redis_client
from src.shared.config import settings
from src.shared.logger.factories import infra_logger

logger = infra_logger.bind(component="dingtalk_qr_state")


class QRStatus(StrEnum):
    """二维码登录状态."""

    WAITING = "waiting"
    SCANNED = "scanned"
    CONFIRMED = "confirmed"
    EXPIRED = "expired"


@dataclass(slots=True)
class DingTalkQrState:
    """Redis 中存储的数据结构."""

    auth_state: str
    status: QRStatus
    expire_at: datetime
    auth_code: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "authState": self.auth_state,
            "status": self.status.value,
            "authCode": self.auth_code,
            "expireAt": self.expire_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> DingTalkQrState:
        expire_at_raw = data.get("expireAt")
        if not isinstance(expire_at_raw, str):
            raise ValueError("expireAt is required")
        expire_at = datetime.fromisoformat(expire_at_raw)
        if expire_at.tzinfo is None:
            expire_at = expire_at.replace(tzinfo=UTC)
        status = QRStatus(data["status"])
        return cls(
            auth_state=data["authState"],
            status=status,
            auth_code=data.get("authCode"),
            expire_at=expire_at,
        )


class DingTalkQrStateRepository:
    """二维码状态 Redis 仓储."""

    def __init__(self, redis: Redis | None = None) -> None:
        self._redis = redis or get_redis_client()
        conf = settings.dingtalk
        self._prefix = conf.QR_STATE_PREFIX
        self._ttl_seconds = conf.QR_STATE_TTL_SECONDS

    def _key(self, auth_state: str) -> str:
        return f"{self._prefix}:{auth_state}"

    async def create(self, auth_state: str) -> DingTalkQrState:
        expire_at = datetime.now(tz=UTC) + timedelta(seconds=self._ttl_seconds)
        record = DingTalkQrState(auth_state=auth_state, status=QRStatus.WAITING, expire_at=expire_at)
        payload = json.dumps(record.to_dict())
        await self._redis.set(self._key(auth_state), payload, ex=self._ttl_seconds)
        logger.info("qr state created", auth_state=auth_state)
        return record

    async def get(self, auth_state: str) -> DingTalkQrState | None:
        raw = await self._redis.get(self._key(auth_state))
        if raw is None:
            return None
        data = json.loads(raw)
        data.setdefault("authState", auth_state)
        return DingTalkQrState.from_dict(data)

    async def update(
        self,
        auth_state: str,
        *,
        status: QRStatus | None = None,
        auth_code: str | None = None,
    ) -> DingTalkQrState:
        record = await self.get(auth_state)
        if record is None:
            raise KeyError(f"qr state {auth_state} not found")
        if status is not None:
            record.status = status
        if auth_code is not None:
            record.auth_code = auth_code
        payload = json.dumps(record.to_dict())
        await self._redis.set(self._key(auth_state), payload, keepttl=True)
        logger.info("qr state updated", auth_state=auth_state, status=record.status)
        return record

    async def delete(self, auth_state: str) -> None:
        await self._redis.delete(self._key(auth_state))
        logger.info("qr state deleted", auth_state=auth_state)
