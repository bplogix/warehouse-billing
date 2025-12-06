from __future__ import annotations

from collections.abc import Iterable
from typing import TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped

TModel = TypeVar("TModel", bound=Mapped)


class BaseRepository:
    """Common helper for async SQLAlchemy repositories."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add(self, entity: TModel) -> TModel:
        self._session.add(entity)
        await self._session.flush()
        return entity

    async def add_all(self, entities: Iterable[TModel]) -> None:
        self._session.add_all(list(entities))
        await self._session.flush()

    async def get_by_id(self, model: type[TModel], entity_id: object) -> TModel | None:
        stmt = select(model).where(model.id == entity_id)  # type: ignore[attr-defined]
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()
