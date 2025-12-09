from __future__ import annotations

from datetime import datetime

from pydantic import Field, model_validator

from src.domain.billing.entities import PricingMode, RuleCategory, RuleChannel, RuleUnit, TemplateType
from src.intrastructure.database.models import BillingQuote, BillingTemplate, BillingTemplateRule
from src.intrastructure.database.models.billing import BillingQuotePayload, TemplateRuleTierRecord
from src.presentation.schema.base import CamelModel

# ============================================================================
# Template Rule Schemas
# ============================================================================


class TemplateRuleTierSchema(CamelModel):
    """模板规则阶梯价格."""

    min_value: int = Field(..., alias="minValue")
    max_value: int | None = Field(None, alias="maxValue")
    price: int
    description: str | None = None

    @classmethod
    def from_record(cls, record: TemplateRuleTierRecord) -> TemplateRuleTierSchema:
        return cls(
            minValue=record["min_value"],
            maxValue=record["max_value"],
            price=record["price"],
            description=record["description"],
        )


class TemplateRuleSchema(CamelModel):
    """模板规则."""

    charge_code: str = Field(..., alias="chargeCode")
    charge_name: str = Field(..., alias="chargeName")
    category: RuleCategory
    channel: RuleChannel
    unit: RuleUnit
    pricing_mode: PricingMode = Field(..., alias="pricingMode")
    price: int | None = None
    tiers: list[TemplateRuleTierSchema] | None = None
    description: str | None = None
    support_only: bool = Field(False, alias="supportOnly")

    @model_validator(mode="after")
    def normalize_tiered_price(self) -> TemplateRuleSchema:
        """Tiered 规则的 price=0 视作未定义."""
        if self.pricing_mode == PricingMode.TIERED and self.price == 0:
            self.price = None
        return self

    @classmethod
    def from_model(cls, model: BillingTemplateRule) -> TemplateRuleSchema:
        tiers = None
        if model.tiers:
            tiers = [TemplateRuleTierSchema.from_record(tier) for tier in model.tiers]
        return cls(
            chargeCode=model.charge_code,
            chargeName=model.charge_name,
            category=RuleCategory(model.category),
            channel=RuleChannel(model.channel),
            unit=RuleUnit(model.unit),
            pricingMode=PricingMode(model.pricing_mode),
            price=model.price,
            tiers=tiers,
            description=model.description,
            supportOnly=model.support_only,
        )


# ============================================================================
# Template Schemas
# ============================================================================


class BillingTemplateListItemSchema(CamelModel):
    """计费模板列表项."""

    id: int
    template_code: str = Field(..., alias="templateCode")
    template_name: str = Field(..., alias="templateName")
    template_type: TemplateType = Field(..., alias="templateType")
    business_domain: str = Field(..., alias="businessDomain")
    description: str | None = None
    effective_date: datetime = Field(..., alias="effectiveDate")
    expire_date: datetime | None = Field(None, alias="expireDate")
    version: int
    customer_id: int | None = Field(None, alias="customerId")
    customer_group_id: int | None = Field(None, alias="customerGroupId")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    @classmethod
    def from_model(cls, model: BillingTemplate) -> BillingTemplateListItemSchema:
        return cls(
            id=model.id,
            templateCode=model.template_code,
            templateName=model.template_name,
            templateType=TemplateType(model.template_type),
            businessDomain=model.business_domain,
            description=model.description,
            effectiveDate=model.effective_date,
            expireDate=model.expire_date,
            version=model.version,
            customerId=model.customer_id,
            customerGroupId=model.customer_group_id,
            createdAt=model.created_at,
            updatedAt=model.updated_at,
        )


