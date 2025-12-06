from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import AuditMixin, Base

if TYPE_CHECKING:
    from .customer import Customer


class Company(AuditMixin, Base):
    __tablename__ = "companies"

    company_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    company_name: Mapped[str] = mapped_column(String(128), nullable=False)
    company_code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    company_corporation: Mapped[str] = mapped_column(String(64), nullable=False)
    company_phone: Mapped[str] = mapped_column(String(32), nullable=False)
    company_email: Mapped[str] = mapped_column(String(128), nullable=False)
    company_address: Mapped[str] = mapped_column(String(256), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    source_ref_id: Mapped[str | None] = mapped_column(String(128))
    created_via_import: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    customers: Mapped[list[Customer]] = relationship(back_populates="company")
