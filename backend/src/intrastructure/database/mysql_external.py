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

logger = infra_logger.bind(component="external_mysql_db")


class ExternalMySQLDatabase:
    """外部只读 MySQL 数据源管理."""

    def __init__(self) -> None:
        self._engine: AsyncEngine | None = None
        self._session_factory: async_sessionmaker[AsyncSession] | None = None

    @property
    def enabled(self) -> bool:
        return bool(settings.mysql_external.sqlalchemy_url())

    def init_engine(self) -> None:
        if not self.enabled:
            logger.warning("external mysql dsn empty, skip initialization")
            return
        if self._engine is not None:
            return

        mysql_settings = settings.mysql_external
        url = mysql_settings.sqlalchemy_url()
        if not url:
            logger.warning("external mysql config incomplete, skip initialization")
            return
        # Avoid pool_pre_ping on async engines: it executes a sync ping that expects greenlet_spawn,
        # which triggers MissingGreenlet with AsyncPG/aiomysql. We rely on the manual startup check.
        self._engine = create_async_engine(
            url,
            pool_size=mysql_settings.POOL_SIZE,
            pool_pre_ping=True,
            pool_recycle=1800,
            connect_args={"connect_timeout": mysql_settings.CONNECT_TIMEOUT},
        )
        self._session_factory = async_sessionmaker(
            self._engine,
            expire_on_commit=False,
            autoflush=False
        )
        logger.info("external mysql engine initialized")

    async def connect(self) -> None:
        if not self.enabled:
            logger.info("external mysql not configured; skipping connect")
            return
        if self._engine is None:
            self.init_engine()
        if self._engine is None:
            return
        try:
            async with self._engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
        except SQLAlchemyError:
            logger.exception("external mysql connection failed")
            raise
        logger.info("external mysql connection established")

    async def dispose(self) -> None:
        if self._engine is None:
            return
        await self._engine.dispose()
        self._engine = None
        self._session_factory = None
        logger.info("external mysql engine disposed")

    @asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        if not self.enabled:
            raise RuntimeError("External MySQL is not configured")
        if self._session_factory is None:
            self.init_engine()
        if self._session_factory is None:
            raise RuntimeError("External MySQL session factory unavailable")

        async with self._session_factory() as session:
            await session.execute(text("SET SESSION TRANSACTION READ ONLY"))
            await session.execute(text("SET autocommit = 1"))

            yield session


external_mysql_db = ExternalMySQLDatabase()


async def get_external_mysql_session() -> AsyncIterator[AsyncSession]:
    """FastAPI 依赖函数：获取只读 MySQL Session."""
    async with external_mysql_db.session() as session:
        yield session
