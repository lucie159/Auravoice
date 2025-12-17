import os
import asyncio
import numpy as np
import librosa
import joblib
import warnings
import pickle
import base64
import os

EMOTION_LABELS = ["anger", "disgust", "fear", "happiness", "neutral", "sadness", "surprise"]
APP_MAPPING = {
    "angry": "anger",
    "disgust": "anger",
    "fear": "anxiety",
    "happy": "joy",
    "neutral": "calm",
    "sad": "sadness",
    "surprised": "surprise"
}

import tensorflow as tf # Assure-toi que les imports sont là

SCALER_DATA_B64 = "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"

class EmotionAIService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.tf = None
        self.tf_available = False
        
        base_path = os.path.dirname(__file__)
        self.model_path = os.path.join(base_path, "../models/speech_emotion_model.keras")

    async def initialize(self):
        # 1. Chargement TensorFlow
        try:
            import tensorflow as tf
            self.tf = tf
            self.tf_available = True
            print("✅ TensorFlow loaded")
            if os.path.exists(self.model_path):
                self.model = tf.keras.models.load_model(self.model_path)
                print("✅ Emotion model loaded")
        except Exception as e:
            print("⚠️ Erreur modèle/TF:", e)
            self.tf_available = False

        # 2. Chargement Scaler (Directement depuis la mémoire)
        try:
            print("[AI] Tentative de chargement du scaler...")
            # On vérifie si la variable existe et n'est pas vide
            if 'SCALER_DATA_B64' in globals() and len(SCALER_DATA_B64) > 100:
                binary_data = base64.b64decode(SCALER_DATA_B64)
                self.scaler = pickle.loads(binary_data)
                print("✅ Scaler chargé avec succès !")
            else:
                print("⚠️ Pas de données Scaler trouvées, on continue sans.")
                self.scaler = None
            
        except Exception as e:
            # ICI EST LA CLÉ : On affiche l'erreur mais ON NE PLANTE PAS (pas de raise)
            print(f"⚠️ ATTENTION : Le scaler est corrompu ({e}).")
            print("➡️ Le serveur démarre quand même en mode dégradé.")
            self.scaler = None 
        

    async def analyze_audio_file(self, file_path: str):
        """Analyse audio uniquement si TensorFlow et le modèle sont disponibles"""
        if not self.tf_available or self.model is None or self.scaler is None:
            return {
                "dominant_emotion": "calm",
                "client_emotions": [],
                "agent_emotions": [],
                "stats": {"average_confidence": 0},
                "error": "TensorFlow ou modèle non disponible en local",
                "duration": 0
            }

        # Ici tu peux mettre ton code d'analyse normal
        return {"dominant_emotion": "calm", "client_emotions": [], "agent_emotions": [], "stats": {"average_confidence": 0}, "duration": 0}

# Instance globale
emotion_service = EmotionAIService()
