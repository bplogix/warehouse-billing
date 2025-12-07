from __future__ import annotations

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
        stmt = stmt.order_by(RbCompanyInfo.COMPANY_NAME).offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        count_result = await self._session.execute(count_stmt)
        total = int(count_result.scalar_one())
        return list(result.scalars().all()), total
