from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from src.intrastructure.database.models.carrier import (
    CarrierServiceGeoGroupStatus,
    CarrierServiceStatus,
    CarrierStatus,
)


@dataclass(slots=True)
class CreateCarrierCommand:
    carrier_code: str
    carrier_name: str
    country_code: str = "JP"
    status: CarrierStatus = CarrierStatus.ACTIVE
    description: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    website: str | None = None
    attributes: dict[str, Any] | None = None


@dataclass(slots=True)
class UpdateCarrierCommand:
    carrier_id: int
    carrier_name: str
    country_code: str
    status: CarrierStatus
    description: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    website: str | None = None
    attributes: dict[str, Any] | None = None


@dataclass(slots=True)
class QueryCarriersCommand:
    keyword: str | None = None
    status: CarrierStatus | None = None
    limit: int = 20
    offset: int = 0


@dataclass(slots=True)
class CreateCarrierServiceCommand:
    carrier_id: int
    service_code: str
    service_name: str
    status: CarrierServiceStatus = CarrierServiceStatus.ACTIVE
    description: str | None = None
    attributes: dict[str, Any] | None = None


@dataclass(slots=True)
class UpdateCarrierServiceCommand:
    service_id: int
    carrier_id: int
    service_name: str
    status: CarrierServiceStatus
    description: str | None = None
    attributes: dict[str, Any] | None = None


@dataclass(slots=True)
class QueryCarrierServicesCommand:
    carrier_id: int
    status: CarrierServiceStatus | None = None
    limit: int = 20
    offset: int = 0


@dataclass(slots=True)
class CreateGeoGroupCommand:
    carrier_id: int
    carrier_service_id: int
    group_code: str
    group_name: str
    status: CarrierServiceGeoGroupStatus = CarrierServiceGeoGroupStatus.SCHEDULED
    description: str | None = None
    attributes: dict[str, Any] | None = None


@dataclass(slots=True)
class UpdateGeoGroupCommand:
    group_id: int
    carrier_id: int
    carrier_service_id: int
    group_name: str
    status: CarrierServiceGeoGroupStatus
    description: str | None = None
    attributes: dict[str, Any] | None = None


@dataclass(slots=True)
class AssignGeoGroupRegionsCommand:
    group_id: int
    carrier_id: int
    carrier_service_id: int
    region_codes: Sequence[str] = field(default_factory=list)


@dataclass(slots=True)
class CarrierServiceTariffRowInput:
    region_code: str
    weight_max_kg: float | None = None
    volume_max_cm3: int | None = None
    girth_max_cm: int | None = None
    price_amount: int = 0


@dataclass(slots=True)
class SetCarrierServiceTariffsCommand:
    carrier_id: int
    service_id: int
    geo_group_id: int
    currency: str = "JPY"
    effective_from: datetime | None = None
    effective_to: datetime | None = None
    rows: Sequence[CarrierServiceTariffRowInput] = field(default_factory=list)
