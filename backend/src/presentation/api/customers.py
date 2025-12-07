from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status

from src.application.customer.commands import (
    CreateCompanyCommand,
    CreateCustomerCommand,
    QueryCustomersCommand,
    UpdateCustomerStatusCommand,
)
from src.application.customer.use_cases import (
    CreateCustomerUseCase,
    GetCustomerDetailUseCase,
    QueryCustomersUseCase,
    UpdateCustomerStatusUseCase,
)
from src.domain.customer import CustomerStatus
from src.presentation.dependencies.auth import get_current_user
from src.presentation.dependencies.customer import (
    get_create_customer_use_case,
    get_customer_detail_use_case,
    get_query_customers_use_case,
    get_update_customer_status_use_case,
)
from src.presentation.schema.customer import (
    CustomerCreateRequest,
    CustomerDetailResponse,
    CustomerListResponse,
    CustomerResponse,
    CustomerStatusUpdateSchema,
)
from src.shared.error.app_error import AppError
from src.shared.schemas.auth import CurrentUser
from src.shared.schemas.response import SuccessResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


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
    result = await use_case.execute(
        company_cmd=company_cmd,
        customer_cmd=customer_cmd,
        operator=current_user.user_id,
    )
    return SuccessResponse(data=CustomerResponse.from_model(result.customer))


@router.get("", response_model=SuccessResponse[CustomerListResponse])
async def list_customers(
    keyword: str | None = Query(default=None),
    business_domain: str | None = Query(default=None, alias="businessDomain"),
    status_filter: CustomerStatus | None = Query(default=None, alias="status"),
    source: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    use_case: QueryCustomersUseCase = Depends(get_query_customers_use_case),
) -> SuccessResponse[CustomerListResponse]:
    cmd = QueryCustomersCommand(
        keyword=keyword,
        business_domain=business_domain,
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
