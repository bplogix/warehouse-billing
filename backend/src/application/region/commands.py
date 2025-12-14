from __future__ import annotations

from dataclasses import dataclass

from src.intrastructure.database.models.region import RegionLevel


@dataclass(slots=True)
class QueryRegionsCommand:
    country_code: str | None = None
    level: RegionLevel | None = None
    parent_code: str | None = None
    keyword: str | None = None
    limit: int = 100
    offset: int = 0
