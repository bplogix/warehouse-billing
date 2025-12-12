from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.intrastructure.database.external.company import CompanyType, RbCompanyInfo


class ExternalCompanyRepository:
    """Read-only repository for external company info."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_companies(
        self,
        *,
        keyword: str | None,
        limit: int,
        offset: int,
        exclude_ids: Sequence[str] | None = None,
    ) -> tuple[list[RbCompanyInfo], int]:
        stmt = select(RbCompanyInfo)
        count_stmt = (
            select(func.count()).select_from(RbCompanyInfo).where(RbCompanyInfo.COMPANY_TYPE == CompanyType.SELLER)
        )
        if keyword:
            like = f"%{keyword}%"
            condition = RbCompanyInfo.COMPANY_NAME.ilike(like)
            stmt = stmt.where(condition)
            count_stmt = count_stmt.where(condition)
        if exclude_ids:
            stmt = stmt.where(RbCompanyInfo.COMPANY_ID.notin_(exclude_ids))
            count_stmt = count_stmt.where(RbCompanyInfo.COMPANY_ID.notin_(exclude_ids))
        stmt = stmt.order_by(RbCompanyInfo.COMPANY_NAME).offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        count_result = await self._session.execute(count_stmt)
        total = int(count_result.scalar_one())
        return list(result.scalars().all()), total
