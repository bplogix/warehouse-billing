from urllib.parse import quote_plus

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class PostgresSettings(BaseSettings):
    """PostgreSQL 主库配置"""

    HOST: str = "localhost"
    PORT: int = 5432
    USER: str = "postgres"
    PASSWORD: str = "postgres"
    DATABASE: str = "postgres"
    POOL_SIZE: int = 20
    MAX_OVERFLOW: int = 20

    def _build_dsn(self, driver: str) -> str:
        user = quote_plus(self.USER)
        password = quote_plus(self.PASSWORD)
        return f"postgresql+{driver}://{user}:{password}@{self.HOST}:{self.PORT}/{self.DATABASE}"

    @property
    def sqlalchemy_url(self) -> str:
        return self._build_dsn("asyncpg")

    @property
    def sync_url(self) -> str:
        return self._build_dsn("psycopg2")

    model_config = SettingsConfigDict(
        env_prefix="DB_",
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


class RedisSettings(BaseSettings):
    """Redis 缓存配置"""

    HOST: str = "localhost"
    PORT: int = 6379
    DATABASE: int = 0
    POOL_SIZE: int = 20

    def sqlalchemy_url(self) -> str:
        return f"redis://{self.HOST}:{self.PORT}/{self.DATABASE}"

    model_config = SettingsConfigDict(
        env_prefix="REDIS_",
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


class ExternalMySQLSettings(BaseSettings):
    """外部只读 MySQL 配置"""

    HOST: str = ""
    PORT: int = 3306
    USER: str = ""
    PASSWORD: str = ""
    DATABASE: str = ""
    POOL_SIZE: int = 5
    CONNECT_TIMEOUT: float = 5.0

    def sqlalchemy_url(self) -> str:
        if not self.HOST or not self.USER or not self.DATABASE:
            return ""
        password = quote_plus(self.PASSWORD)
        user = quote_plus(self.USER)
        return f"mysql+aiomysql://{user}:{password}@{self.HOST}:{self.PORT}/{self.DATABASE}"

    model_config = SettingsConfigDict(
        env_prefix="EXTERNAL_RB_",
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )
