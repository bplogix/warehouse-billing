from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status

from src.application.region.commands import QueryRegionsCommand
from src.application.region.use_cases import GetRegionDetailUseCase, QueryRegionsUseCase
from src.intrastructure.database.models.region import RegionLevel
from src.presentation.dependencies.region import (
    get_query_regions_use_case,
    get_region_detail_use_case,
)
from src.presentation.schema.region import RegionListResponse, RegionSchema
from src.shared.error.app_error import AppError
from src.shared.schemas.response import SuccessResponse

router = APIRouter(prefix="/regions", tags=["Regions"])


@router.get("", response_model=SuccessResponse[RegionListResponse])
async def list_regions(
    country_code: str | None = Query(default=None, alias="countryCode"),
    level: RegionLevel | None = Query(default=None),
    parent_code: str | None = Query(default=None, alias="parentCode"),
    keyword: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    use_case: QueryRegionsUseCase = Depends(get_query_regions_use_case),
) -> SuccessResponse[RegionListResponse]:
    cmd = QueryRegionsCommand(
        country_code=country_code,
        level=level,
        parent_code=parent_code,
        keyword=keyword,
        limit=limit,
        offset=offset,
    )
    result = await use_case.execute(cmd)
    items = [RegionSchema.from_model(region) for region in result.items]
    return SuccessResponse(data=RegionListResponse(total=result.total, items=items))


@router.get("/{region_code}", response_model=SuccessResponse[RegionSchema])
async def get_region_detail(
    region_code: str,
    use_case: GetRegionDetailUseCase = Depends(get_region_detail_use_case),
) -> SuccessResponse[RegionSchema]:
    region = await use_case.execute(region_code)
    if region is None:
        raise AppError(message="Region not found", code=status.HTTP_404_NOT_FOUND)
    return SuccessResponse(data=RegionSchema.from_model(region))
