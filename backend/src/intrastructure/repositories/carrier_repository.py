from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.intrastructure.database.models import (
    Carrier,
    CarrierService,
    CarrierServiceGeoGroup,
    CarrierServiceGeoGroupRegion,
    CarrierServiceGeoGroupStatus,
    CarrierServiceStatus,
    CarrierStatus,
    Region,
)


class CarrierRepository:
    """Repository helpers for carrier aggregates."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ------------------------------------------------------------------ Carriers
    async def add_carrier(self, carrier: Carrier) -> Carrier:
        self._session.add(carrier)
        await self._session.flush()
        return carrier

    async def get_carrier_by_id(self, carrier_id: int, *, with_services: bool = False) -> Carrier | None:
        stmt = select(Carrier).where(Carrier.id == carrier_id, Carrier.is_deleted.is_(False))
        if with_services:
            stmt = stmt.options(selectinload(Carrier.services))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_carrier_by_code(self, carrier_code: str) -> Carrier | None:
        stmt = select(Carrier).where(
            Carrier.carrier_code == carrier_code,
            Carrier.is_deleted.is_(False),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def search_carriers(
        self,
        *,
        keyword: str | None,
        status: CarrierStatus | None,
        limit: int,
        offset: int,
    ) -> tuple[list[Carrier], int]:
        stmt = select(Carrier).where(Carrier.is_deleted.is_(False))
        count_stmt = select(func.count()).select_from(Carrier).where(Carrier.is_deleted.is_(False))
        if keyword:
            like = f"%{keyword}%"
            stmt = stmt.where(
                (Carrier.carrier_name.ilike(like))
                | (Carrier.carrier_code.ilike(like))
                | (Carrier.description.ilike(like))
            )
            count_stmt = count_stmt.where(
                (Carrier.carrier_name.ilike(like))
                | (Carrier.carrier_code.ilike(like))
                | (Carrier.description.ilike(like))
            )
        if status:
            stmt = stmt.where(Carrier.status == status)
            count_stmt = count_stmt.where(Carrier.status == status)
        stmt = stmt.order_by(Carrier.id.desc()).offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        total = await self._session.execute(count_stmt)
        return list(result.scalars().all()), int(total.scalar_one())

    # ------------------------------------------------------------------ Services
    async def add_service(self, service: CarrierService) -> CarrierService:
        self._session.add(service)
        await self._session.flush()
        return service

    async def get_service_by_id(self, service_id: int) -> CarrierService | None:
        stmt = select(CarrierService).where(
            CarrierService.id == service_id,
            CarrierService.is_deleted.is_(False),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_service_by_code(self, carrier_id: int, service_code: str) -> CarrierService | None:
        stmt = select(CarrierService).where(
            CarrierService.carrier_id == carrier_id,
            CarrierService.service_code == service_code,
            CarrierService.is_deleted.is_(False),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def search_services(
        self,
        *,
        carrier_id: int,
        status: CarrierServiceStatus | None,
        limit: int,
        offset: int,
    ) -> tuple[list[CarrierService], int]:
        stmt = select(CarrierService).where(
            CarrierService.carrier_id == carrier_id,
            CarrierService.is_deleted.is_(False),
        )
        count_stmt = (
            select(func.count())
            .select_from(CarrierService)
            .where(
                CarrierService.carrier_id == carrier_id,
                CarrierService.is_deleted.is_(False),
            )
        )
        if status:
            stmt = stmt.where(CarrierService.status == status)
            count_stmt = count_stmt.where(CarrierService.status == status)
        stmt = stmt.order_by(CarrierService.id.desc()).offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        total = await self._session.execute(count_stmt)
        return list(result.scalars().all()), int(total.scalar_one())

    # ------------------------------------------------------------------ Geo Groups
    async def add_geo_group(self, group: CarrierServiceGeoGroup) -> CarrierServiceGeoGroup:
        self._session.add(group)
        await self._session.flush()
        return group

    async def get_geo_group_by_id(self, group_id: int, *, with_regions: bool = False) -> CarrierServiceGeoGroup | None:
        stmt = select(CarrierServiceGeoGroup).where(
            CarrierServiceGeoGroup.id == group_id,
            CarrierServiceGeoGroup.is_deleted.is_(False),
        )
        if with_regions:
            stmt = stmt.options(selectinload(CarrierServiceGeoGroup.regions))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_geo_group_by_code(self, service_id: int, group_code: str) -> CarrierServiceGeoGroup | None:
        stmt = select(CarrierServiceGeoGroup).where(
            CarrierServiceGeoGroup.carrier_service_id == service_id,
            CarrierServiceGeoGroup.group_code == group_code,
            CarrierServiceGeoGroup.is_deleted.is_(False),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_geo_groups(self, service_id: int) -> list[CarrierServiceGeoGroup]:
        stmt = (
            select(CarrierServiceGeoGroup)
            .where(
                CarrierServiceGeoGroup.carrier_service_id == service_id,
                CarrierServiceGeoGroup.is_deleted.is_(False),
            )
            .options(selectinload(CarrierServiceGeoGroup.regions))
            .order_by(CarrierServiceGeoGroup.id.desc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def get_active_geo_group(self, service_id: int) -> CarrierServiceGeoGroup | None:
        stmt = select(CarrierServiceGeoGroup).where(
            CarrierServiceGeoGroup.carrier_service_id == service_id,
            CarrierServiceGeoGroup.status == CarrierServiceGeoGroupStatus.ACTIVE,
            CarrierServiceGeoGroup.is_deleted.is_(False),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def replace_group_regions(
        self,
        group: CarrierServiceGeoGroup,
        regions: Iterable[CarrierServiceGeoGroupRegion],
    ) -> CarrierServiceGeoGroup:
        await self._session.execute(
            delete(CarrierServiceGeoGroupRegion).where(CarrierServiceGeoGroupRegion.group_id == group.id)
        )
        self._session.add_all(list(regions))
        await self._session.flush()
        return group

    async def fetch_regions_by_codes(self, codes: list[str]) -> list[Region]:
        if not codes:
            return []
        stmt = select(Region).where(Region.region_code.in_(codes), Region.is_deleted.is_(False))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
