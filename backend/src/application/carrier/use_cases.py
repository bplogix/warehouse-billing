from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from src.application.carrier.commands import (
    AssignGeoGroupRegionsCommand,
    CarrierServiceTariffRowInput,
    CreateCarrierCommand,
    CreateCarrierServiceCommand,
    CreateGeoGroupCommand,
    QueryCarriersCommand,
    QueryCarrierServicesCommand,
    SetCarrierServiceTariffsCommand,
    UpdateCarrierCommand,
    UpdateCarrierServiceCommand,
    UpdateGeoGroupCommand,
)
from src.application.carrier.exceptions import (
    CarrierAlreadyExistsError,
    CarrierNotFoundError,
    CarrierServiceAlreadyExistsError,
    CarrierServiceGeoGroupConflictError,
    CarrierServiceGeoGroupNotFoundError,
    CarrierServiceNotFoundError,
    RegionNotFoundError,
)
from src.intrastructure.database.models import (
    Carrier,
    CarrierService,
    CarrierServiceGeoGroup,
    CarrierServiceGeoGroupRegion,
    CarrierServiceGeoGroupStatus,
    CarrierServiceTariff,
    CarrierServiceTariffSnapshot,
    CarrierServiceTariffSnapshotStatus,
    Region,
)
from src.intrastructure.repositories import CarrierRepository
from src.shared.logger.factories import app_logger

logger = app_logger.bind(component="carrier_use_cases")


@dataclass(slots=True)
class QueryCarriersResult:
    total: int
    items: list[Carrier]


@dataclass(slots=True)
class QueryCarrierServicesResult:
    total: int
    items: list[CarrierService]


class CreateCarrierUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CarrierRepository(session)

    async def execute(self, cmd: CreateCarrierCommand, operator: str) -> Carrier:
        async with self._session.begin():
            existing = await self._repo.get_carrier_by_code(cmd.carrier_code)
            if existing:
                raise CarrierAlreadyExistsError("carrier code already exists")
            carrier = Carrier(
                carrier_code=cmd.carrier_code,
                carrier_name=cmd.carrier_name,
                description=cmd.description,
                country_code=cmd.country_code,
                status=cmd.status,
                contact_email=cmd.contact_email,
                contact_phone=cmd.contact_phone,
                website=cmd.website,
                attributes=cmd.attributes,
            )
            carrier.created_by = operator
            await self._repo.add_carrier(carrier)
        logger.info("carrier created", carrier_code=cmd.carrier_code)
        return carrier


class UpdateCarrierUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CarrierRepository(session)

    async def execute(self, cmd: UpdateCarrierCommand, operator: str) -> Carrier | None:
        async with self._session.begin():
            carrier = await self._repo.get_carrier_by_id(cmd.carrier_id)
            if carrier is None:
                return None
            carrier.carrier_name = cmd.carrier_name
            carrier.country_code = cmd.country_code
            carrier.status = cmd.status
            carrier.description = cmd.description
            carrier.contact_email = cmd.contact_email
            carrier.contact_phone = cmd.contact_phone
            carrier.website = cmd.website
            carrier.attributes = cmd.attributes
            carrier.updated_by = operator
            await self._session.flush()
        logger.info("carrier updated", carrier_id=cmd.carrier_id)
        return carrier


class QueryCarriersUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CarrierRepository(session)

    async def execute(self, cmd: QueryCarriersCommand) -> QueryCarriersResult:
        carriers, total = await self._repo.search_carriers(
            keyword=cmd.keyword,
            status=cmd.status,
            limit=cmd.limit,
            offset=cmd.offset,
        )
        return QueryCarriersResult(items=carriers, total=total)


class GetCarrierDetailUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CarrierRepository(session)

    async def execute(self, carrier_id: int) -> Carrier | None:
        return await self._repo.get_carrier_by_id(carrier_id, with_services=True)


class CreateCarrierServiceUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CarrierRepository(session)

    async def execute(self, cmd: CreateCarrierServiceCommand, operator: str) -> CarrierService:
        async with self._session.begin():
            carrier = await self._repo.get_carrier_by_id(cmd.carrier_id)
            if carrier is None:
                raise CarrierNotFoundError("carrier not found")
            existing = await self._repo.get_service_by_code(cmd.carrier_id, cmd.service_code)
            if existing:
                raise CarrierServiceAlreadyExistsError("carrier service code already exists")
            service = CarrierService(
                carrier_id=cmd.carrier_id,
                service_code=cmd.service_code,
                service_name=cmd.service_name,
                status=cmd.status,
                description=cmd.description,
                attributes=cmd.attributes,
            )
            service.created_by = operator
            await self._repo.add_service(service)
        logger.info("carrier service created", service_code=cmd.service_code, carrier_id=cmd.carrier_id)
        return service


class UpdateCarrierServiceUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CarrierRepository(session)

    async def execute(self, cmd: UpdateCarrierServiceCommand, operator: str) -> CarrierService | None:
        async with self._session.begin():
            service = await self._repo.get_service_by_id(cmd.service_id)
            if service is None or service.carrier_id != cmd.carrier_id:
                return None
            service.service_name = cmd.service_name
            service.status = cmd.status
            service.description = cmd.description
            service.attributes = cmd.attributes
            service.updated_by = operator
            await self._session.flush()
        logger.info("carrier service updated", service_id=cmd.service_id)
        return service


class QueryCarrierServicesUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CarrierRepository(session)

    async def execute(self, cmd: QueryCarrierServicesCommand) -> QueryCarrierServicesResult:
        services, total = await self._repo.search_services(
            carrier_id=cmd.carrier_id,
            status=cmd.status,
            limit=cmd.limit,
            offset=cmd.offset,
        )
        return QueryCarrierServicesResult(items=services, total=total)


class GetCarrierServiceDetailUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CarrierRepository(session)

    async def execute(self, carrier_id: int, service_id: int) -> CarrierService | None:
        service = await self._repo.get_service_by_id(service_id)
        if service is None or service.carrier_id != carrier_id:
            return None
        return service


class CreateGeoGroupUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CarrierRepository(session)

    async def execute(self, cmd: CreateGeoGroupCommand, operator: str) -> CarrierServiceGeoGroup:
        async with self._session.begin():
            service = await self._repo.get_service_by_id(cmd.carrier_service_id)
            if service is None or service.carrier_id != cmd.carrier_id:
                raise CarrierServiceNotFoundError("carrier service not found")
            existing = await self._repo.get_geo_group_by_code(cmd.carrier_service_id, cmd.group_code)
            if existing:
                raise CarrierServiceGeoGroupConflictError("group code already exists")
            if cmd.status is CarrierServiceGeoGroupStatus.ACTIVE:
                active_group = await self._repo.get_active_geo_group(cmd.carrier_service_id)
                if active_group is not None:
                    raise CarrierServiceGeoGroupConflictError("active geo group already exists")
            group = CarrierServiceGeoGroup(
                carrier_service_id=cmd.carrier_service_id,
                group_code=cmd.group_code,
                group_name=cmd.group_name,
                description=cmd.description,
                status=cmd.status,
                attributes=cmd.attributes,
            )
            group.created_by = operator
            await self._repo.add_geo_group(group)
        logger.info(
            "carrier service geo group created",
            service_id=cmd.carrier_service_id,
            group_code=cmd.group_code,
        )
        return group


class UpdateGeoGroupUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CarrierRepository(session)

    async def execute(self, cmd: UpdateGeoGroupCommand, operator: str) -> CarrierServiceGeoGroup | None:
        async with self._session.begin():
            group = await self._repo.get_geo_group_by_id(cmd.group_id)
            if group is None:
                return None
            service = await self._repo.get_service_by_id(cmd.carrier_service_id)
            if service is None or service.carrier_id != cmd.carrier_id or group.carrier_service_id != service.id:
                return None

            if cmd.status is CarrierServiceGeoGroupStatus.ACTIVE:
                active_group = await self._repo.get_active_geo_group(service.id)
                if active_group is not None and active_group.id != group.id:
                    raise CarrierServiceGeoGroupConflictError("another active geo group exists")

            group.group_name = cmd.group_name
            group.status = cmd.status
            group.description = cmd.description
            group.attributes = cmd.attributes
            group.updated_by = operator
            await self._session.flush()
        logger.info("carrier service geo group updated", group_id=cmd.group_id)
        return group


class ListGeoGroupsUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CarrierRepository(session)

    async def execute(self, carrier_id: int, service_id: int) -> list[CarrierServiceGeoGroup]:
        service = await self._repo.get_service_by_id(service_id)
        if service is None or service.carrier_id != carrier_id:
            raise CarrierServiceNotFoundError("carrier service not found")
        return await self._repo.list_geo_groups(service_id)


class AssignGeoGroupRegionsUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CarrierRepository(session)

    async def execute(self, cmd: AssignGeoGroupRegionsCommand, operator: str) -> CarrierServiceGeoGroup:
        async with self._session.begin():
            group = await self._repo.get_geo_group_by_id(cmd.group_id, with_regions=True)
            if group is None:
                raise CarrierServiceGeoGroupNotFoundError("geo group not found")
            service = await self._repo.get_service_by_id(cmd.carrier_service_id)
            if service is None or service.carrier_id != cmd.carrier_id or group.carrier_service_id != service.id:
                raise CarrierServiceNotFoundError("carrier service not found")

            codes = list(dict.fromkeys(cmd.region_codes))
            db_regions: list[Region] = await self._repo.fetch_regions_by_codes(codes)
            found_codes = {region.region_code for region in db_regions}
            missing = [code for code in codes if code not in found_codes]
            if missing:
                raise RegionNotFoundError(f"region codes not found: {', '.join(missing)}")

            region_map = {region.region_code: region for region in db_regions}
            new_regions: list[CarrierServiceGeoGroupRegion] = []
            for idx, code in enumerate(codes, start=1):
                region = region_map[code]
                new_regions.append(
                    CarrierServiceGeoGroupRegion(
                        group_id=group.id,
                        region_code=region.region_code,
                        region_level=region.level,
                        priority=idx,
                    )
                )
            await self._repo.replace_group_regions(group, new_regions)
            group.updated_by = operator
        logger.info("geo group regions updated", group_id=cmd.group_id, region_count=len(cmd.region_codes))
        return group


class GetGeoGroupDetailUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CarrierRepository(session)

    async def execute(self, carrier_id: int, service_id: int, group_id: int) -> CarrierServiceGeoGroup | None:
        group = await self._repo.get_geo_group_by_id(group_id, with_regions=True)
        if group is None:
            return None
        service = await self._repo.get_service_by_id(service_id)
        if service is None or service.carrier_id != carrier_id or group.carrier_service_id != service.id:
            return None
        return group


class SetCarrierServiceTariffsUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo = CarrierRepository(session)

    async def execute(self, cmd: SetCarrierServiceTariffsCommand, operator: str) -> CarrierServiceTariffSnapshot:
        if not cmd.rows:
            raise ValueError("tariff rows are required")
        async with self._session.begin():
            service = await self._repo.get_service_by_id(cmd.service_id)
            if service is None or service.carrier_id != cmd.carrier_id:
                raise CarrierServiceNotFoundError("carrier service not found")
            carrier = await self._repo.get_carrier_by_id(cmd.carrier_id)
            if carrier is None:
                raise CarrierNotFoundError("carrier not found")

            group = await self._repo.get_geo_group_by_id(cmd.geo_group_id, with_regions=True)
            if group is None or group.carrier_service_id != cmd.service_id:
                raise CarrierServiceGeoGroupNotFoundError("geo group not found")

            region_codes = [region.region_code for region in group.regions]
            if not region_codes:
                raise RegionNotFoundError("geo group has no regions")

            tariffs = [
                CarrierServiceTariff(
                    carrier_service_id=cmd.service_id,
                    region_code=region_code,
                    weight_max_kg=row.weight_max_kg,
                    volume_max_cm3=row.volume_max_cm3,
                    girth_max_cm=row.girth_max_cm,
                    currency=cmd.currency,
                    price_amount=row.price_amount,
                    created_by=operator,
                )
                for region_code in region_codes
                for row in cmd.rows
            ]
            await self._repo.replace_tariffs(cmd.service_id, region_codes, tariffs)

            regions = await self._repo.fetch_regions_by_codes(region_codes)
            region_name_map = {region.region_code: region.name for region in regions}

            payload = _build_tariff_snapshot_payload(
                region_codes,
                region_name_map,
                cmd.currency,
                list(cmd.rows),
            )
            version = await self._repo.get_latest_tariff_snapshot_version(cmd.carrier_id, cmd.service_id) + 1
            snapshot = CarrierServiceTariffSnapshot(
                carrier_id=cmd.carrier_id,
                service_id=cmd.service_id,
                carrier_code=carrier.carrier_code,
                service_code=service.service_code,
                effective_from=cmd.effective_from,
                effective_to=cmd.effective_to,
                payload=payload,
                status=CarrierServiceTariffSnapshotStatus.ACTIVE.value,
                version=version,
                created_by=operator,
            )
            await self._repo.add_tariff_snapshot(snapshot)
        logger.info(
            "carrier service tariffs updated",
            service_id=cmd.service_id,
            geo_group_id=cmd.geo_group_id,
            snapshot_id=snapshot.id,
        )
        return snapshot


def _build_tariff_snapshot_payload(
    region_codes: list[str],
    region_name_map: dict[str, str],
    currency: str,
    rows: list[CarrierServiceTariffRowInput],
) -> dict[str, object]:
    girth_max_values = sorted({row.girth_max_cm for row in rows if row.girth_max_cm is not None})
    weight_max_values = sorted({row.weight_max_kg for row in rows if row.weight_max_kg is not None})
    volume_max_values = sorted({row.volume_max_cm3 for row in rows if row.volume_max_cm3 is not None})

    region_axis = [{"code": code, "name": region_name_map.get(code, "")} for code in region_codes]
    metric_axis: dict[str, list[float] | list[int]] = {}
    if weight_max_values:
        metric_axis["weight_max_kg"] = weight_max_values
    if volume_max_values:
        metric_axis["volume_max_cm3"] = volume_max_values
    if girth_max_values:
        metric_axis["girth_max_cm"] = girth_max_values

    matrix: list[dict[str, object]] = []
    region_rows = [
        {
            "weight_max_kg": row.weight_max_kg,
            "volume_max_cm3": row.volume_max_cm3,
            "girth_max_cm": row.girth_max_cm,
            "price_amount": row.price_amount,
        }
        for row in rows
    ]
    for code in region_codes:
        matrix.append({"region_code": code, "rows": region_rows})

    return {
        "currency": currency,
        "geo_axis": region_axis,
        "metric_axis": metric_axis,
        "matrix": matrix,
    }
