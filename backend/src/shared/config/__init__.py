from pydantic import Field
from pydantic_settings import BaseSettings

from src.shared.config.cors_config import CorsSettings
from src.shared.config.database_config import ExternalMySQLSettings, PostgresSettings, RedisSettings
from src.shared.config.log_config import LogSettings


class Settings(BaseSettings):
    ENV: str = "dev"
    DEBUG: bool = True

    APP_NAME: str = "Warehouse Billing"
    APP_VERSION: str = "0.1.0"

    # 注入日志配置
    log: LogSettings = Field(default_factory=LogSettings)
    # 注入cors配置
    cors: CorsSettings = Field(default_factory=CorsSettings)
    # 数据库配置
    postgres: PostgresSettings = Field(default_factory=PostgresSettings)
    mysql_external: ExternalMySQLSettings = Field(default_factory=ExternalMySQLSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)

    class Config:
        env_file = ".env"
        extra = "ignore"  # 环境变量里出现没声明的字段也不报错


# 实例化（关键点）
settings = Settings()
