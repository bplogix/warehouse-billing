from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, cast

from src.shared.logger.factories import domain_logger

logger = domain_logger.bind(component="billing_domain")


class BillingDomainError(ValueError):
    """Domain level invariant violation."""


class TemplateType(str, Enum):
    GLOBAL = "GLOBAL"
    GROUP = "GROUP"
    CUSTOMER = "CUSTOMER"


class PricingMode(str, Enum):
    FLAT = "FLAT"
    TIERED = "TIERED"


class RuleCategory(str, Enum):
    STORAGE = "STORAGE"
    INBOUND_OUTBOUND = "INBOUND_OUTBOUND"
    TRANSPORT = "TRANSPORT"
    RETURN = "RETURN"
    MATERIAL = "MATERIAL"
    MANUAL = "MANUAL"


class RuleChannel(str, Enum):
    AUTO = "AUTO"
    SCAN = "SCAN"
    MANUAL = "MANUAL"


class RuleUnit(str, Enum):
    PIECE = "PIECE"
    PALLET = "PALLET"
    ORDER = "ORDER"
    CBM_DAY = "CBM_DAY"
    CBM_MONTH = "CBM_MONTH"
    KG_DAY = "KG_DAY"
    KG_MONTH = "KG_MONTH"


class QuoteScope(str, Enum):
    CUSTOMER = "CUSTOMER"
    GROUP = "GROUP"
    GLOBAL = "GLOBAL"


class QuoteStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


SCOPE_PRIORITY: dict[QuoteScope, int] = {
    QuoteScope.CUSTOMER: 3,
    QuoteScope.GROUP: 2,
    QuoteScope.GLOBAL: 1,
}

SUPPORT_ONLY_CATEGORIES = {RuleCategory.TRANSPORT, RuleCategory.MANUAL}
FLAT_ONLY_CATEGORIES = {RuleCategory.INBOUND_OUTBOUND, RuleCategory.RETURN, RuleCategory.MATERIAL}


def _ensure_positive(value: int, field_name: str) -> None:
    if value < 0:
        raise BillingDomainError(f"{field_name} must be non-negative")


@dataclass(slots=True)
class TemplateRuleTier:
    min_value: int
    max_value: int | None
    price: int
    description: str | None = None

    def __post_init__(self) -> None:
        _ensure_positive(self.min_value, "min_value")
        _ensure_positive(self.price, "price")
        if self.max_value is not None and self.max_value <= self.min_value:
            raise BillingDomainError("max_value must be greater than min_value")

    def to_dict(self) -> dict[str, Any]:
        return {
            "minValue": self.min_value,
            "maxValue": self.max_value,
            "price": self.price,
            "description": self.description,
        }


