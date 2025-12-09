from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status

from src.application.billing.commands import (
    CreateBillingTemplateCommand,
    QueryBillingQuotesCommand,
    QueryBillingTemplatesCommand,
    TemplateRuleInput,
    TemplateRuleTierInput,
    UpdateBillingTemplateCommand,
)
from src.application.billing.use_cases import (
    CreateBillingTemplateUseCase,
    DeleteBillingTemplateUseCase,
    GetBillingQuoteDetailUseCase,
    GetBillingTemplateDetailUseCase,
    QueryBillingQuotesUseCase,
    QueryBillingTemplatesUseCase,
    UpdateBillingTemplateUseCase,
)
from src.domain.billing.entities import QuoteStatus, TemplateType
from src.presentation.dependencies.auth import get_current_user
from src.presentation.dependencies.billing import (
    get_billing_quote_detail_use_case,
    get_billing_template_detail_use_case,
    get_create_billing_template_use_case,
    get_delete_billing_template_use_case,
    get_query_billing_quotes_use_case,
    get_query_billing_templates_use_case,
    get_update_billing_template_use_case,
)
from src.presentation.schema.billing import (
    BillingQuoteListResponse,
    BillingQuoteSchema,
    BillingTemplateCreateSchema,
    BillingTemplateDetailSchema,
    BillingTemplateListItemSchema,
    BillingTemplateListResponse,
    BillingTemplateUpdateSchema,
)
from src.shared.error.app_error import AppError
from src.shared.schemas.auth import CurrentUser
from src.shared.schemas.response import SuccessResponse

router = APIRouter(prefix="/billing/templates", tags=["BillingTemplates"])
quote_router = APIRouter(prefix="/billing/quotes", tags=["BillingQuotes"])


# ============================================================================
# Template Endpoints
# ============================================================================


