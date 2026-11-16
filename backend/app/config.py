from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    mongo_db_uri: str = ""            # e.g. mongodb+srv://user:pass@cluster.mongodb.net
    mongo_db_name: str = "adcreative"
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
    # Fallback chain, tried in order. Defaults are Groq free-tier models.
    groq_models: str = "openai/gpt-oss-120b,openai/gpt-oss-20b,qwen/qwen3.8-27b"
    groq_chat_models: str = "openai/gpt-oss-20b,openai/gpt-oss-120b,qwen/qwen3.8-27b"   # chat: fast model first
    groq_vision_model: str = ""      # set a vision-capable model ID to enable image input
    groq_max_tokens: int = 3000      # cap per reply; free tier allows ~8K tokens/min per model
    groq_max_context_chars: int = 12000   # cap on data context sent per request
    meta_app_id: str = ""
    meta_app_secret: str = ""
    meta_access_token: str = ""
    meta_ig_user_id: str = ""
    instagram_account_id: str = ""   # alias of META_IG_USER_ID; either one works
    meta_redirect_uri: str = ""
    jwt_secret: str = ""
    admin_email: str = ""
    admin_password: str = ""
    frontend_url: str = "http://localhost:3000"

    @property
    def ig_user_id(self) -> str:
        return self.meta_ig_user_id or self.instagram_account_id

    @property
    def meta_configured(self) -> bool:
        return bool(self.meta_access_token and self.ig_user_id)

    def _raw_groq_keys(self) -> list[str]:
        import re
        raw = re.split(r"[,;\s]+", self.groq_api_keys or "")
        raw += [getattr(self, f"groq_api_key_{i}") for i in range(1, 11)]
        out, seen = [], set()
        for k in raw:
            k = (k or "").strip().strip("\"'[]()<>")
            if k and k not in seen:
                seen.add(k); out.append(k)
        return out

    @property
    def groq_keys(self) -> list[str]:
        """Usable keys only: printable ASCII (HTTP headers can't carry anything else)."""
        return [k for k in self._raw_groq_keys() if k.isascii() and k.isprintable()]

    @property
    def groq_keys_invalid(self) -> int:
        """How many configured keys were dropped for containing non-ASCII / hidden characters."""
        return len(self._raw_groq_keys()) - len(self.groq_keys)

    @property
    def groq_chat_model_list(self) -> list[str]:
        return [m.strip() for m in self.groq_chat_models.split(",") if m.strip()]

    @property
    def groq_model_list(self) -> list[str]:
        return [m.strip() for m in self.groq_models.split(",") if m.strip()]

    @property
    def claude_configured(self) -> bool:
        return bool(self.groq_keys)

settings = Settings()
