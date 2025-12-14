from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.intrastructure.database.models import Region, RegionLevel


class RegionRepository:
    """Read-only Region repository."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_code(self, region_code: str) -> Region | None:
        stmt = select(Region).where(Region.region_code == region_code, Region.is_deleted.is_(False))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def search(
        self,
        *,
        country_code: str | None,
        level: RegionLevel | None,
        parent_code: str | None,
        keyword: str | None,
        limit: int,
        offset: int,
    ) -> tuple[list[Region], int]:
        stmt = select(Region).where(Region.is_deleted.is_(False))
        count_stmt = select(func.count()).select_from(Region).where(Region.is_deleted.is_(False))

        if country_code:
            stmt = stmt.where(Region.country_code == country_code)
            count_stmt = count_stmt.where(Region.country_code == country_code)
        if level:
            stmt = stmt.where(Region.level == level)
            count_stmt = count_stmt.where(Region.level == level)
        if parent_code:
            stmt = stmt.where(Region.parent_code == parent_code)
            count_stmt = count_stmt.where(Region.parent_code == parent_code)
        if keyword:
            like = f"%{keyword}%"
            stmt = stmt.where(Region.name.ilike(like) | Region.region_code.ilike(like))
            count_stmt = count_stmt.where(Region.name.ilike(like) | Region.region_code.ilike(like))

        stmt = stmt.order_by(Region.region_code).offset(offset).limit(limit)
        regions_result = await self._session.execute(stmt)
        total_result = await self._session.execute(count_stmt)
        return list(regions_result.scalars().all()), int(total_result.scalar_one())
