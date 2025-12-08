from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.application.customer.use_cases import (
    CreateCustomerUseCase,
    GetCustomerGroupDetailUseCase,
    GetCustomerDetailUseCase,
    ManageCustomerGroupUseCase,
    QueryCustomersUseCase,
    QueryCustomerGroupsUseCase,
    QueryExternalCompaniesUseCase,
    UpdateCustomerStatusUseCase,
)
from src.intrastructure.database.mysql_external import get_external_mysql_session
from src.intrastructure.database.postgres import get_postgres_session


def get_create_customer_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> CreateCustomerUseCase:
    return CreateCustomerUseCase(session=session)


def get_query_customers_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> QueryCustomersUseCase:
    return QueryCustomersUseCase(session=session)


def get_customer_detail_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> GetCustomerDetailUseCase:
    return GetCustomerDetailUseCase(session=session)


def get_update_customer_status_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> UpdateCustomerStatusUseCase:
    return UpdateCustomerStatusUseCase(session=session)


def get_manage_customer_group_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> ManageCustomerGroupUseCase:
    return ManageCustomerGroupUseCase(session=session)

def get_query_customer_groups_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> QueryCustomerGroupsUseCase:
    return QueryCustomerGroupsUseCase(session=session)

def get_customer_group_detail_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> GetCustomerGroupDetailUseCase:
    return GetCustomerGroupDetailUseCase(session=session)


def get_query_external_companies_use_case(
    session: AsyncSession = Depends(get_external_mysql_session),
) -> QueryExternalCompaniesUseCase:
    return QueryExternalCompaniesUseCase(session=session)
