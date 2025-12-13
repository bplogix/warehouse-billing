from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status

from src.application.billing.commands import ResolveCustomerQuoteCommand
from src.application.billing.use_cases import ResolveCustomerQuoteUseCase
from src.application.customer.commands import (
    CreateCompanyCommand,
    CreateCustomerCommand,
    QueryCustomersCommand,
    UpdateCustomerStatusCommand,
)
from src.application.customer.exceptions import DuplicateCompanyError, DuplicateCustomerError
from src.application.customer.group_commands import (
    CreateCustomerGroupCommand,
    QueryExternalCompaniesCommand,
    ReplaceGroupMembersCommand,
)
from src.application.customer.use_cases import (
    CreateCustomerUseCase,
    GetCustomerDetailUseCase,
    GetCustomerGroupDetailUseCase,
    ManageCustomerGroupUseCase,
    QueryCustomerGroupsUseCase,
    QueryCustomersUseCase,
    QueryExternalCompaniesUseCase,
    UpdateCustomerStatusUseCase,
)
from src.domain.customer import CustomerStatus
from src.presentation.dependencies.auth import get_current_user
from src.presentation.dependencies.billing import get_resolve_customer_quote_use_case
from src.presentation.dependencies.customer import (
    get_create_customer_use_case,
    get_customer_detail_use_case,
    get_customer_group_detail_use_case,
    get_manage_customer_group_use_case,
    get_query_customer_groups_use_case,
    get_query_customers_use_case,
    get_query_external_companies_use_case,
    get_update_customer_status_use_case,
)
from src.presentation.schema.billing import BillingQuoteSchema
from src.presentation.schema.customer import (
    CustomerCreateRequest,
    CustomerDetailResponse,
    CustomerGroupCreateSchema,
    CustomerGroupListResponse,
    CustomerGroupMembersSchema,
    CustomerGroupResponse,
    CustomerGroupWithMembersResponse,
    CustomerListResponse,
    CustomerResponse,
    CustomerStatusUpdateSchema,
    ExternalCompanyListResponse,
    ExternalCompanyResponse,
)
from src.shared.error.app_error import AppError
from src.shared.schemas.auth import CurrentUser
from src.shared.schemas.response import SuccessResponse

router = APIRouter(prefix="/customers", tags=["Customers"])
group_router = APIRouter(prefix="/customer-groups", tags=["CustomerGroups"])
external_router = APIRouter(prefix="/external-companies", tags=["ExternalCompanies"])


@router.post("", response_model=SuccessResponse[CustomerResponse], status_code=status.HTTP_201_CREATED)
async def create_customer(
    payload: CustomerCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: CreateCustomerUseCase = Depends(get_create_customer_use_case),
) -> SuccessResponse[CustomerResponse]:
    company_cmd = CreateCompanyCommand(
        company_name=payload.company.company_name,
        company_code=payload.company.company_code,
        source=payload.company.source,
        source_ref_id=payload.company.source_ref_id,
    )
    customer_cmd = CreateCustomerCommand(
        customer_name=payload.customer.customer_name,
        customer_code=payload.customer.customer_code,
        business_domain=payload.customer.business_domain,
        source=payload.customer.source,
        status=payload.customer.status,
        source_ref_id=payload.customer.source_ref_id,
        bonded_license_no=payload.customer.bonded_license_no,
        customs_code=payload.customer.customs_code,
    )
    try:
        result = await use_case.execute(
            company_cmd=company_cmd,
            customer_cmd=customer_cmd,
            operator=current_user.user_id,
        )
    except DuplicateCompanyError as exc:
        raise AppError(message=str(exc), code=status.HTTP_400_BAD_REQUEST) from exc
    except DuplicateCustomerError as exc:
        raise AppError(message=str(exc), code=status.HTTP_400_BAD_REQUEST) from exc
    return SuccessResponse(data=CustomerResponse.from_model(result.customer))


@router.get("", response_model=SuccessResponse[CustomerListResponse])
async def list_customers(
    keyword: str | None = Query(default=None),
    status_filter: CustomerStatus | None = Query(default=None, alias="status"),
    source: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    use_case: QueryCustomersUseCase = Depends(get_query_customers_use_case),
) -> SuccessResponse[CustomerListResponse]:
    cmd = QueryCustomersCommand(
        keyword=keyword,
        business_domain="WAREHOUSE",
        status=status_filter,
        source=source,
        limit=limit,
        offset=offset,
    )
    result = await use_case.execute(cmd)
    items = [CustomerResponse.from_model(c) for c in result.customers]
    return SuccessResponse(data=CustomerListResponse(total=result.total, items=items))


