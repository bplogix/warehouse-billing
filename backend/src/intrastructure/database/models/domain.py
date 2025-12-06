from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import AuditMixin, Base

if TYPE_CHECKING:
    from .customer import Customer, CustomerGroup


class BusinessDomain(AuditMixin, Base):
    __tablename__ = "business_domains"

    code: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str | None] = mapped_column(String(256))

    customers: Mapped[list[Customer]] = relationship(back_populates="business_domain_rel")
    groups: Mapped[list[CustomerGroup]] = relationship(back_populates="business_domain_rel")
