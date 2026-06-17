from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    groq_api_key: str
    supabase_url: str
    supabase_key: str
    environment: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()