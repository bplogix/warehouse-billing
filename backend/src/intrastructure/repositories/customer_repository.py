from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.intrastructure.database.models import Customer, CustomerGroupMember, CustomerStatus


class CustomerRepository:
    """Repository for Customer aggregates."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, customer: Customer) -> Customer:
        self._session.add(customer)
        await self._session.flush()
        return customer

    async def get_by_id(self, customer_id: int) -> Customer | None:
        stmt = select(Customer).where(Customer.id == customer_id, Customer.is_deleted.is_(False))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_code(self, customer_code: str) -> Customer | None:
        stmt = select(Customer).where(Customer.customer_code == customer_code, Customer.is_deleted.is_(False))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_company(self, company_id: str) -> list[Customer]:
        stmt = select(Customer).where(Customer.company_id == company_id, Customer.is_deleted.is_(False))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def update_status(self, customer_id: int, status: CustomerStatus, operator: str | None = None) -> None:
        customer = await self.get_by_id(customer_id)
        if customer is None:
            return
        customer.status = status
        customer.updated_by = operator
        await self._session.flush()

    async def soft_delete(self, customer_id: int, operator: str | None = None) -> None:
        customer = await self.get_by_id(customer_id)
        if customer is None:
            return
        customer.is_deleted = True
        customer.deleted_by = operator
        await self._session.flush()

    async def list_group_members(self, group_id: int) -> list[CustomerGroupMember]:
        stmt = select(CustomerGroupMember).where(CustomerGroupMember.group_id == group_id, CustomerGroupMember.is_deleted.is_(False))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
