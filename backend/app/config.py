from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = ""
    claude_api_key: str = ""
    meta_app_id: str = ""
    meta_app_secret: str = ""
    meta_access_token: str = ""
    meta_redirect_uri: str = ""
    jwt_secret: str = ""
    admin_email: str = ""
    admin_password: str = ""
    frontend_url: str = "http://localhost:3000"

    @property
    def meta_configured(self) -> bool:
        return bool(self.meta_app_id and self.meta_app_secret and self.meta_access_token)

    @property
    def claude_configured(self) -> bool:
        return bool(self.claude_api_key)

settings = Settings()
