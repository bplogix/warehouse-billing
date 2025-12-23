from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.application.carrier.use_cases import (
    AssignGeoGroupRegionsUseCase,
    CreateCarrierServiceUseCase,
    CreateCarrierUseCase,
    CreateGeoGroupUseCase,
    GetCarrierDetailUseCase,
    GetCarrierServiceDetailUseCase,
    GetCarrierServiceTariffsUseCase,
    GetGeoGroupDetailUseCase,
    ListGeoGroupsUseCase,
    ListCarrierServiceTariffsUseCase,
    QueryCarrierServicesUseCase,
    QueryCarriersUseCase,
    SetCarrierServiceTariffsUseCase,
    UpdateCarrierServiceUseCase,
    UpdateCarrierUseCase,
    UpdateGeoGroupUseCase,
)
from src.intrastructure.database.postgres import get_postgres_session


def get_create_carrier_use_case(session: AsyncSession = Depends(get_postgres_session)) -> CreateCarrierUseCase:
    return CreateCarrierUseCase(session=session)


def get_update_carrier_use_case(session: AsyncSession = Depends(get_postgres_session)) -> UpdateCarrierUseCase:
    return UpdateCarrierUseCase(session=session)


def get_query_carriers_use_case(session: AsyncSession = Depends(get_postgres_session)) -> QueryCarriersUseCase:
    return QueryCarriersUseCase(session=session)


def get_carrier_detail_use_case(session: AsyncSession = Depends(get_postgres_session)) -> GetCarrierDetailUseCase:
    return GetCarrierDetailUseCase(session=session)


def get_create_carrier_service_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> CreateCarrierServiceUseCase:
    return CreateCarrierServiceUseCase(session=session)


def get_update_carrier_service_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> UpdateCarrierServiceUseCase:
    return UpdateCarrierServiceUseCase(session=session)


def get_query_carrier_services_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> QueryCarrierServicesUseCase:
    return QueryCarrierServicesUseCase(session=session)


def get_carrier_service_detail_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> GetCarrierServiceDetailUseCase:
    return GetCarrierServiceDetailUseCase(session=session)


def get_create_geo_group_use_case(session: AsyncSession = Depends(get_postgres_session)) -> CreateGeoGroupUseCase:
    return CreateGeoGroupUseCase(session=session)


def get_update_geo_group_use_case(session: AsyncSession = Depends(get_postgres_session)) -> UpdateGeoGroupUseCase:
    return UpdateGeoGroupUseCase(session=session)


def get_list_geo_groups_use_case(session: AsyncSession = Depends(get_postgres_session)) -> ListGeoGroupsUseCase:
    return ListGeoGroupsUseCase(session=session)


def get_assign_geo_group_regions_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> AssignGeoGroupRegionsUseCase:
    return AssignGeoGroupRegionsUseCase(session=session)


def get_geo_group_detail_use_case(session: AsyncSession = Depends(get_postgres_session)) -> GetGeoGroupDetailUseCase:
    return GetGeoGroupDetailUseCase(session=session)


def get_set_carrier_service_tariffs_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> SetCarrierServiceTariffsUseCase:
    return SetCarrierServiceTariffsUseCase(session=session)


def get_carrier_service_tariffs_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> GetCarrierServiceTariffsUseCase:
    return GetCarrierServiceTariffsUseCase(session=session)


def get_list_carrier_service_tariffs_use_case(
    session: AsyncSession = Depends(get_postgres_session),
) -> ListCarrierServiceTariffsUseCase:
    return ListCarrierServiceTariffsUseCase(session=session)
