from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from src.application.billing.commands import (
    CreateBillingTemplateCommand,
    QueryBillingQuotesCommand,
    QueryBillingTemplatesCommand,
    ResolveCustomerQuoteCommand,
    TemplateRuleInput,
    TemplateRuleTierInput,
    UpdateBillingTemplateCommand,
)
from src.domain.billing.entities import (
    BillingDomainError,
    BillingQuote as DomainQuote,
    BillingTemplate as DomainTemplate,
    PricingMode,
    QuoteScope,
    RuleCategory,
    RuleChannel,
    RuleUnit,
    TemplateRule,
    TemplateRuleTier,
    TemplateType,
)
from src.domain.customer import BusinessDomainGuard
from src.intrastructure.database.models import BillingQuote, BillingTemplate, BillingTemplateRule
from src.intrastructure.database.models.billing import TemplateRuleTierRecord
from src.intrastructure.repositories import (
    BillingQuoteRepository,
    BillingTemplateRepository,
    CustomerRepository,
)
from src.shared.logger.factories import app_logger
from src.shared.utils.random import generate_urlsafe_code

logger = app_logger.bind(component="billing_use_cases")


@dataclass(slots=True)
class QueryTemplatesResult:
    items: list[BillingTemplate]
    total: int


@dataclass(slots=True)
class QueryQuotesResult:
    items: list[BillingQuote]
    total: int


class CreateBillingTemplateUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._template_repo = BillingTemplateRepository(session)

    async def execute(
        self,
        cmd: CreateBillingTemplateCommand,
        operator: str | None = None,
    ) -> BillingTemplate:
        guard = BusinessDomainGuard.from_context()
        guard.ensure_access(cmd.business_domain)

        domain_template = _build_domain_template_from_payload(
            template_code=cmd.template_code,
            template_name=cmd.template_name,
            template_type=cmd.template_type,
            business_domain=cmd.business_domain,
            effective_date=cmd.effective_date,
            expire_date=cmd.expire_date,
            description=cmd.description,
            customer_id=cmd.customer_id,
            customer_group_id=cmd.customer_group_id,
            rules=cmd.rules,
        )
        orm_template = _to_template_model(domain_template, operator=operator)

        async with self._session.begin():
            if cmd.template_type is TemplateType.GLOBAL and await self._template_repo.exists_global_template():
                raise BillingDomainError("global template already exists")

            await self._template_repo.add(orm_template)
            domain_template.id = orm_template.id
            # 保存时立即生成报价单
            quote_repo = BillingQuoteRepository(self._session)
            await _regenerate_quotes(
                template=orm_template,
                domain_template=domain_template,
                repo=quote_repo,
                operator=operator,
            )

        logger.info("billing template created", template_code=orm_template.template_code, template_id=orm_template.id)
        await self._session.refresh(orm_template)
        return orm_template


class UpdateBillingTemplateUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._template_repo = BillingTemplateRepository(session)
        self._quote_repo = BillingQuoteRepository(session)

    async def execute(
        self,
        cmd: UpdateBillingTemplateCommand,
        operator: str | None = None,
    ) -> BillingTemplate | None:
        async with self._session.begin():
            template = await self._template_repo.get_by_id(cmd.template_id, with_rules=True)
            if template is None:
                return None

            guard = BusinessDomainGuard.from_context()
            guard.ensure_access(template.business_domain)

            template_type = TemplateType(template.template_type)
            domain_template = _build_domain_template_from_payload(
                template_code=template.template_code,
                template_name=cmd.template_name,
                template_type=template_type,
                business_domain=template.business_domain,
                effective_date=cmd.effective_date,
                expire_date=cmd.expire_date,
                description=cmd.description,
                customer_id=cmd.customer_id,
                customer_group_id=cmd.customer_group_id,
                rules=cmd.rules,
                template_id=template.id,
            )

            _apply_domain_template_to_model(domain_template, template, operator=operator)
            # 更新时旧报价单失效，生成新报价单
            await _regenerate_quotes(
                template=template,
                domain_template=domain_template,
                repo=self._quote_repo,
                operator=operator,
            )

        logger.info(
            "billing template updated",
            template_id=template.id,
        )
        await self._session.refresh(template)
        return template


class QueryBillingTemplatesUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._template_repo = BillingTemplateRepository(session)

    async def execute(self, cmd: QueryBillingTemplatesCommand) -> QueryTemplatesResult:
        guard = BusinessDomainGuard.from_context()
        domains = guard.allowed_domains
        logger.info(f"业务域: {domains}")
        items, total = await self._template_repo.search(
            template_type=cmd.template_type,
            business_domains=domains,
            keyword=cmd.keyword,
            customer_id=cmd.customer_id,
            customer_group_id=cmd.customer_group_id,
            limit=cmd.limit,
            offset=cmd.offset,
        )
        return QueryTemplatesResult(items=items, total=total)


class GetBillingTemplateDetailUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._template_repo = BillingTemplateRepository(session)

    async def execute(self, template_id: int) -> BillingTemplate | None:
        template = await self._template_repo.get_by_id(template_id, with_rules=True)
        if template is None:
            return None
        guard = BusinessDomainGuard.from_context()
        guard.ensure_access(template.business_domain)
        return template


class QueryBillingQuotesUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._quote_repo = BillingQuoteRepository(session)

    async def execute(self, cmd: QueryBillingQuotesCommand) -> QueryQuotesResult:
        guard = BusinessDomainGuard.from_context()
        domains = guard.allowed_domains
        items, total = await self._quote_repo.search(
            business_domains=domains,
            template_id=cmd.template_id,
            customer_id=cmd.customer_id,
            customer_group_id=cmd.customer_group_id,
            status=cmd.status,
            limit=cmd.limit,
            offset=cmd.offset,
        )
        return QueryQuotesResult(items=items, total=total)


class GetBillingQuoteDetailUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._quote_repo = BillingQuoteRepository(session)

    async def execute(self, quote_id: int) -> BillingQuote | None:
        quote = await self._quote_repo.get_by_id(quote_id, with_template=True)
        if quote is None:
            return None
        guard = BusinessDomainGuard.from_context()
        guard.ensure_access(quote.business_domain)
        return quote


class ResolveCustomerQuoteUseCase:
    """根据客户→客户组→全局优先级获取生效中的报价单."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._quote_repo = BillingQuoteRepository(session)
        self._customer_repo = CustomerRepository(session)

    async def execute(self, cmd: ResolveCustomerQuoteCommand) -> BillingQuote | None:
        customer = await self._customer_repo.get_detail(cmd.customer_id)
        if customer is None:
            return None

        guard = BusinessDomainGuard.from_context()
        guard.ensure_access(customer.business_domain)

        now = datetime.now(UTC)
        quote = await self._quote_repo.find_active_quote(
            scope=QuoteScope.CUSTOMER,
            business_domain=customer.business_domain,
            now=now,
            customer_id=customer.id,
        )
        if quote is not None:
            return quote

        group_members = sorted(
            (member for member in customer.groups if not member.is_deleted),
            key=lambda member: member.assigned_at or datetime.min.replace(tzinfo=UTC),
            reverse=True,
        )
        for member in group_members:
            quote = await self._quote_repo.find_active_quote(
                scope=QuoteScope.GROUP,
                business_domain=customer.business_domain,
                now=now,
                customer_group_id=member.group_id,
            )
            if quote is not None:
                return quote

        return await self._quote_repo.find_active_quote(
            scope=QuoteScope.GLOBAL,
            business_domain=customer.business_domain,
            now=now,
        )


class DeleteBillingTemplateUseCase:
    """删除计费模板（软删除）."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._template_repo = BillingTemplateRepository(session)
        self._quote_repo = BillingQuoteRepository(session)

    async def execute(self, template_id: int, operator: str | None = None) -> bool:
        """删除模板并失效关联报价单.

        Args:
            template_id: 模板ID
            operator: 操作人

        Returns:
            bool: 是否删除成功，False 表示模板不存在

        Raises:
            BillingDomainError: 权限检查失败
        """
        async with self._session.begin():
            template = await self._template_repo.get_by_id(template_id)
            if template is None:
                return False

            # 权限检查
            guard = BusinessDomainGuard.from_context()
            guard.ensure_access(template.business_domain)

            # 软删除模板
            template.is_deleted = True
            template.updated_by = operator
            # 将关联报价单标记为 INACTIVE
            await self._quote_repo.deactivate_by_template(template_id)

        logger.info("billing template deleted", template_id=template_id, operator=operator)
        return True


