from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.application.billing.use_cases import (
    CreateBillingTemplateUseCase,
    DeleteBillingTemplateUseCase,
    GetBillingQuoteDetailUseCase,
    GetBillingTemplateDetailUseCase,
    QueryBillingQuotesUseCase,
    QueryBillingTemplatesUseCase,
    UpdateBillingTemplateUseCase,
)
from src.intrastructure.database.postgres import get_postgres_session


def get_query_billing_templates_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> QueryBillingTemplatesUseCase:
    return QueryBillingTemplatesUseCase(session=session)


def get_billing_template_detail_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> GetBillingTemplateDetailUseCase:
    return GetBillingTemplateDetailUseCase(session=session)


def get_create_billing_template_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> CreateBillingTemplateUseCase:
    return CreateBillingTemplateUseCase(session=session)


def get_update_billing_template_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> UpdateBillingTemplateUseCase:
    return UpdateBillingTemplateUseCase(session=session)


def get_query_billing_quotes_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> QueryBillingQuotesUseCase:
    return QueryBillingQuotesUseCase(session=session)


def get_billing_quote_detail_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> GetBillingQuoteDetailUseCase:
    return GetBillingQuoteDetailUseCase(session=session)


def get_delete_billing_template_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> DeleteBillingTemplateUseCase:
    return DeleteBillingTemplateUseCase(session=session)
