from pydantic_settings import BaseSettings


class CorsSettings(BaseSettings):
    CORS_ALLOWED_ORIGINS: list[str] = ["*"]
    CORS_ALLOWED_METHODS: list[str] = ["*"]
    CORS_ALLOWED_HEADERS: list[str] = ["*"]
    CORS_ALLOWED_CERDENTIALS: bool = True

    class Config:
        env_prefix = "CORS_"
        case_sensitive = False