def _build_domain_template_from_payload(
    *,
    template_code: str,
    template_name: str,
    template_type: TemplateType,
    business_domain: str,
    effective_date: datetime,
    expire_date: datetime | None,
    description: str | None,
    customer_id: int | None,
    customer_group_id: int | None,
    rules: Sequence[TemplateRuleInput],
    template_id: int | None = None,
) -> DomainTemplate:
    domain_rules = _build_domain_rules(rules)
    return DomainTemplate(
        template_code=template_code,
        template_name=template_name,
        template_type=template_type,
        business_domain=business_domain,
        effective_date=effective_date,
        expire_date=expire_date,
        description=description,
        customer_id=customer_id,
        customer_group_id=customer_group_id,
        rules=domain_rules,
        id=template_id,
    )


def _build_domain_rules(payload: Sequence[TemplateRuleInput]) -> list[TemplateRule]:
    rules: list[TemplateRule] = []
    for rule in payload:
        tiers = _build_tiers(rule.tiers or [])
        rules.append(
            TemplateRule(
                charge_code=rule.charge_code,
                charge_name=rule.charge_name,
                category=rule.category,
                channel=rule.channel,
                unit=rule.unit,
                pricing_mode=rule.pricing_mode,
                price=rule.price,
                tiers=tiers,
                description=rule.description,
                support_only=rule.support_only,
            )
        )
    return rules


def _build_tiers(tiers: Sequence[TemplateRuleTierInput]) -> list[TemplateRuleTier]:
    built: list[TemplateRuleTier] = []
    for tier in tiers:
        built.append(
            TemplateRuleTier(
                min_value=tier.min_value,
                max_value=tier.max_value,
                price=tier.price,
                description=tier.description,
            )
        )
    return built


def _serialize_rule(rule: TemplateRule) -> BillingTemplateRule:
    orm_rule = BillingTemplateRule(
        charge_code=rule.charge_code,
        charge_name=rule.charge_name,
        category=rule.category.value,
        channel=rule.channel.value,
        unit=rule.unit.value,
        pricing_mode=rule.pricing_mode.value,
        price=rule.price,
        tiers=[_serialize_tier(tier) for tier in rule._tier_items()] or None,
        description=rule.description,
        support_only=rule.support_only,
    )
    return orm_rule


def _serialize_tier(tier: TemplateRuleTier) -> TemplateRuleTierRecord:
    return TemplateRuleTierRecord(
        min_value=tier.min_value,
        max_value=tier.max_value,
        price=tier.price,
        description=tier.description,
    )


def _to_template_model(domain_template: DomainTemplate, operator: str | None) -> BillingTemplate:
    template = BillingTemplate(
        template_code=domain_template.template_code,
        template_name=domain_template.template_name,
        template_type=domain_template.template_type.value,
        business_domain=domain_template.business_domain,
        description=domain_template.description,
        effective_date=domain_template.effective_date,
        expire_date=domain_template.expire_date,
        customer_id=domain_template.customer_id,
        customer_group_id=domain_template.customer_group_id,
    )
    template.created_by = operator
    template.updated_by = operator
    template.rules = []
    for rule in domain_template._rule_items():
        orm_rule = _serialize_rule(rule)
        orm_rule.created_by = operator
        orm_rule.updated_by = operator
        template.rules.append(orm_rule)
    return template


