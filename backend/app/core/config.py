from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "QuickDesk"
    environment: str = "development"

    database_url: str
    jwt_secret_key: str
    groq_api_key: str | None = None

    email_host: str = "smtp.gmail.com"
    email_port: int = 587
    email_username: str
    email_password: str
    email_from: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()