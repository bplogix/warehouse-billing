from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    PrimaryKeyConstraint,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import AuditMixin, Base

if TYPE_CHECKING:
    from .company import Company
    from .domain import BusinessDomain


class CustomerStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class Customer(AuditMixin, Base):
    __tablename__ = "customers"
    __table_args__ = (UniqueConstraint("customer_name", "customer_code", name="uq_customer_name_code"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    customer_name: Mapped[str] = mapped_column(String(128), nullable=False)
    customer_code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    address: Mapped[str] = mapped_column(String(256), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(128), nullable=False)
    contact_person: Mapped[str] = mapped_column(String(64), nullable=False)
    operation_name: Mapped[str] = mapped_column(String(64), nullable=False)
    operation_uid: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[CustomerStatus] = mapped_column(SAEnum(CustomerStatus), nullable=False)
    company_id: Mapped[str] = mapped_column(String(64), ForeignKey("companies.company_id"), nullable=False)
    business_domain: Mapped[str] = mapped_column(String(64), ForeignKey("business_domains.code"), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    source_ref_id: Mapped[str | None] = mapped_column(String(128))
    bonded_license_no: Mapped[str | None] = mapped_column(String(64))
    customs_code: Mapped[str | None] = mapped_column(String(64))
    company: Mapped[Company] = relationship(back_populates="customers")
    business_domain_rel: Mapped[BusinessDomain] = relationship(back_populates="customers")
    groups: Mapped[list[CustomerGroupMember]] = relationship(back_populates="customer")


class CustomerGroup(AuditMixin, Base):
    __tablename__ = "customer_groups"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(String(256))
    business_domain: Mapped[str] = mapped_column(String(64), ForeignKey("business_domains.code"), nullable=False)
    members: Mapped[list[CustomerGroupMember]] = relationship(back_populates="group")
    business_domain_rel: Mapped[BusinessDomain] = relationship(back_populates="groups")


class CustomerGroupMember(AuditMixin, Base):
    __tablename__ = "customer_group_members"
    __table_args__ = (
        PrimaryKeyConstraint("group_id", "customer_id", name="pk_customer_group_member"),
        Index("idx_group_member_customer", "customer_id"),
    )

    group_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("customer_groups.id"), nullable=False)
    customer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("customers.id"), nullable=False)
    business_domain: Mapped[str] = mapped_column(String(64), ForeignKey("business_domains.code"), nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    group: Mapped[CustomerGroup] = relationship(back_populates="members")
    customer: Mapped[Customer] = relationship(back_populates="groups")
