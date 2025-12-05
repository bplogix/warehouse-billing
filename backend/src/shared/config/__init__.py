from pydantic_settings import BaseSettings

from src.shared.config.cors_config import CorsSettings
from src.shared.config.log_config import LogSettings


class Settings(BaseSettings):
    ENV: str = ""
    DEBUG: bool = True

    APP_NAME: str = "Warehouse Billing"
    APP_VERSION: str = "0.1.0"

    # 注入日志配置
    log: LogSettings = LogSettings()
    # 注入cors配置
    cors: CorsSettings = CorsSettings()

    class Config:
        env_file = ".env"
        extra = "ignore"  # 环境变量里出现没声明的字段也不报错


# 实例化（关键点）
settings = Settings()
