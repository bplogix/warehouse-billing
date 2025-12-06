from __future__ import annotations

from collections.abc import Awaitable

from redis.asyncio import Redis
from redis.exceptions import RedisError

from src.shared.config import settings
from src.shared.logger.factories import infra_logger

logger = infra_logger.bind(component="redis_cache")

_redis_client: Redis | None = None


def get_redis_client() -> Redis:
    if _redis_client is None:
        raise RuntimeError("Redis client has not been initialized")
    return _redis_client


async def init_redis() -> None:
    """初始化 Redis 客户端并验证连接."""
    global _redis_client
    if _redis_client is not None:
        return

    redis_settings = settings.redis
    client = Redis.from_url(
        redis_settings.sqlalchemy_url(),
        encoding="utf-8",
        decode_responses=True,
        max_connections=redis_settings.POOL_SIZE,
    )

    try:
        result = client.ping()
        if isinstance(result, Awaitable):
            await result
    except RedisError:
        await client.close()
        logger.exception("redis connection failed")
        raise

    _redis_client = client
    logger.info("redis connection established")


async def close_redis() -> None:
    """关闭 Redis 连接."""
    global _redis_client
    if _redis_client is None:
        return

    await _redis_client.close()
    _redis_client = None
    logger.info("redis connection closed")
