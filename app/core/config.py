# app/ Backend application
# core/config.py Environment/configuration

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # -----------------------------------------------------
    # Application
    # -----------------------------------------------------

    APP_NAME: str

    # -----------------------------------------------------
    # Database
    # -----------------------------------------------------

    DATABASE_URL: str

    # -----------------------------------------------------
    # JWT
    # -----------------------------------------------------

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int

    # -----------------------------------------------------
    # SMTP
    # -----------------------------------------------------

    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USERNAME: str
    SMTP_PASSWORD: str

    # -----------------------------------------------------
    # Frontend
    # -----------------------------------------------------

    FRONTEND_URL: str

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()