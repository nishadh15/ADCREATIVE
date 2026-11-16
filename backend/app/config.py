from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    mongodb_uri: str = ""            # e.g. mongodb+srv://user:pass@cluster.mongodb.net
    mongodb_db: str = "adcreative"
    # Groq: either GROQ_API_KEYS="k1,k2,..." or GROQ_API_KEY_1 .. GROQ_API_KEY_10
    groq_api_keys: str = ""
    groq_api_key_1: str = ""
    groq_api_key_2: str = ""
    groq_api_key_3: str = ""
    groq_api_key_4: str = ""
    groq_api_key_5: str = ""
    groq_api_key_6: str = ""
    groq_api_key_7: str = ""
    groq_api_key_8: str = ""
    groq_api_key_9: str = ""
    groq_api_key_10: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_vision_model: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    meta_app_id: str = ""
    meta_app_secret: str = ""
    meta_access_token: str = ""
    meta_ig_user_id: str = ""
    meta_redirect_uri: str = ""
    jwt_secret: str = ""
    admin_email: str = ""
    admin_password: str = ""
    frontend_url: str = "http://localhost:3000"

    @property
    def meta_configured(self) -> bool:
        return bool(self.meta_access_token and self.meta_ig_user_id)

    @property
    def groq_keys(self) -> list[str]:
        raw = [k.strip() for k in self.groq_api_keys.split(",")]
        raw += [getattr(self, f"groq_api_key_{i}").strip() for i in range(1, 11)]
        seen, out = set(), []
        for k in raw:
            if k and k not in seen:
                seen.add(k); out.append(k)
        return out

    @property
    def claude_configured(self) -> bool:
        return bool(self.groq_keys)

settings = Settings()
