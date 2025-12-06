"""Verify connectivity to Postgres, external MySQL, and Redis."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from src.intrastructure.cache.redis import close_redis, init_redis
from src.intrastructure.database.mysql_external import external_mysql_db
from src.intrastructure.database.postgres import postgres_db
from src.shared.logger import setup_logging

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


async def check_all_connections() -> None:
    """Ensure all infrastructure services are reachable."""
    setup_logging()
    await postgres_db.connect()
    await external_mysql_db.connect()
    await init_redis()

    await external_mysql_db.dispose()
    await postgres_db.dispose()
    await close_redis()


if __name__ == "__main__":
    asyncio.run(check_all_connections())
