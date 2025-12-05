from pydantic_settings import BaseSettings


class LogSettings(BaseSettings):
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "dev"  # dev | prod
    LOG_ENABLE_COLOR: bool = True

    class Config:
        env_prefix = "LOG_"  # 允许 LOG_FORMAT, LOG_LEVEL 环境变量覆盖
        case_sensitive = False
