from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domain.billing.entities import QuoteScope, QuoteStatus
from src.intrastructure.database.models import BillingQuote


class BillingQuoteRepository:
    """Repository for billing quotes."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add_all(self, quotes: Sequence[BillingQuote]) -> None:
        if not quotes:
            return
        self._session.add_all(list(quotes))
        await self._session.flush()

    async def get_by_id(self, quote_id: int, *, with_template: bool = False) -> BillingQuote | None:
        stmt = select(BillingQuote).where(BillingQuote.id == quote_id, BillingQuote.is_deleted.is_(False))
        if with_template:
            stmt = stmt.options(selectinload(BillingQuote.template))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def search(
        self,
        *,
        business_domains: Sequence[str],
        template_id: int | None,
        customer_id: int | None,
        customer_group_id: int | None,
        status: QuoteStatus | None,
        limit: int,
        offset: int,
    ) -> tuple[list[BillingQuote], int]:
        if not business_domains:
            return [], 0

        base_condition = BillingQuote.is_deleted.is_(False)
        stmt = select(BillingQuote).where(base_condition)
        count_stmt = select(func.count()).select_from(BillingQuote).where(base_condition)

        stmt = stmt.where(BillingQuote.business_domain.in_(business_domains))
        count_stmt = count_stmt.where(BillingQuote.business_domain.in_(business_domains))

        if template_id is not None:
            stmt = stmt.where(BillingQuote.template_id == template_id)
            count_stmt = count_stmt.where(BillingQuote.template_id == template_id)

        if customer_id is not None:
            stmt = stmt.where(BillingQuote.customer_id == customer_id)
            count_stmt = count_stmt.where(BillingQuote.customer_id == customer_id)

        if customer_group_id is not None:
            stmt = stmt.where(BillingQuote.customer_group_id == customer_group_id)
            count_stmt = count_stmt.where(BillingQuote.customer_group_id == customer_group_id)

        if status is not None:
            stmt = stmt.where(BillingQuote.status == status.value)
            count_stmt = count_stmt.where(BillingQuote.status == status.value)

        stmt = stmt.order_by(BillingQuote.id.desc()).offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        total_result = await self._session.execute(count_stmt)
        return list(result.scalars().all()), int(total_result.scalar_one())

    async def deactivate_scope_quotes(
        self,
        *,
        scope_type: QuoteScope,
        business_domain: str,
        customer_id: int | None = None,
        customer_group_id: int | None = None,
    ) -> None:
        stmt = select(BillingQuote).where(
            BillingQuote.scope_type == scope_type.value,
            BillingQuote.business_domain == business_domain,
            BillingQuote.status == QuoteStatus.ACTIVE.value,
            BillingQuote.is_deleted.is_(False),
        )
        if scope_type is QuoteScope.CUSTOMER:
            stmt = stmt.where(BillingQuote.customer_id == customer_id)
        elif scope_type is QuoteScope.GROUP:
            stmt = stmt.where(BillingQuote.customer_group_id == customer_group_id)
        else:
            stmt = stmt.where(
                BillingQuote.customer_id.is_(None),
                BillingQuote.customer_group_id.is_(None),
            )
        result = await self._session.execute(stmt)
        quotes = list(result.scalars().all())
        if not quotes:
            return
        for quote in quotes:
            quote.status = QuoteStatus.INACTIVE.value
        await self._session.flush()

    async def deactivate_by_template(self, template_id: int) -> None:
        stmt = select(BillingQuote).where(
            BillingQuote.template_id == template_id,
            BillingQuote.status == QuoteStatus.ACTIVE.value,
            BillingQuote.is_deleted.is_(False),
        )
        result = await self._session.execute(stmt)
        quotes = list(result.scalars().all())
        if not quotes:
            return
        for quote in quotes:
            quote.status = QuoteStatus.INACTIVE.value
        await self._session.flush()

    async def find_active_quote(
        self,
        *,
        scope: QuoteScope,
        business_domain: str,
        now: datetime,
        customer_id: int | None = None,
        customer_group_id: int | None = None,
    ) -> BillingQuote | None:
        stmt = select(BillingQuote).where(
            BillingQuote.business_domain == business_domain,
            BillingQuote.status == QuoteStatus.ACTIVE.value,
            BillingQuote.is_deleted.is_(False),
            BillingQuote.effective_date <= now,
            or_(BillingQuote.expire_date.is_(None), BillingQuote.expire_date > now),
        )
        if scope is QuoteScope.CUSTOMER:
            if customer_id is None:
                raise ValueError("customer_id is required for customer scoped quotes")
            stmt = stmt.where(
                BillingQuote.scope_type == QuoteScope.CUSTOMER.value,
                BillingQuote.customer_id == customer_id,
            )
        elif scope is QuoteScope.GROUP:
            if customer_group_id is None:
                raise ValueError("customer_group_id is required for group scoped quotes")
            stmt = stmt.where(
                BillingQuote.scope_type == QuoteScope.GROUP.value,
                BillingQuote.customer_group_id == customer_group_id,
            )
        else:
            stmt = stmt.where(
                BillingQuote.scope_type == QuoteScope.GLOBAL.value,
                BillingQuote.customer_id.is_(None),
                BillingQuote.customer_group_id.is_(None),
            )

        stmt = stmt.order_by(BillingQuote.updated_at.desc()).limit(1)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()
