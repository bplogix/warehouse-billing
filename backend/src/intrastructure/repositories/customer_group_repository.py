from __future__ import annotations

from collections.abc import Iterable

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.intrastructure.database.models import CustomerGroup, CustomerGroupMember


class CustomerGroupRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add_group(self, group: CustomerGroup) -> CustomerGroup:
        self._session.add(group)
        await self._session.flush()
        return group

    async def get_group(self, group_id: int) -> CustomerGroup | None:
        stmt = select(CustomerGroup).where(CustomerGroup.id == group_id, CustomerGroup.is_deleted.is_(False))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_groups(self) -> list[CustomerGroup]:
        stmt = select(CustomerGroup).where(CustomerGroup.is_deleted.is_(False))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def replace_members(self, group_id: int, members: Iterable[CustomerGroupMember]) -> None:
        await self._session.execute(delete(CustomerGroupMember).where(CustomerGroupMember.group_id == group_id))
        self._session.add_all(list(members))
        await self._session.flush()