@router.get("/{customer_id}", response_model=SuccessResponse[CustomerDetailResponse])
async def get_customer_detail(
    customer_id: int,
    use_case: GetCustomerDetailUseCase = Depends(get_customer_detail_use_case),
) -> SuccessResponse[CustomerDetailResponse]:
    customer = await use_case.execute(customer_id)
    if customer is None:
        raise AppError(message="Customer not found", code=status.HTTP_404_NOT_FOUND)
    return SuccessResponse(data=CustomerDetailResponse.from_model(customer))


@router.get("/{customer_id}/quote", response_model=SuccessResponse[BillingQuoteSchema])
async def get_customer_effective_quote(
    customer_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: ResolveCustomerQuoteUseCase = Depends(get_resolve_customer_quote_use_case),
) -> SuccessResponse[BillingQuoteSchema]:
    """根据客户→客户组→全局优先级获取生效报价."""
    cmd = ResolveCustomerQuoteCommand(customer_id=customer_id)
    quote = await use_case.execute(cmd)
    if quote is None:
        raise AppError(
            message=f"No active quote found for customer {customer_id}",
            code=status.HTTP_404_NOT_FOUND,
        )
    return SuccessResponse(data=BillingQuoteSchema.from_model(quote))


@router.patch("/{customer_id}/status", status_code=status.HTTP_204_NO_CONTENT)
async def update_customer_status(
    customer_id: int,
    payload: CustomerStatusUpdateSchema,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: UpdateCustomerStatusUseCase = Depends(get_update_customer_status_use_case),
) -> None:
    cmd = UpdateCustomerStatusCommand(customer_id=customer_id, status=payload.status)
    updated = await use_case.execute(cmd, operator=current_user.user_id)
    if not updated:
        raise AppError(message="Customer not found", code=status.HTTP_404_NOT_FOUND)


@group_router.post("", response_model=SuccessResponse[CustomerGroupResponse], status_code=status.HTTP_201_CREATED)
async def create_customer_group(
    payload: CustomerGroupCreateSchema,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: ManageCustomerGroupUseCase = Depends(get_manage_customer_group_use_case),
) -> SuccessResponse[CustomerGroupResponse]:
    cmd = CreateCustomerGroupCommand(
        name=payload.name,
        business_domain=payload.business_domain,
        description=payload.description,
        member_ids=payload.member_ids,
    )
    result = await use_case.create_group(cmd, operator=current_user.user_id)
    return SuccessResponse(data=CustomerGroupResponse.from_model(result.group))


@group_router.put("/{group_id}/members", response_model=SuccessResponse[CustomerGroupResponse])
async def replace_group_members(
    group_id: int,
    payload: CustomerGroupMembersSchema,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: ManageCustomerGroupUseCase = Depends(get_manage_customer_group_use_case),
) -> SuccessResponse[CustomerGroupResponse]:
    cmd = ReplaceGroupMembersCommand(group_id=group_id, member_ids=payload.member_ids)
    group = await use_case.replace_members(cmd, operator=current_user.user_id)
    if group is None:
        raise AppError(message="Customer group not found", code=status.HTTP_404_NOT_FOUND)
    return SuccessResponse(data=CustomerGroupResponse.from_model(group))


@group_router.get("", response_model=SuccessResponse[CustomerGroupListResponse])
async def list_customer_groups(
    current_user: CurrentUser = Depends(get_current_user),
    use_case: QueryCustomerGroupsUseCase = Depends(get_query_customer_groups_use_case),
) -> SuccessResponse[CustomerGroupListResponse]:
    result = await use_case.execute()
    items = [
        CustomerGroupWithMembersResponse.from_model(item.group).model_copy(update={"memberIds": item.member_ids})
        for item in result.groups
    ]
    return SuccessResponse(data=CustomerGroupListResponse(items=items))


@group_router.get("/{group_id}", response_model=SuccessResponse[CustomerGroupWithMembersResponse])
async def get_customer_group_detail(
    group_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    use_case: GetCustomerGroupDetailUseCase = Depends(get_customer_group_detail_use_case),
) -> SuccessResponse[CustomerGroupWithMembersResponse]:
    item = await use_case.execute(group_id)
    if item is None:
        raise AppError(message="Customer group not found", code=status.HTTP_404_NOT_FOUND)
    resp = CustomerGroupWithMembersResponse.from_model(item.group).model_copy(update={"memberIds": item.member_ids})
    return SuccessResponse(data=resp)


@external_router.get("", response_model=SuccessResponse[ExternalCompanyListResponse])
async def list_external_companies(
    keyword: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    use_case: QueryExternalCompaniesUseCase = Depends(get_query_external_companies_use_case),
) -> SuccessResponse[ExternalCompanyListResponse]:
    cmd = QueryExternalCompaniesCommand(keyword=keyword, limit=limit, offset=offset)
    result = await use_case.execute(cmd)
    items = [ExternalCompanyResponse.from_model(model) for model in result.companies]
    return SuccessResponse(data=ExternalCompanyListResponse(total=result.total, items=items))
