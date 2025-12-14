from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import AuditMixin, Base

if TYPE_CHECKING:
    from .region import Region


class CarrierStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class CarrierServiceStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


class CarrierServiceGeoGroupStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SCHEDULED = "SCHEDULED"


class Carrier(AuditMixin, Base):
    """Transport carrier definition."""

    __tablename__ = "carriers"
    __table_args__ = (UniqueConstraint("carrier_code", name="uq_carrier_code"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, comment="主键")
    carrier_code: Mapped[str] = mapped_column(String(64), nullable=False, comment="服务商编码")
    carrier_name: Mapped[str] = mapped_column(String(128), nullable=False, comment="服务商名称")
    description: Mapped[str | None] = mapped_column(Text, comment="服务商描述")
    country_code: Mapped[str] = mapped_column(
        String(8),
        nullable=False,
        default="JP",
        server_default="JP",
        comment="所属国家/地区",
    )

    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default=CarrierStatus.ACTIVE,
        server_default=CarrierStatus.ACTIVE.value,
        comment="服务商状态",
    )
    contact_email: Mapped[str | None] = mapped_column(String(128), comment="联系人邮箱")
    contact_phone: Mapped[str | None] = mapped_column(String(32), comment="联系人电话")
    website: Mapped[str | None] = mapped_column(String(128), comment="官网地址")
    attributes: Mapped[dict[str, str] | None] = mapped_column("metadata", JSONB, comment="服务商扩展信息")

    services: Mapped[list[CarrierService]] = relationship(
        back_populates="carrier",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class CarrierService(AuditMixin, Base):
    """Transport service under a carrier."""

    __tablename__ = "carrier_services"
    __table_args__ = (
        UniqueConstraint("carrier_id", "service_code", name="uq_carrier_service_code"),
        Index("idx_carrier_services_status", "status"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, comment="主键")
    carrier_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("carriers.id", ondelete="CASCADE"),
        nullable=False,
        comment="所属服务商ID",
    )
    service_code: Mapped[str] = mapped_column(String(64), nullable=False, comment="运输服务编码")
    service_name: Mapped[str] = mapped_column(String(128), nullable=False, comment="运输服务名称")
    description: Mapped[str | None] = mapped_column(Text, comment="运输服务描述")
    service_type: Mapped[str] = mapped_column(String(32), nullable=False, comment="运输服务类型")

    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default=CarrierServiceStatus.ACTIVE,
        server_default=CarrierServiceStatus.ACTIVE.value,
        comment="运输服务状态",
    )
    effective_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), comment="生效时间")
    expire_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), comment="失效时间")
    coverage_group_code: Mapped[str | None] = mapped_column(String(64), comment="覆盖分组编码")
    attributes: Mapped[dict[str, str] | None] = mapped_column("metadata", JSONB, comment="服务扩展信息")

    carrier: Mapped[Carrier] = relationship(back_populates="services")
    geo_groups: Mapped[list[CarrierServiceGeoGroup]] = relationship(
        back_populates="carrier_service",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class CarrierServiceGeoGroup(AuditMixin, Base):
    """Virtual region grouping for carrier service coverage."""

    __tablename__ = "carrier_service_geo_groups"
    __table_args__ = (
        UniqueConstraint("group_code", name="uq_carrier_geo_group_code"),
        Index("idx_carrier_geo_group_service", "carrier_service_id"),
        Index(
            "uq_active_carrier_geo_group",
            "carrier_service_id",
            unique=True,
            postgresql_where=text("status = 'ACTIVE'"),
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, comment="主键")
    carrier_service_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("carrier_services.id", ondelete="CASCADE"),
        nullable=False,
        comment="关联运输服务ID",
    )
    group_code: Mapped[str] = mapped_column(String(64), nullable=False, comment="虚拟区域分组编码")
    group_name: Mapped[str] = mapped_column(String(128), nullable=False, comment="虚拟区域分组名称")
    description: Mapped[str | None] = mapped_column(Text, comment="虚拟区域分组描述")
    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default=CarrierServiceGeoGroupStatus.SCHEDULED,
        server_default=CarrierServiceGeoGroupStatus.SCHEDULED.value,
        comment="分组状态",
    )
    effective_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), comment="生效时间")
    expire_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), comment="失效时间")
    attributes: Mapped[dict[str, str] | None] = mapped_column("metadata", JSONB, comment="分组扩展信息")

    carrier_service: Mapped[CarrierService] = relationship(back_populates="geo_groups")
    regions: Mapped[list[CarrierServiceGeoGroupRegion]] = relationship(
        back_populates="group",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class CarrierServiceGeoGroupRegion(AuditMixin, Base):
    """Mapping between geo groups and Regions."""

    __tablename__ = "carrier_service_geo_group_regions"
    __table_args__ = (
        UniqueConstraint("group_id", "region_code", name="uq_geo_group_region_code"),
        Index("idx_geo_group_region_group_id", "group_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, comment="主键")
    group_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("carrier_service_geo_groups.id", ondelete="CASCADE"),
        nullable=False,
        comment="虚拟区域分组ID",
    )
    region_code: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("regions.region_code"),
        nullable=False,
        comment="Region 区域编码",
    )
    region_level: Mapped[str | None] = mapped_column(String, comment="区域层级")
    priority: Mapped[int | None] = mapped_column(SmallInteger, comment="匹配优先级")
    attributes: Mapped[dict[str, str] | None] = mapped_column("metadata", JSONB, comment="覆盖范围扩展信息")

    group: Mapped[CarrierServiceGeoGroup] = relationship(back_populates="regions")
    region: Mapped[Region] = relationship()
