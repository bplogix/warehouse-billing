from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import datetime

from src.domain.billing.entities import (
    DecimalInput,
    PricingMode,
    QuoteStatus,
    RuleCategory,
    RuleChannel,
    RuleUnit,
    TemplateStatus,
    TemplateType,
)


@dataclass(slots=True)
class TemplateRuleTierInput:
    min_value: DecimalInput
    max_value: DecimalInput | None
    price: DecimalInput
    description: str | None = None


@dataclass(slots=True)
class TemplateRuleInput:
    charge_code: str
    charge_name: str
    category: RuleCategory
    channel: RuleChannel
    unit: RuleUnit
    pricing_mode: PricingMode
    price: DecimalInput | None = None
    tiers: Sequence[TemplateRuleTierInput] | None = None
    description: str | None = None
    support_only: bool = False


@dataclass(slots=True)
class CreateBillingTemplateCommand:
    template_code: str
    template_name: str
    template_type: TemplateType
    business_domain: str
    effective_date: datetime
    expire_date: datetime | None = None
    description: str | None = None
    customer_id: int | None = None
    customer_group_ids: Sequence[int] | None = None
    rules: Sequence[TemplateRuleInput] = field(default_factory=list)


@dataclass(slots=True)
class UpdateBillingTemplateCommand:
    template_id: int
    version: int
    template_name: str
    effective_date: datetime
    expire_date: datetime | None = None
    description: str | None = None
    customer_id: int | None = None
    customer_group_ids: Sequence[int] | None = None
    rules: Sequence[TemplateRuleInput] = field(default_factory=list)


@dataclass(slots=True)
class QueryBillingTemplatesCommand:
    template_type: TemplateType
    keyword: str | None = None
    status: TemplateStatus | None = None
    customer_id: int | None = None
    customer_group_id: int | None = None
    limit: int = 20
    offset: int = 0


@dataclass(slots=True)
class ChangeTemplateStatusCommand:
    template_id: int
    version: int
    target_status: TemplateStatus


@dataclass(slots=True)
class QueryBillingQuotesCommand:
    template_id: int | None = None
    customer_id: int | None = None
    customer_group_id: int | None = None
    status: QuoteStatus | None = None
    limit: int = 20
    offset: int = 0