@dataclass(slots=True)
class TemplateRule:
    charge_code: str
    charge_name: str
    category: RuleCategory
    channel: RuleChannel
    unit: RuleUnit
    pricing_mode: PricingMode
    price: int | None = None
    tiers: Sequence[TemplateRuleTier | dict[str, Any]] | None = None
    description: str | None = None
    support_only: bool = False

    def __post_init__(self) -> None:
        self.charge_code = self.charge_code.strip()
        self.charge_name = self.charge_name.strip()
        if not self.charge_code or not self.charge_name:
            raise BillingDomainError("charge_code and charge_name are required")
        self.tiers = [self._coerce_tier(tier) for tier in (self.tiers or [])]
        self._validate_struct()

    def _coerce_tier(self, tier: TemplateRuleTier | dict[str, Any]) -> TemplateRuleTier:
        if isinstance(tier, TemplateRuleTier):
            return tier
        if isinstance(tier, dict):
            return TemplateRuleTier(**tier)
        raise BillingDomainError("tier must be TemplateRuleTier or dict")

    def _validate_struct(self) -> None:
        if self.category in FLAT_ONLY_CATEGORIES and self.pricing_mode != PricingMode.FLAT:
            raise BillingDomainError(f"{self.category.value} only supports FLAT pricing")
        if self.category in SUPPORT_ONLY_CATEGORIES:
            if not self.support_only:
                raise BillingDomainError(f"{self.category.value} rules must mark support_only")
            if self.price is not None:
                raise BillingDomainError(f"{self.category.value} rules cannot carry price")
            if self.tiers:
                raise BillingDomainError(f"{self.category.value} rules cannot have tiers")
            return
        if self.pricing_mode == PricingMode.FLAT:
            if self.price is None:
                raise BillingDomainError("flat pricing requires price value")
            if self.tiers:
                raise BillingDomainError("flat pricing cannot define tiers")
        elif self.pricing_mode == PricingMode.TIERED:
            if not self.tiers:
                raise BillingDomainError("tiered pricing requires tier definitions")
            if self.price is not None:
                raise BillingDomainError("tiered pricing cannot include price field")
            self._validate_tiers()
        else:  # pragma: no cover - enum guard
            raise BillingDomainError("unknown pricing mode")

    def _tier_items(self) -> list[TemplateRuleTier]:
        return cast(list[TemplateRuleTier], self.tiers)

    def _validate_tiers(self) -> None:
        tiers = sorted(self._tier_items(), key=lambda item: item.min_value)
        last_max: int | None = None
        for idx, tier in enumerate(tiers):
            min_value = tier.min_value
            if idx > 0 and last_max is not None and min_value < last_max:
                raise BillingDomainError("tier ranges cannot overlap")
            if idx > 0 and last_max is None:
                raise BillingDomainError("unbounded tier must be last entry")
            last_max = tier.max_value
        self.tiers = tiers

    def to_dict(self) -> dict[str, Any]:
        return {
            "chargeCode": self.charge_code,
            "chargeName": self.charge_name,
            "category": self.category.value,
            "channel": self.channel.value,
            "unit": self.unit.value,
            "pricingMode": self.pricing_mode.value,
            "price": self.price,
            "tiers": [tier.to_dict() for tier in self._tier_items()] or None,
            "description": self.description,
            "supportOnly": self.support_only,
        }

    def clone(self) -> TemplateRule:
        return TemplateRule(
            charge_code=self.charge_code,
            charge_name=self.charge_name,
            category=self.category,
            channel=self.channel,
            unit=self.unit,
            pricing_mode=self.pricing_mode,
            price=self.price,
            tiers=[tier.to_dict() for tier in self._tier_items()],
            description=self.description,
            support_only=self.support_only,
        )


