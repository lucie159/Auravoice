import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.emotion_ai_service import emotion_service

router = APIRouter()

@router.post("api/analyze/upload")
async def analyze_audio_endpoint(file: UploadFile = File(...)):
    # 1. Dossier temporaire
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, file.filename)
    
    try:
        # 2. Sauvegarde
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 3. Analyse
        result = await emotion_service.analyze_audio_file(temp_file_path)
        return result

    except Exception as e:
        print(f"Erreur endpoint: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de l'analyse")
        
    finally:
        # 4. Nettoyage
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except:
                pass