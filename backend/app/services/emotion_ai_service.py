import os
import asyncio
import numpy as np
import librosa
import joblib
import warnings
import pickle

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

class EmotionAIService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.tf = None  # TensorFlow variable
        base_path = os.path.dirname(__file__)
        self.model_path = os.path.join(base_path, "../models/speech_emotion_model.keras")
        self.scaler_path = os.path.join(base_path, "../models/scaler_v2.pkl")
        self.tf_available = False  # marqueur pour savoir si TF est dispo

    async def initialize(self):
        """
        Initialise le scaler et vérifie TensorFlow si possible.
        En local Windows, TensorFlow sera ignoré pour éviter le crash.
        """
        try:
            import tensorflow as tf
            self.tf = tf
            self.tf_available = True
            print("✅ TensorFlow loaded")
            if os.path.exists(self.model_path):
                self.model = tf.keras.models.load_model(self.model_path)
                print("✅ Emotion model loaded")
        except Exception as e:
            print("⚠️ TensorFlow not available, backend continues anyway:", e)
            self.tf = None
            self.model = None
            self.tf_available = False

        # Charger le scaler (indépendant de TF)
        if os.path.exists(self.scaler_path):
            with open(self.scaler_path, "rb") as f:
                self.scaler = pickle.load(f)
            print("✅ Scaler loaded")
        else:
            print(f"[AI] ERREUR : Fichier scaler introuvable à {self.scaler_path}")
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
