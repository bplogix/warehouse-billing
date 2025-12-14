from __future__ import annotations

from enum import Enum

from sqlalchemy import BigInteger, Enum as SAEnum, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .base import AuditMixin, Base


class RegionLevel(str, Enum):
    COUNTRY = "COUNTRY"
    PREFECTURE = "PREFECTURE"
    CITY = "CITY"
    DISTRICT = "DISTRICT"
    TOWN = "TOWN"


class Region(AuditMixin, Base):
    """Hierarchy of administrative regions (prefecture/city/town)."""

    __tablename__ = "regions"
    __table_args__ = (
        UniqueConstraint("region_code", name="uq_regions_region_code"),
        Index("idx_regions_parent_code", "parent_code"),
        Index("idx_regions_country_level", "country_code", "level"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, comment="主键")
    region_code: Mapped[str] = mapped_column(String(64), nullable=False, comment="区域编码（行政区划代码）")
    name: Mapped[str] = mapped_column(String(128), nullable=False, comment="区域名称（标准）")
    country_code: Mapped[str] = mapped_column(
        String(8),
        nullable=False,
        default="JP",
        server_default="JP",
        comment="所属国家代码",
    )
    level: Mapped[str] = mapped_column(String, nullable=False, comment="行政层级")
    parent_code: Mapped[str | None] = mapped_column(String(64), comment="父级区域编码")
    postal_code_prefix: Mapped[str | None] = mapped_column(String(16), comment="邮编前缀")
    attributes: Mapped[dict[str, str] | None] = mapped_column("metadata", JSONB, comment="自定义扩展字段")
