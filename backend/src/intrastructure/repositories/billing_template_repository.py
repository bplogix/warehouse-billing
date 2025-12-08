from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domain.billing.entities import TemplateStatus, TemplateType
from src.intrastructure.database.models import BillingTemplate


class BillingTemplateRepository:
    """Repository for billing templates and rules."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, template: BillingTemplate) -> BillingTemplate:
        self._session.add(template)
        await self._session.flush()
        return template

    async def get_by_id(self, template_id: int, *, with_rules: bool = False) -> BillingTemplate | None:
        stmt = select(BillingTemplate).where(BillingTemplate.id == template_id, BillingTemplate.is_deleted.is_(False))
        if with_rules:
            stmt = stmt.options(selectinload(BillingTemplate.rules))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_code(self, template_code: str) -> BillingTemplate | None:
        stmt = select(BillingTemplate).where(
            BillingTemplate.template_code == template_code, BillingTemplate.is_deleted.is_(False)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def exists_global_template(self) -> bool:
        stmt = (
            select(func.count())
            .select_from(BillingTemplate)
            .where(
                BillingTemplate.template_type == TemplateType.GLOBAL.value,
                BillingTemplate.is_deleted.is_(False),
            )
        )
        result = await self._session.execute(stmt)
        return int(result.scalar_one()) > 0

    async def search(
        self,
        *,
        template_type: TemplateType,
        business_domains: Sequence[str],
        keyword: str | None,
        status: TemplateStatus | None,
        customer_id: int | None,
        customer_group_id: int | None,
        limit: int,
        offset: int,
    ) -> tuple[list[BillingTemplate], int]:
        if not business_domains:
            return [], 0

        base_condition = BillingTemplate.is_deleted.is_(False)
        stmt = select(BillingTemplate).where(base_condition)
        count_stmt = select(func.count()).select_from(BillingTemplate).where(base_condition)

        stmt = stmt.where(BillingTemplate.template_type == template_type.value)
        count_stmt = count_stmt.where(BillingTemplate.template_type == template_type.value)

        stmt = stmt.where(BillingTemplate.business_domain.in_(business_domains))
        count_stmt = count_stmt.where(BillingTemplate.business_domain.in_(business_domains))

        if keyword:
            like = f"%{keyword}%"
            condition = or_(
                BillingTemplate.template_name.ilike(like),
                BillingTemplate.template_code.ilike(like),
            )
            stmt = stmt.where(condition)
            count_stmt = count_stmt.where(condition)

        if status:
            stmt = stmt.where(BillingTemplate.status == status.value)
            count_stmt = count_stmt.where(BillingTemplate.status == status.value)

        if customer_id is not None:
            stmt = stmt.where(BillingTemplate.customer_id == customer_id)
            count_stmt = count_stmt.where(BillingTemplate.customer_id == customer_id)

        if customer_group_id is not None:
            stmt = stmt.where(BillingTemplate.customer_group_ids.contains([customer_group_id]))
            count_stmt = count_stmt.where(BillingTemplate.customer_group_ids.contains([customer_group_id]))

        stmt = stmt.order_by(BillingTemplate.id.desc()).offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        total_result = await self._session.execute(count_stmt)
        return list(result.scalars().all()), int(total_result.scalar_one())
