from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.application.region.use_cases import GetRegionDetailUseCase, QueryRegionsUseCase
from src.intrastructure.database.postgres import get_postgres_session


def get_query_regions_use_case(session: AsyncSession = Depends(get_postgres_session)) -> QueryRegionsUseCase:
    return QueryRegionsUseCase(session=session)


def get_region_detail_use_case(session: AsyncSession = Depends(get_postgres_session)) -> GetRegionDetailUseCase:
    return GetRegionDetailUseCase(session=session)
