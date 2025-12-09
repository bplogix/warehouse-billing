from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.shared.config import settings
from src.shared.logger.factories import infra_logger

logger = infra_logger.bind(component="postgres_db")


class PostgresDatabase:
    """管理 PostgreSQL 主库连接与 Session."""

    def __init__(self) -> None:
        self._engine: AsyncEngine | None = None
        self._session_factory: async_sessionmaker[AsyncSession] | None = None

    def init_engine(self) -> None:
        """根据配置初始化 Engine."""
        if self._engine is not None:
            return

        db_settings = settings.postgres
        # Async drivers already perform health checks before lifecycle events, so skip pool_pre_ping.
        # Keeping pool_pre_ping=True triggers a sync `ping` that requires greenlet_spawn and raises
        # MissingGreenlet inside AsyncPG, so rely on our manual `SELECT 1` startup check instead.
        self._engine = create_async_engine(
            db_settings.sqlalchemy_url,
            pool_size=db_settings.POOL_SIZE,
            max_overflow=db_settings.MAX_OVERFLOW,
        )
        self._session_factory = async_sessionmaker(
            self._engine,
            expire_on_commit=False,
        )
        logger.info("postgres engine initialized")

    async def connect(self) -> None:
        """在应用启动阶段验证数据库连通性."""
        if self._engine is None:
            self.init_engine()

        if self._engine is None:
            raise RuntimeError("Postgres engine was not initialized")

        try:
            async with self._engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
        except SQLAlchemyError as exc:
            logger.exception("postgres connection failed", exc=exc)
            raise
        logger.info("postgres connection established")

    async def dispose(self) -> None:
        """在应用关闭时释放连接资源."""
        if self._engine is None:
            return
        await self._engine.dispose()
        self._engine = None
        self._session_factory = None
        logger.info("postgres engine disposed")

    @asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        """提供 AsyncSession 依赖."""
        if self._session_factory is None:
            self.init_engine()
        if self._session_factory is None:
            raise RuntimeError("Postgres session factory is not ready")

        async with self._session_factory() as session:
            yield session


postgres_db = PostgresDatabase()


async def get_postgres_session() -> AsyncIterator[AsyncSession]:
    """FastAPI 依赖函数，获取 PostgreSQL Session."""
    async with postgres_db.session() as session:
        yield session
