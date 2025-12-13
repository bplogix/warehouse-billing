from pydantic_settings import BaseSettings, SettingsConfigDict


class LogSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="",
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "prod"  # dev | prod
    LOG_ENABLE_COLOR: bool = True
