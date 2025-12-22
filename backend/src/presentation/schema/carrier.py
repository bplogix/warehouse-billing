from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import Field
from sqlalchemy import inspect

from src.intrastructure.database.models import (
    Carrier,
    CarrierService,
    CarrierServiceGeoGroup,
    CarrierServiceGeoGroupRegion,
    CarrierServiceGeoGroupStatus,
    CarrierServiceStatus,
    CarrierStatus,
)
from src.presentation.schema.base import CamelModel


class CarrierCreateSchema(CamelModel):
    carrier_code: str = Field(alias="carrierCode")
    carrier_name: str = Field(alias="carrierName")
    country_code: str = Field(default="JP", alias="countryCode")
    status: CarrierStatus = CarrierStatus.ACTIVE
    description: str | None = None
    contact_email: str | None = Field(default=None, alias="contactEmail")
    contact_phone: str | None = Field(default=None, alias="contactPhone")
    website: str | None = None
    attributes: dict[str, Any] | None = None


class CarrierUpdateSchema(CamelModel):
    carrier_name: str = Field(alias="carrierName")
    country_code: str = Field(alias="countryCode")
    status: CarrierStatus
    description: str | None = None
    contact_email: str | None = Field(default=None, alias="contactEmail")
    contact_phone: str | None = Field(default=None, alias="contactPhone")
    website: str | None = None
    attributes: dict[str, Any] | None = None


class CarrierSchema(CamelModel):
    id: int
    carrier_code: str = Field(alias="carrierCode")
    carrier_name: str = Field(alias="carrierName")
    country_code: str = Field(alias="countryCode")
    status: CarrierStatus
    description: str | None = None
    contact_email: str | None = Field(default=None, alias="contactEmail")
    contact_phone: str | None = Field(default=None, alias="contactPhone")
    website: str | None = None

    @classmethod
    def from_model(cls, model: Carrier) -> CarrierSchema:
        return cls(
            id=model.id,
            carrierCode=model.carrier_code,
            carrierName=model.carrier_name,
            countryCode=model.country_code,
            status=CarrierStatus(model.status),
            description=model.description,
            contactEmail=model.contact_email,
            contactPhone=model.contact_phone,
            website=model.website,
        )


class CarrierListResponse(CamelModel):
    total: int
    items: list[CarrierSchema]


class CarrierServiceCreateSchema(CamelModel):
    service_code: str = Field(alias="serviceCode")
    service_name: str = Field(alias="serviceName")
    service_type: str = Field(alias="serviceType")
    status: CarrierServiceStatus = CarrierServiceStatus.ACTIVE
    description: str | None = None
    effective_date: datetime | None = Field(default=None, alias="effectiveDate")
    expire_date: datetime | None = Field(default=None, alias="expireDate")
    coverage_group_code: str | None = Field(default=None, alias="coverageGroupCode")
    attributes: dict[str, Any] | None = None


class CarrierServiceUpdateSchema(CamelModel):
    service_name: str = Field(alias="serviceName")
    service_type: str = Field(alias="serviceType")
    status: CarrierServiceStatus
    description: str | None = None
    effective_date: datetime | None = Field(default=None, alias="effectiveDate")
    expire_date: datetime | None = Field(default=None, alias="expireDate")
    coverage_group_code: str | None = Field(default=None, alias="coverageGroupCode")
    attributes: dict[str, Any] | None = None


class CarrierServiceSchema(CamelModel):
    id: int
    carrier_id: int = Field(alias="carrierId")
    service_code: str = Field(alias="serviceCode")
    service_name: str = Field(alias="serviceName")
    service_type: str = Field(alias="serviceType")
    status: CarrierServiceStatus
    description: str | None = None
    effective_date: datetime | None = Field(default=None, alias="effectiveDate")
    expire_date: datetime | None = Field(default=None, alias="expireDate")
    coverage_group_code: str | None = Field(default=None, alias="coverageGroupCode")

    @classmethod
    def from_model(cls, model: CarrierService) -> CarrierServiceSchema:
        return cls(
            id=model.id,
            carrierId=model.carrier_id,
            serviceCode=model.service_code,
            serviceName=model.service_name,
            serviceType=model.service_type,
            status=CarrierServiceStatus(model.status),
            description=model.description,
            effectiveDate=model.effective_date,
            expireDate=model.expire_date,
            coverageGroupCode=model.coverage_group_code,
        )


class CarrierServiceListResponse(CamelModel):
    total: int
    items: list[CarrierServiceSchema]


class GeoGroupCreateSchema(CamelModel):
    group_code: str = Field(alias="groupCode")
    group_name: str = Field(alias="groupName")
    status: CarrierServiceGeoGroupStatus = CarrierServiceGeoGroupStatus.SCHEDULED
    description: str | None = None
    effective_date: datetime | None = Field(default=None, alias="effectiveDate")
    expire_date: datetime | None = Field(default=None, alias="expireDate")
    attributes: dict[str, Any] | None = None


class GeoGroupUpdateSchema(CamelModel):
    group_name: str = Field(alias="groupName")
    status: CarrierServiceGeoGroupStatus
    description: str | None = None
    effective_date: datetime | None = Field(default=None, alias="effectiveDate")
    expire_date: datetime | None = Field(default=None, alias="expireDate")
    attributes: dict[str, Any] | None = None


class GeoGroupRegionUpdateSchema(CamelModel):
    region_codes: list[str] = Field(default_factory=list, alias="regionCodes")


class GeoGroupRegionSchema(CamelModel):
    id: int
    region_code: str = Field(alias="regionCode")
    region_level: str | None = Field(default=None, alias="regionLevel")
    priority: int | None = None

    @classmethod
    def from_model(cls, model: CarrierServiceGeoGroupRegion) -> GeoGroupRegionSchema:
        level = model.region_level if model.region_level else None
        return cls(
            id=model.id,
            regionCode=model.region_code,
            regionLevel=level,
            priority=model.priority,
        )


class GeoGroupSchema(CamelModel):
    id: int
    carrier_service_id: int = Field(alias="carrierServiceId")
    group_code: str = Field(alias="groupCode")
    group_name: str = Field(alias="groupName")
    status: CarrierServiceGeoGroupStatus
    description: str | None = None
    effective_date: datetime | None = Field(default=None, alias="effectiveDate")
    expire_date: datetime | None = Field(default=None, alias="expireDate")
    regions: list[GeoGroupRegionSchema] = Field(default_factory=list)

    @classmethod
    def from_model(cls, model: CarrierServiceGeoGroup) -> GeoGroupSchema:
        state = inspect(model)
        if "regions" in state.unloaded:
            regions: list[GeoGroupRegionSchema] = []
        else:
            regions = [GeoGroupRegionSchema.from_model(region) for region in model.regions]
        return cls(
            id=model.id,
            carrierServiceId=model.carrier_service_id,
            groupCode=model.group_code,
            groupName=model.group_name,
            status=CarrierServiceGeoGroupStatus(model.status),
            description=model.description,
            effectiveDate=model.effective_date,
            expireDate=model.expire_date,
            regions=regions,
        )


class GeoGroupListResponse(CamelModel):
    items: list[GeoGroupSchema]