@dataclass(slots=True)
class BillingTemplate:
    template_code: str
    template_name: str
    template_type: TemplateType
    business_domain: str
    effective_date: datetime
    expire_date: datetime | None
    description: str | None = None
    customer_id: int | None = None
    customer_group_id: int | None = None
    rules: Sequence[TemplateRule | dict[str, Any]] = field(default_factory=list)
    id: int | None = None

    def __post_init__(self) -> None:
        self.template_code = self.template_code.strip()
        self.template_name = self.template_name.strip()
        self.business_domain = self.business_domain.strip()
        if not self.template_code or not self.template_name or not self.business_domain:
            raise BillingDomainError("template_code, template_name and business_domain are required")
        self.rules = [self._coerce_rule(rule) for rule in self.rules]
        self._ensure_period()
        self._ensure_scope()
        self._ensure_rules()

    def _coerce_rule(self, rule: TemplateRule | dict[str, Any]) -> TemplateRule:
        if isinstance(rule, TemplateRule):
            return rule
        if isinstance(rule, dict):
            return TemplateRule(**rule)
        raise BillingDomainError("rule must be TemplateRule or dict")

    def _rule_items(self) -> list[TemplateRule]:
        return cast(list[TemplateRule], self.rules)

    def _ensure_period(self) -> None:
        if self.expire_date and self.expire_date < self.effective_date:
            raise BillingDomainError("expire_date must be greater than effective_date")

    def _ensure_scope(self) -> None:
        if self.template_type is TemplateType.CUSTOMER:
            if self.customer_id is None:
                raise BillingDomainError("customer template requires customer_id")
            if self.customer_group_id is not None:
                raise BillingDomainError("customer template cannot set group id")
        elif self.template_type is TemplateType.GROUP:
            if self.customer_group_id is None:
                raise BillingDomainError("group template requires customer_group_id")
            self.customer_id = None
        elif self.template_type is TemplateType.GLOBAL:
            if self.customer_id is not None or self.customer_group_id is not None:
                raise BillingDomainError("global template cannot bind customer info")

    def _ensure_rules(self) -> None:
        if not self.rules:
            raise BillingDomainError("template must contain at least one rule")

    def replace_rules(self, rules: Sequence[TemplateRule | dict[str, Any]]) -> None:
        new_rules = [self._coerce_rule(rule) for rule in rules]
        if not new_rules:
            raise BillingDomainError("rules cannot be empty")
        self.rules = new_rules
        self._ensure_rules()

    def schedule(self, effective_date: datetime, expire_date: datetime | None) -> None:
        self.effective_date = effective_date
        self.expire_date = expire_date
        self._ensure_period()

    def _resolve_scope_targets(
        self, *, customer_id: int | None, customer_group_id: int | None
    ) -> tuple[QuoteScope, int, int | None, int | None]:
        if self.template_type is TemplateType.CUSTOMER:
            resolved_customer_id = customer_id or self.customer_id
            if resolved_customer_id is None:
                raise BillingDomainError("customer quote requires customer_id")
            return QuoteScope.CUSTOMER, SCOPE_PRIORITY[QuoteScope.CUSTOMER], resolved_customer_id, None
        if self.template_type is TemplateType.GROUP:
            resolved_group_id = customer_group_id or self.customer_group_id
            if resolved_group_id is None:
                raise BillingDomainError("group quote requires a valid customer_group_id")
            return QuoteScope.GROUP, SCOPE_PRIORITY[QuoteScope.GROUP], None, resolved_group_id
        return QuoteScope.GLOBAL, SCOPE_PRIORITY[QuoteScope.GLOBAL], None, None

    def snapshot_payload(self) -> dict[str, Any]:
        return {
            "template": {
                "templateCode": self.template_code,
                "templateName": self.template_name,
                "templateType": self.template_type.value,
                "businessDomain": self.business_domain,
                "description": self.description,
                "effectiveDate": self.effective_date.isoformat(),
                "expireDate": self.expire_date.isoformat() if self.expire_date else None,
                "customerId": self.customer_id,
                "customerGroupId": self.customer_group_id,
            },
            "rules": [rule.to_dict() for rule in self._rule_items()],
        }

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "templateCode": self.template_code,
            "templateName": self.template_name,
            "templateType": self.template_type.value,
            "businessDomain": self.business_domain,
            "description": self.description,
            "effectiveDate": self.effective_date.isoformat(),
            "expireDate": self.expire_date.isoformat() if self.expire_date else None,
            "customerId": self.customer_id,
            "customerGroupId": self.customer_group_id,
            "rules": [rule.to_dict() for rule in self._rule_items()],
        }

    def create_quote(
        self,
        quote_code: str,
        *,
        template_id: int | None = None,
        customer_id: int | None = None,
        customer_group_id: int | None = None,
        effective_date: datetime | None = None,
        expire_date: datetime | None = None,
    ) -> BillingQuote:
        scope_type, priority, resolved_customer_id, resolved_group_id = self._resolve_scope_targets(
            customer_id=customer_id, customer_group_id=customer_group_id
        )
        return BillingQuote(
            quote_code=quote_code,
            template_id=template_id or self.id,
            scope_type=scope_type,
            scope_priority=priority,
            customer_id=resolved_customer_id,
            customer_group_id=resolved_group_id,
            business_domain=self.business_domain,
            status=QuoteStatus.ACTIVE,
            effective_date=effective_date or self.effective_date,
            expire_date=expire_date or self.expire_date,
            payload=self.snapshot_payload(),
        )


@dataclass(slots=True)
class BillingQuote:
    quote_code: str
    scope_type: QuoteScope
    scope_priority: int
    business_domain: str
    effective_date: datetime
    expire_date: datetime | None
    status: QuoteStatus = QuoteStatus.ACTIVE
    payload: dict[str, Any] = field(default_factory=dict)
    template_id: int | None = None
    customer_id: int | None = None
    customer_group_id: int | None = None
    id: int | None = None

    def mark_inactive(self) -> None:
        if self.status == QuoteStatus.INACTIVE:
            return
        logger.info("quote marked inactive", quote_code=self.quote_code, scope=self.scope_type.value)
        self.status = QuoteStatus.INACTIVE

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "quoteCode": self.quote_code,
            "templateId": self.template_id,
            "scopeType": self.scope_type.value,
            "scopePriority": self.scope_priority,
            "businessDomain": self.business_domain,
            "status": self.status.value,
            "effectiveDate": self.effective_date.isoformat(),
            "expireDate": self.expire_date.isoformat() if self.expire_date else None,
            "customerId": self.customer_id,
            "customerGroupId": self.customer_group_id,
            "payload": self.payload,
        }
