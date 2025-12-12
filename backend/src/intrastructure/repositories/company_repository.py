from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.intrastructure.database.models import Company


class CompanyRepository:
    """Repository for Company entity."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, company: Company) -> Company:
        self._session.add(company)
        await self._session.flush()
        return company

    async def get_by_id(self, company_id: str) -> Company | None:
        stmt = select(Company).where(Company.company_id == company_id, Company.is_deleted.is_(False))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_code(self, company_code: str) -> Company | None:
        stmt = select(Company).where(Company.company_code == company_code, Company.is_deleted.is_(False))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_name(self, company_name: str) -> Company | None:
        stmt = select(Company).where(Company.company_name == company_name, Company.is_deleted.is_(False))
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_ids(self, ids: Sequence[str]) -> list[Company]:
        if not ids:
            return []
        stmt = select(Company).where(Company.company_id.in_(ids), Company.is_deleted.is_(False))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_source_ref_ids(self) -> list[str]:
        stmt = select(Company.source_ref_id).where(
            Company.source_ref_id.is_not(None),
            Company.is_deleted.is_(False),
        )
        result = await self._session.execute(stmt)
        return [value for value in result.scalars().all() if value]

    async def soft_delete(self, company_id: str, operator: str | None = None) -> None:
        company = await self.get_by_id(company_id)
        if company is None:
            return
        company.is_deleted = True
        company.deleted_by = operator
        await self._session.flush()
