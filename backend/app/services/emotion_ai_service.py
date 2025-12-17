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

class EmotionAIService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.tf = None
        self.tf_available = False
        
        base_path = os.path.dirname(__file__)
        self.model_path = os.path.join(base_path, "../models/speech_emotion_model.keras")
        # On stocke le chemin dans self pour pouvoir l'utiliser plus bas
        self.scaler_txt_path = os.path.join(base_path, "../models/scaler_b64.txt")

    async def initialize(self):
        """
        Initialise le scaler et vérifie TensorFlow.
        """
        # 1. Chargement de TensorFlow et du Modèle
        try:
            import tensorflow as tf
            self.tf = tf
            self.tf_available = True
            print("✅ TensorFlow loaded")
            
            if os.path.exists(self.model_path):
                self.model = tf.keras.models.load_model(self.model_path)
                print("✅ Emotion model loaded")
            else:
                print(f"⚠️ Modèle introuvable au chemin : {self.model_path}")
                
        except Exception as e:
            print("⚠️ TensorFlow not available or model error:", e)
            self.tf = None
            self.model = None
            self.tf_available = False

        # 2. Chargement du Scaler (Version Base64 anti-corruption)
        try:
            print(f"[AI] Chargement du scaler depuis : {self.scaler_txt_path}")
            
            # Utilisation de self.scaler_txt_path corrigé
            with open(self.scaler_txt_path, "r") as f:
                b64_data = f.read()
                binary_data = base64.b64decode(b64_data)
                self.scaler = pickle.loads(binary_data)
                
            print("✅ Scaler chargé avec succès (via Base64)")
            
        except Exception as e:
            print(f"❌ Erreur critique chargement scaler : {e}")
            # On relève l'erreur car sans scaler, l'IA ne sert à rien
            raise e
        

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
