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


class CarrierServiceTariffSnapshotStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


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
    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default=CarrierServiceStatus.ACTIVE,
        server_default=CarrierServiceStatus.ACTIVE.value,
        comment="运输服务状态",
    )
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


class CarrierServiceTariff(AuditMixin, Base):
    """承运商服务多维度运费矩阵."""

    __tablename__ = "carrier_service_tariffs"
    __table_args__ = (
        UniqueConstraint(
            "carrier_service_id",
            "geo_group_id",
            "weight_max_kg",
            "volume_max_cm3",
            "girth_max_cm",
            name="uq_carrier_tariff_dimension",
        ),
        Index("idx_carrier_tariff_geo_group", "geo_group_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, comment="主键")
    carrier_service_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("carrier_services.id", ondelete="CASCADE"),
        nullable=False,
        comment="关联承运商服务",
    )
    geo_group_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("carrier_service_geo_groups.id", ondelete="CASCADE"),
        nullable=False,
        comment="关联覆盖分组ID",
    )
    weight_max_kg: Mapped[float | None] = mapped_column(comment="重量上限(kg)")
    volume_max_cm3: Mapped[int | None] = mapped_column(comment="体积上限(cm^3)")
    girth_max_cm: Mapped[int | None] = mapped_column(comment="三边合计上限(cm)")
    currency: Mapped[str] = mapped_column(
        String(8), nullable=False, default="JPY", server_default="JPY", comment="币种"
    )
    price_amount: Mapped[int] = mapped_column(BigInteger, nullable=False, comment="价格(最小货币单位)")

    carrier_service: Mapped[CarrierService] = relationship()
    geo_group: Mapped[CarrierServiceGeoGroup] = relationship()


class CarrierServiceTariffSnapshot(AuditMixin, Base):
    """承运商服务运费快照（业务查询只读）."""

    __tablename__ = "carrier_service_tariff_snapshots"
    __table_args__ = (
        UniqueConstraint("carrier_id", "service_id", "version", name="uq_carrier_tariff_snapshot_version"),
        Index("idx_carrier_tariff_snapshot_service", "carrier_id", "service_id"),
        Index("idx_carrier_tariff_snapshot_effective", "effective_from"),
        Index(
            "idx_carrier_tariff_snapshot_lookup",
            "carrier_code",
            "service_code",
            "effective_from",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True, comment="主键")
    version: Mapped[int] = mapped_column(SmallInteger, nullable=False, comment="版本号")
    effective_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), comment="生效时间")
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), comment="失效时间")
    carrier_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("carriers.id", ondelete="CASCADE"),
        nullable=False,
        comment="承运商ID",
    )
    service_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("carrier_services.id", ondelete="CASCADE"),
        nullable=False,
        comment="运输服务ID",
    )
    carrier_code: Mapped[str] = mapped_column(String(64), nullable=False, comment="承运商编码")
    service_code: Mapped[str] = mapped_column(String(64), nullable=False, comment="运输服务编码")
    payload: Mapped[dict[str, object]] = mapped_column(JSONB, nullable=False, comment="运费二维矩阵结构")
    status: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        default=CarrierServiceTariffSnapshotStatus.ACTIVE,
        server_default=CarrierServiceTariffSnapshotStatus.ACTIVE.value,
        comment="快照状态",
    )