@router.get("", response_model=SuccessResponse[BillingTemplateListResponse])
async def list_templates(
    template_type: TemplateType = Query(..., alias="templateType"),
    keyword: str | None = Query(None),
    customer_id: int | None = Query(None, alias="customerId"),
    customer_group_id: int | None = Query(None, alias="customerGroupId"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    # current_user: CurrentUser = Depends(get_current_user),
    use_case: QueryBillingTemplatesUseCase = Depends(get_query_billing_templates_use_case),
) -> SuccessResponse[BillingTemplateListResponse]:
    """列表计费模板."""
    cmd = QueryBillingTemplatesCommand(
        template_type=template_type,
        keyword=keyword,
        customer_id=customer_id,
        customer_group_id=customer_group_id,
        limit=limit,
        offset=offset,
    )
    result = await use_case.execute(cmd)

    return SuccessResponse(
        data=BillingTemplateListResponse(
            items=[BillingTemplateListItemSchema.from_model(item) for item in result.items],
            total=result.total,
        )
    )


@router.get("/{template_id}", response_model=SuccessResponse[BillingTemplateDetailSchema])
async def get_template_detail(
    template_id: int,
    # current_user: CurrentUser = Depends(get_current_user),
    use_case: GetBillingTemplateDetailUseCase = Depends(get_billing_template_detail_use_case),
) -> SuccessResponse[BillingTemplateDetailSchema]:
    """获取计费模板详情."""
    template = await use_case.execute(template_id)
    if template is None:
        raise AppError(message=f"Template {template_id} not found")

    return SuccessResponse(data=BillingTemplateDetailSchema.from_model(template))


@router.post("", response_model=SuccessResponse[BillingTemplateDetailSchema], status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: BillingTemplateCreateSchema,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: CreateBillingTemplateUseCase = Depends(get_create_billing_template_use_case),
) -> SuccessResponse[BillingTemplateDetailSchema]:
    """创建计费模板."""
    rules = [
        TemplateRuleInput(
            charge_code=rule.charge_code,
            charge_name=rule.charge_name,
            category=rule.category,
            channel=rule.channel,
            unit=rule.unit,
            pricing_mode=rule.pricing_mode,
            price=rule.price,
            tiers=[
                TemplateRuleTierInput(
                    min_value=tier.min_value,
                    max_value=tier.max_value,
                    price=tier.price,
                    description=tier.description,
                )
                for tier in (rule.tiers or [])
            ]
            if rule.tiers
            else None,
            description=rule.description,
            support_only=rule.support_only,
        )
        for rule in payload.rules
    ]

    cmd = CreateBillingTemplateCommand(
        template_code=payload.template_code,
        template_name=payload.template_name,
        template_type=payload.template_type,
        # business_domain=payload.business_domain,
        effective_date=payload.effective_date,
        expire_date=payload.expire_date,
        description=payload.description,
        customer_id=payload.customer_id,
        customer_group_id=payload.customer_group_id,
        rules=rules,
    )

    template = await use_case.execute(cmd, operator=current_user.union_id)

    return SuccessResponse(data=BillingTemplateDetailSchema.from_model(template))


@router.put("/{template_id}", response_model=SuccessResponse[BillingTemplateDetailSchema])
async def update_template(
    template_id: int,
    payload: BillingTemplateUpdateSchema,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: UpdateBillingTemplateUseCase = Depends(get_update_billing_template_use_case),
) -> SuccessResponse[BillingTemplateDetailSchema]:
    """更新计费模板."""
    rules = [
        TemplateRuleInput(
            charge_code=rule.charge_code,
            charge_name=rule.charge_name,
            category=rule.category,
            channel=rule.channel,
            unit=rule.unit,
            pricing_mode=rule.pricing_mode,
            price=rule.price,
            tiers=[
                TemplateRuleTierInput(
                    min_value=tier.min_value,
                    max_value=tier.max_value,
                    price=tier.price,
                    description=tier.description,
                )
                for tier in (rule.tiers or [])
            ]
            if rule.tiers
            else None,
            description=rule.description,
            support_only=rule.support_only,
        )
        for rule in payload.rules
    ]

    cmd = UpdateBillingTemplateCommand(
        template_id=template_id,
        template_name=payload.template_name,
        effective_date=payload.effective_date,
        expire_date=payload.expire_date,
        description=payload.description,
        customer_id=payload.customer_id,
        customer_group_id=payload.customer_group_id,
        rules=rules,
    )

    template = await use_case.execute(cmd, operator=current_user.union_id)

    if template is None:
        raise AppError(message=f"Template {template_id} not found")

    return SuccessResponse(data=BillingTemplateDetailSchema.from_model(template))


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: DeleteBillingTemplateUseCase = Depends(get_delete_billing_template_use_case),
) -> None:
    """删除计费模板（软删除）."""
    deleted = await use_case.execute(template_id, operator=current_user.union_id)
    if not deleted:
        raise AppError(message=f"Template {template_id} not found")


# ============================================================================
# Quote Endpoints (可选，用于计费消费侧)
# ============================================================================


@quote_router.get("", response_model=SuccessResponse[BillingQuoteListResponse])
async def list_quotes(
    template_id: int | None = Query(None, alias="templateId"),
    customer_id: int | None = Query(None, alias="customerId"),
    customer_group_id: int | None = Query(None, alias="customerGroupId"),
    status_filter: QuoteStatus | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    use_case: QueryBillingQuotesUseCase = Depends(get_query_billing_quotes_use_case),
) -> SuccessResponse[BillingQuoteListResponse]:
    """列表报价单."""
    cmd = QueryBillingQuotesCommand(
        template_id=template_id,
        customer_id=customer_id,
        customer_group_id=customer_group_id,
        status=status_filter,
        limit=limit,
        offset=offset,
    )
    result = await use_case.execute(cmd)

    return SuccessResponse(
        data=BillingQuoteListResponse(
            items=[BillingQuoteSchema.from_model(item) for item in result.items],
            total=result.total,
        )
    )


@quote_router.get("/{quote_id}", response_model=SuccessResponse[BillingQuoteSchema])
async def get_quote_detail(
    quote_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: GetBillingQuoteDetailUseCase = Depends(get_billing_quote_detail_use_case),
) -> SuccessResponse[BillingQuoteSchema]:
    """获取报价单详情."""
    quote = await use_case.execute(quote_id)
    if quote is None:
        raise AppError(message=f"Quote {quote_id} not found")

    return SuccessResponse(data=BillingQuoteSchema.from_model(quote))
