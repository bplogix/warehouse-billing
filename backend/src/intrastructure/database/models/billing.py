from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, TypedDict

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.domain.billing.entities import QuoteStatus

from .base import AuditMixin, Base

if TYPE_CHECKING:
    from .customer import Customer, CustomerGroup
    from .domain import BusinessDomain


class TemplateRuleTierRecord(TypedDict):
    """JSON structure stored for tier definition."""

    min_value: int
    max_value: int | None
    price: int
    description: str | None


class QuoteTemplatePayload(TypedDict):
    templateCode: str
    templateName: str
    templateType: str
    businessDomain: str
    description: str | None
    effectiveDate: str
    expireDate: str | None
    version: int
    customerId: int | None
    customerGroupId: int | None


class QuoteRuleTierPayload(TypedDict):
    minValue: int
    maxValue: int | None
    price: int
    description: str | None


class QuoteRulePayload(TypedDict):
    chargeCode: str
    chargeName: str
    category: str
    channel: str
    unit: str
    pricingMode: str
    price: int | None
    tiers: list[QuoteRuleTierPayload] | None
    description: str | None
    supportOnly: bool


class BillingQuotePayload(TypedDict):
    template: QuoteTemplatePayload
    rules: list[QuoteRulePayload]


class BillingTemplate(AuditMixin, Base):
    """计费模板主实体."""

    __tablename__ = "billing_templates"
    __table_args__ = (
        UniqueConstraint("template_code", name="uq_billing_template_code"),
        Index("idx_billing_template_type", "template_type"),
        Index("idx_billing_template_customer", "customer_id"),
        Index("idx_billing_template_group_ids", "customer_group_ids", postgresql_using="gin"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    template_code: Mapped[str] = mapped_column(String(64), nullable=False)
    template_name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(String(512))
    template_type: Mapped[str] = mapped_column(String(16), nullable=False)
    business_domain: Mapped[str] = mapped_column(String(64), ForeignKey("business_domains.code"), nullable=False)
    effective_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expire_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    customer_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("customers.id"))
    customer_group_ids: Mapped[list[int] | None] = mapped_column(JSONB)

    business_domain_rel: Mapped[BusinessDomain] = relationship()
    customer: Mapped[Customer | None] = relationship()
    rules: Mapped[list[BillingTemplateRule]] = relationship(
        back_populates="template",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    quotes: Mapped[list[BillingQuote]] = relationship(back_populates="template")


class BillingTemplateRule(AuditMixin, Base):
    """模板规则定义."""

    __tablename__ = "billing_template_rules"
    __table_args__ = (Index("idx_template_rules_template_id", "template_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    template_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("billing_templates.id", ondelete="CASCADE"), nullable=False
    )
    charge_code: Mapped[str] = mapped_column(String(64), nullable=False)
    charge_name: Mapped[str] = mapped_column(String(128), nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    channel: Mapped[str] = mapped_column(String(32), nullable=False)
    unit: Mapped[str] = mapped_column(String(32), nullable=False)
    pricing_mode: Mapped[str] = mapped_column(String(16), nullable=False)
    price: Mapped[int | None] = mapped_column(BigInteger)
    tiers: Mapped[list[TemplateRuleTierRecord] | None] = mapped_column(JSONB)
    description: Mapped[str | None] = mapped_column(Text)
    support_only: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default="false")

    template: Mapped[BillingTemplate] = relationship(back_populates="rules")


class BillingQuote(AuditMixin, Base):
    """报价单，根据模板快照生成."""

    __tablename__ = "billing_quotes"
    __table_args__ = (
        UniqueConstraint("quote_code", name="uq_billing_quote_code"),
        Index("idx_billing_quotes_template_id", "template_id"),
        Index("idx_billing_quotes_customer", "customer_id"),
        Index("idx_billing_quotes_group", "customer_group_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    quote_code: Mapped[str] = mapped_column(String(64), nullable=False)
    template_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("billing_templates.id"), nullable=False)
    template_version: Mapped[int] = mapped_column(Integer, nullable=False)
    scope_type: Mapped[str] = mapped_column(String(16), nullable=False)
    scope_priority: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    customer_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("customers.id"))
    customer_group_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("customer_groups.id"))
    business_domain: Mapped[str] = mapped_column(String(64), ForeignKey("business_domains.code"), nullable=False)
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default=QuoteStatus.ACTIVE.value, server_default=QuoteStatus.ACTIVE.value
    )
    effective_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expire_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    payload: Mapped[BillingQuotePayload] = mapped_column(JSONB, nullable=False)
    template: Mapped[BillingTemplate] = relationship(back_populates="quotes")
    business_domain_rel: Mapped[BusinessDomain] = relationship()
    customer: Mapped[Customer | None] = relationship()
    customer_group: Mapped[CustomerGroup | None] = relationship()
