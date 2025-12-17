from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.database import init_database, close_database
from app.routers import auth, calls, websocket, analysis
from app.services.emotion_ai_service import emotion_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events"""
    # Startup
    print(" Starting AuraVoice Backend...")
    
    # Créer le dossier uploads
    os.makedirs(settings.upload_dir, exist_ok=True)
    
    # Initialiser la base de données
    await init_database()
    
    # Initialiser le service d'IA
    await emotion_service.initialize()
    
    print("AuraVoice Backend ready!")
    
    yield
    
    # Shutdown
    print("Shutting down AuraVoice Backend...")
    await close_database()


app = FastAPI(
    title="AuraVoice API",
    description="API Backend pour le copilote émotionnel AuraVoice",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origins=[
        "http://localhost:3000",
        "https://auravoice.vercel.app",  # <-- Ton URL Vercel exacte
        "*"  # En dernier recours pour la démo, autorise tout le monde (optionnel mais pratique)
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Autorise GET, POST, PUT, DELETE...
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router)
app.include_router(analysis.router)
app.include_router(calls.router)
app.include_router(websocket.router)


@app.get("/")
async def root():
    return {
        "name": "AuraVoice API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )
