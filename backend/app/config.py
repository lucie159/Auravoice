from pydantic_settings import BaseSettings
from typing import List
import json

class Settings(BaseSettings):
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 7860  # Port Hugging Face
    debug: bool = True
    cors_origins: str = '["*"]'
    
    # JWT
    jwt_secret_key: str = "super-secret-key-pour-la-demo" # Tu peux laisser ça
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    
    # Database
    database_type: str = "postgresql"
    
    
    
    # 1. Le Host 
    # Ex: aws-0-eu-central-1.pooler.supabase.com
    postgres_host: str = "aws-1-eu-central-1.pooler.supabase.com"
    
    # 2. Le Port (6543 pour le pooler, ou 5432)
    postgres_port: int = 6543
    
    # 3. L'Utilisateur (le long truc)
    # Ex: postgres.urxdbhtkrqxcofnpvedc
    postgres_user: str = "postgres.urxdbhtkrqxcofnpvedc"
    
    # 4. Le Mot de passe (celui que tu as créé)
    postgres_password: str = "3UgafVPEPRSUeKVs"
    
    # 5. La Database (souvent 'postgres')
    postgres_db: str = "postgres"   
    
    
  
    # Files
    upload_dir: str = "/tmp/uploads" # /tmp est mieux pour le cloud
    max_audio_size_mb: int = 100
    
    # Emotion Model
    emotion_model_type: str = "local"
    emotion_model_path: str = "./models/emotion_model.onnx"
    emotion_model_name: str = "superb/wav2vec2-base-superb-er"
    
    @property
    def postgres_url(self) -> str:
        # Construit l'URL complète automatiquement
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
    
    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.cors_origins)
        except:
            return ["*"]
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()