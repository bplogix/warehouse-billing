from __future__ import annotations

from pydantic import Field

from src.intrastructure.database.models import Region
from src.presentation.schema.base import CamelModel


class RegionSchema(CamelModel):
    id: int
    region_code: str = Field(alias="regionCode")
    name: str
    country_code: str = Field(alias="countryCode")
    level: str
    parent_code: str | None = Field(default=None, alias="parentCode")

    @classmethod
    def from_model(cls, model: Region) -> RegionSchema:
        return cls(
            id=model.id,
            regionCode=model.region_code,
            name=model.name,
            countryCode=model.country_code,
            level=model.level,
            parentCode=model.parent_code,
        )


class RegionListResponse(CamelModel):
    total: int
    items: list[RegionSchema]
