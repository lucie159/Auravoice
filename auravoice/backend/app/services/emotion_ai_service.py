import os
import numpy as np
import librosa
import tensorflow as tf
from app.config import settings

# Mapping RAVDESS (Standard) vers AuraVoice
# RAVDESS: 01=neutral, 02=calm, 03=happy, 04=sad, 05=angry, 06=fearful, 07=disgust, 08=surprised
EMOTION_MAPPING = {
    0: "calm",      # neutral -> calm
    1: "calm",      # calm -> calm
    2: "joy",       # happy -> joy
    3: "sadness",   # sad -> sadness
    4: "anger",     # angry -> anger
    5: "anxiety",   # fearful -> anxiety
    6: "anger",     # disgust -> anger (proche)
    7: "surprise"   # surprised -> surprise
}

class EmotionAIService:
    def __init__(self):
        self.model = None
        self.model_path = "app/models/emotions/Model_LSTM.h5"  # Chemin relatif

    async def initialize(self):
        """Charge le modèle Keras au démarrage"""
        if os.path.exists(self.model_path):
            print(f"[AI] Chargement du modèle depuis {self.model_path}...")
            try:
                self.model = tf.keras.models.load_model(self.model_path)
                print("[AI] Modèle LSTM chargé avec succès !")
            except Exception as e:
                print(f"[AI] ERREUR CRITIQUE: Impossible de charger le modèle : {e}")
        else:
            print(f"[AI] ATTENTION: Modèle introuvable à {self.model_path}")

    def preprocess_audio(self, file_path):
        """
        Transforme l'audio en format compatible avec ton LSTM.
        Basé sur ton code: np.expand_dims(..., -1)
        """
        # 1. Charger l'audio (durée fixe 3s pour homogénéiser comme RAVDESS souvent)
        data, sample_rate = librosa.load(file_path, duration=3.0, offset=0.5)
        
        # 2. Extraction de features (MFCC est standard pour LSTM Speech)
        # ADAPTE CETTE PARTIE SI TON MODÈLE PREND AUTRE CHOSE QUE DES MFCC
        mfcc = librosa.feature.mfcc(y=data, sr=sample_rate, n_mfcc=40)
        mfcc = np.mean(mfcc.T, axis=0)
        
        # 3. Reshape pour le modèle (Batch, Features, 1) comme ton code d'exemple
        X = np.expand_dims(mfcc, axis=0) # Batch dimension
        X = np.expand_dims(X, axis=-1)   # Channel dimension
        return X

    async def analyze_audio_file(self, file_path: str):
        if not self.model:
            return self._get_mock_result() # Fallback si modèle pas chargé

        try:
            # 1. Prédiction
            X = self.preprocess_audio(file_path)
            predictions = self.model.predict(X)
            
            # 2. Récupérer l'index max et la confiance
            predicted_index = np.argmax(predictions)
            confidence = float(np.max(predictions)) * 100
            
            emotion_label = EMOTION_MAPPING.get(predicted_index, "calm")

            # 3. Construire la réponse (Timeline simplifiée car analyse globale)
            # Pour un vrai découpage temps réel, on ferait une boucle sur des segments
            return {
                "dominant_emotion": emotion_label,
                "client_emotions": [
                    {"emotion": emotion_label, "confidence": confidence, "timestamp": 0},
                    {"emotion": emotion_label, "confidence": confidence, "timestamp": 3000} # Fin estimée
                ],
                "agent_emotions": [], # On n'analyse pas l'agent dans ce mode simple upload
                "stats": {
                    "average_confidence": confidence,
                    "anger_percentage": 100 if emotion_label == "anger" else 0,
                    "joy_percentage": 100 if emotion_label == "joy" else 0,
                    # ... autres stats simples
                }
            }
        except Exception as e:
            print(f"[AI] Erreur de prédiction: {e}")
            return self._get_mock_result()

    def _get_mock_result(self):
        """Fallback temporaire si erreur technique"""
        return {
            "dominant_emotion": "calm",
            "client_emotions": [], 
            "agent_emotions": [],
            "stats": {"average_confidence": 0}
        }

# Instance globale
emotion_service = EmotionAIService()