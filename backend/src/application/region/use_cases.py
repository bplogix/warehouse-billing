from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from src.application.region.commands import QueryRegionsCommand
from src.intrastructure.database.models import Region
from src.intrastructure.repositories import RegionRepository


@dataclass(slots=True)
class QueryRegionsResult:
    items: list[Region]
    total: int


class QueryRegionsUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = RegionRepository(session)

    async def execute(self, cmd: QueryRegionsCommand) -> QueryRegionsResult:
        regions, total = await self._repo.search(
            country_code=cmd.country_code,
            level=cmd.level,
            parent_code=cmd.parent_code,
            keyword=cmd.keyword,
            limit=cmd.limit,
            offset=cmd.offset,
        )
        return QueryRegionsResult(items=regions, total=total)


class GetRegionDetailUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = RegionRepository(session)

    async def execute(self, region_code: str) -> Region | None:
        return await self._repo.get_by_code(region_code)
