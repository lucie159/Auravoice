from pydantic_settings import BaseSettings
from typing import List
import json

class Settings(BaseSettings):
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True
    # On met ["*"] pour dire "accepte tout le monde" (localhost, 192.168.x.x, etc.)
    cors_origins: str = '["*"]'
    
    # JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    
    # Database
    database_type: str = "postgresql"  # "postgresql" or "mongodb"
    
    # PostgreSQL
    postgres_host: str = "localhost"
    postgres_port: int = 5433
    postgres_user: str = "auravoice"
    postgres_password: str = "password"
    postgres_db: str = "auravoice"
    
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db: str = "auravoice"
    
    # Files
    upload_dir: str = "./uploads"
    max_audio_size_mb: int = 100
    
    # Emotion Model
    emotion_model_type: str = "local"  # "local", "huggingface", "api"
    emotion_model_path: str = "./models/emotion_model.onnx"
    emotion_model_name: str = "superb/wav2vec2-base-superb-er"
    
    @property
    def postgres_url(self) -> str:
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.cors_origins)
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