class BillingTemplateDetailSchema(CamelModel):
    """计费模板详情."""

    id: int
    template_code: str = Field(..., alias="templateCode")
    template_name: str = Field(..., alias="templateName")
    template_type: TemplateType = Field(..., alias="templateType")
    business_domain: str = Field(..., alias="businessDomain")
    description: str | None = None
    effective_date: datetime = Field(..., alias="effectiveDate")
    expire_date: datetime | None = Field(None, alias="expireDate")
    version: int
    customer_id: int | None = Field(None, alias="customerId")
    customer_group_id: int | None = Field(None, alias="customerGroupId")
    rules: list[TemplateRuleSchema]
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    @classmethod
    def from_model(cls, model: BillingTemplate) -> BillingTemplateDetailSchema:
        return cls(
            id=model.id,
            templateCode=model.template_code,
            templateName=model.template_name,
            templateType=TemplateType(model.template_type),
            businessDomain=model.business_domain,
            description=model.description,
            effectiveDate=model.effective_date,
            expireDate=model.expire_date,
            version=model.version,
            customerId=model.customer_id,
            customerGroupId=model.customer_group_id,
            rules=[TemplateRuleSchema.from_model(rule) for rule in model.rules],
            createdAt=model.created_at,
            updatedAt=model.updated_at,
        )


class BillingTemplateCreateSchema(CamelModel):
    """创建计费模板请求."""

    template_code: str = Field(..., alias="templateCode")
    template_name: str = Field(..., alias="templateName")
    template_type: TemplateType = Field(..., alias="templateType")
    # business_domain: str = Field(..., alias="businessDomain")
    description: str | None = None
    effective_date: datetime = Field(..., alias="effectiveDate")
    expire_date: datetime | None = Field(None, alias="expireDate")
    customer_id: int | None = Field(None, alias="customerId")
    customer_group_id: int | None = Field(None, alias="customerGroupId")
    rules: list[TemplateRuleSchema]


class BillingTemplateUpdateSchema(CamelModel):
    """更新计费模板请求."""

    template_name: str = Field(..., alias="templateName")
    description: str | None = None
    effective_date: datetime = Field(..., alias="effectiveDate")
    expire_date: datetime | None = Field(None, alias="expireDate")
    version: int
    customer_id: int | None = Field(None, alias="customerId")
    customer_group_id: int | None = Field(None, alias="customerGroupId")
    rules: list[TemplateRuleSchema]


class BillingTemplateListResponse(CamelModel):
    """计费模板列表响应."""

    items: list[BillingTemplateListItemSchema]
    total: int


# ============================================================================
# Quote Schemas
# ============================================================================


class BillingQuoteSchema(CamelModel):
    """报价单."""

    id: int
    quote_code: str = Field(..., alias="quoteCode")
    template_id: int = Field(..., alias="templateId")
    template_version: int = Field(..., alias="templateVersion")
    scope_type: str = Field(..., alias="scopeType")
    scope_priority: int = Field(..., alias="scopePriority")
    customer_id: int | None = Field(None, alias="customerId")
    customer_group_id: int | None = Field(None, alias="customerGroupId")
    business_domain: str = Field(..., alias="businessDomain")
    status: str
    effective_date: datetime = Field(..., alias="effectiveDate")
    expire_date: datetime | None = Field(None, alias="expireDate")
    payload: BillingQuotePayload
    created_at: datetime = Field(..., alias="createdAt")

    @classmethod
    def from_model(cls, model: BillingQuote) -> BillingQuoteSchema:
        return cls(
            id=model.id,
            quoteCode=model.quote_code,
            templateId=model.template_id,
            templateVersion=model.template_version,
            scopeType=model.scope_type,
            scopePriority=model.scope_priority,
            customerId=model.customer_id,
            customerGroupId=model.customer_group_id,
            businessDomain=model.business_domain,
            status=model.status,
            effectiveDate=model.effective_date,
            expireDate=model.expire_date,
            payload=model.payload,
            createdAt=model.created_at,
        )


class BillingQuoteListResponse(CamelModel):
    """报价单列表响应."""

    items: list[BillingQuoteSchema]
    total: int