def _apply_domain_template_to_model(
    domain_template: DomainTemplate,
    template: BillingTemplate,
    operator: str | None,
) -> None:
    template.template_name = domain_template.template_name
    template.description = domain_template.description
    template.effective_date = domain_template.effective_date
    template.expire_date = domain_template.expire_date
    template.customer_id = domain_template.customer_id
    template.customer_group_id = domain_template.customer_group_id
    template.updated_by = operator
    template.rules.clear()
    for rule in domain_template._rule_items():
        orm_rule = _serialize_rule(rule)
        orm_rule.created_by = operator
        orm_rule.updated_by = operator
        template.rules.append(orm_rule)


def _build_domain_template_from_model(template: BillingTemplate) -> DomainTemplate:
    template_type = TemplateType(template.template_type)
    rules = [_deserialize_rule(rule) for rule in template.rules]
    return DomainTemplate(
        template_code=template.template_code,
        template_name=template.template_name,
        template_type=template_type,
        business_domain=template.business_domain,
        effective_date=template.effective_date,
        expire_date=template.expire_date,
        description=template.description,
        customer_id=template.customer_id,
        customer_group_id=template.customer_group_id,
        rules=rules,
        id=template.id,
    )


def _deserialize_rule(rule: BillingTemplateRule) -> TemplateRule:
    tiers_payload = rule.tiers or []
    tiers = [TemplateRuleTier(**payload) for payload in tiers_payload]
    return TemplateRule(
        charge_code=rule.charge_code,
        charge_name=rule.charge_name,
        category=RuleCategory(rule.category),
        channel=RuleChannel(rule.channel),
        unit=RuleUnit(rule.unit),
        pricing_mode=PricingMode(rule.pricing_mode),
        price=rule.price,
        tiers=tiers,
        description=rule.description,
        support_only=rule.support_only,
    )


async def _regenerate_quotes(
    *,
    template: BillingTemplate,
    domain_template: DomainTemplate,
    repo: BillingQuoteRepository,
    operator: str | None,
) -> None:
    quotes = _build_domain_quotes(domain_template)
    orm_quotes: list[BillingQuote] = []
    for quote in quotes:
        await repo.deactivate_scope_quotes(
            scope_type=quote.scope_type,
            business_domain=quote.business_domain,
            customer_id=quote.customer_id,
            customer_group_id=quote.customer_group_id,
        )
        orm_quote = _to_quote_model(quote)
        orm_quote.template_id = template.id
        orm_quote.created_by = operator
        orm_quote.updated_by = operator
        orm_quotes.append(orm_quote)
    await repo.add_all(orm_quotes)


def _build_domain_quotes(template: DomainTemplate) -> list[DomainQuote]:
    if template.id is None:
        raise BillingDomainError("template must be persisted before generating quotes")
    quotes: list[DomainQuote] = []
    if template.template_type is TemplateType.CUSTOMER:
        quotes.append(
            template.create_quote(
                quote_code=_generate_quote_code(template.template_code, QuoteScope.CUSTOMER),
                customer_id=template.customer_id,
            )
        )
        return quotes
    if template.template_type is TemplateType.GROUP:
        if template.customer_group_id is None:
            raise BillingDomainError("group template missing customer_group_id")
        quotes.append(
            template.create_quote(
                quote_code=_generate_quote_code(template.template_code, QuoteScope.GROUP),
                customer_group_id=template.customer_group_id,
            )
        )
        return quotes
    quotes.append(
        template.create_quote(
            quote_code=_generate_quote_code(template.template_code, QuoteScope.GLOBAL),
        )
    )
    return quotes


def _generate_quote_code(template_code: str, scope: QuoteScope) -> str:
    token = generate_urlsafe_code(8)
    return f"{template_code}-{scope.value}-{token}".upper()


def _to_quote_model(quote: DomainQuote) -> BillingQuote:
    return BillingQuote(
        quote_code=quote.quote_code,
        template_id=quote.template_id,
        scope_type=quote.scope_type.value,
        scope_priority=quote.scope_priority,
        customer_id=quote.customer_id,
        customer_group_id=quote.customer_group_id,
        business_domain=quote.business_domain,
        status=quote.status.value,
        effective_date=quote.effective_date,
        expire_date=quote.expire_date,
        payload=quote.payload,
    )
