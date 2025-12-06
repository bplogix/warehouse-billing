from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import BigInteger, DateTime, Enum as SAEnum, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import AuditMixin, Base


class SyncStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class ExternalSystemSync(AuditMixin, Base):
    __tablename__ = "external_system_syncs"
    __table_args__ = (
        Index("idx_sync_entity", "entity_type", "entity_id"),
        Index("idx_sync_remote", "source", "remote_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    remote_id: Mapped[str] = mapped_column(String(128), nullable=False)
    sync_status: Mapped[SyncStatus] = mapped_column(SAEnum(SyncStatus), nullable=False)
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
