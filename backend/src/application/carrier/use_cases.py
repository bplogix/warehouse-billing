from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from src.application.carrier.commands import (
    AssignGeoGroupRegionsCommand,
    CreateCarrierCommand,
    CreateCarrierServiceCommand,
    CreateGeoGroupCommand,
    QueryCarriersCommand,
    QueryCarrierServicesCommand,
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
                service_type=cmd.service_type,
                status=cmd.status,
                description=cmd.description,
                effective_date=cmd.effective_date,
                expire_date=cmd.expire_date,
                coverage_group_code=cmd.coverage_group_code,
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
            service.service_type = cmd.service_type
            service.status = cmd.status
            service.description = cmd.description
            service.effective_date = cmd.effective_date
            service.expire_date = cmd.expire_date
            service.coverage_group_code = cmd.coverage_group_code
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
