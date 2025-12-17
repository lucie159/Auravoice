import os
import asyncio
import numpy as np
import librosa
import tensorflow as tf
import joblib
import warnings

# 1. LISTE DES ÉMOTIONS DU MODÈLE (Ordre de l'entraînement)
# IMPORTANT : Cet ordre doit correspondre à encoder.categories_[0] de ton notebook
EMOTION_LABELS = ["anger", "disgust", "fear", "happiness", "neutral", "sadness", "surprise"]

# 2. MAPPING VERS TON APPLICATION (Frontend)
# Ton appli attend : joy, anger, sadness, anxiety, calm, surprise
APP_MAPPING = {
    "angry": "anger",
    "disgust": "anger",     # On mappe dégoût sur colère
    "fear": "anxiety",      # Peur sur anxiété
    "happy": "joy",
    "neutral": "calm",
    "sad": "sadness",
    "surprised": "surprise"
}

class EmotionAIService:
    def __init__(self):
        self.model = None
        self.scaler = None
        
        # Chemins absolus vers tes fichiers
        base_path = os.path.dirname(__file__)
        self.model_path = os.path.join(base_path, "../models/speech_emotion_model.keras")
        self.scaler_path = os.path.join(base_path, "../models/scaler.pkl") 

    async def initialize(self):
        """Charge le modèle Keras et le Scaler au démarrage"""
        print("[AI] Initialisation des composants IA (TensorFlow)...")
        try:
            # On charge dans un thread séparé pour ne pas bloquer le serveur
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._load_components)
        except Exception as e:
            print(f"[AI] ERREUR CRITIQUE lors du chargement : {e}")

    def _load_components(self):
        # 1. Charger le modèle
        if os.path.exists(self.model_path):
            self.model = tf.keras.models.load_model(self.model_path)
            print(f"[AI] Modèle chargé avec succès : {self.model_path}")
        else:
            print(f"[AI] ERREUR : Fichier modèle introuvable à {self.model_path}")

        # 2. Charger le scaler (Indispensable pour que ça marche)
        if os.path.exists(self.scaler_path):
            self.scaler = joblib.load(self.scaler_path)
            print(f"[AI] Scaler chargé avec succès : {self.scaler_path}")
        else:
            print(f"[AI] ERREUR : Fichier scaler introuvable à {self.scaler_path}")

    def extract_features(self, file_path, sr=22050, n_mfcc=40, max_len=300):
        """
        Extrait les caractéristiques audio EXACTEMENT comme lors de l'entraînement.
        MFCC + Chroma + ZCR + RMS -> Stack -> Pad/Truncate
        """
        try:
            # Chargement audio
            y, _ = librosa.load(file_path, sr=sr)
            
            # Vérification fichier vide/silence
            if y is None or len(y) < 2048:
                return np.zeros((max_len, 54)) # 54 features concaténées

            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                # Extraction
                mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc).T
                chroma = librosa.feature.chroma_stft(y=y, sr=sr).T
                zcr = librosa.feature.zero_crossing_rate(y).T
                rms = librosa.feature.rms(y=y).T

            # Synchronisation des longueurs
            min_l = min(len(mfccs), len(chroma), len(zcr), len(rms))
            # Concaténation (axis=1)
            combined = np.hstack([mfccs[:min_l], chroma[:min_l], zcr[:min_l], rms[:min_l]])

            # Padding ou Truncating pour avoir toujours 300 timesteps
            if combined.shape[0] < max_len:
                pad_width = max_len - combined.shape[0]
                # Pad avec des zéros à la fin
                combined = np.pad(combined, ((0, pad_width), (0, 0)), mode='constant')
            else:
                # Couper si trop long
                combined = combined[:max_len]

            return combined

        except Exception as e:
            print(f"[AI] Erreur extraction features : {e}")
            return np.zeros((max_len, 54))

    async def analyze_audio_file(self, file_path: str):
        """Fonction principale appelée par l'API"""
        
        # Lazy loading (chargement si pas encore fait)
        if not self.model or not self.scaler:
            await self.initialize()
            if not self.model or not self.scaler:
                return self._get_error_result("Modèle ou Scaler manquant sur le serveur")

        try:
            loop = asyncio.get_event_loop()
            
            # 1. Extraction des features (dans un thread)
            features = await loop.run_in_executor(None, self.extract_features, file_path)
            
            # 2. Préparation des données (Scaling & Reshape)
            # features shape: (300, 54)
            if features.ndim == 2:
                # Le scaler attend du 2D (samples, features). Ici samples=time_steps
                features_flat = features.reshape(-1, features.shape[-1])
                # Application de la normalisation
                features_scaled = self.scaler.transform(features_flat)
                # Reshape pour le modèle LSTM: (Batch, Time, Features) -> (1, 300, 54)
                X = features_scaled.reshape(1, features.shape[0], features.shape[1])
            else:
                raise ValueError(f"Shape inattendue des features: {features.shape}")

            # 3. Prédiction
            predictions = await loop.run_in_executor(None, lambda: self.model.predict(X))
            probs = predictions[0] # Le tableau des probabilités
            
            # 4. Interprétation du résultat
            idx = np.argmax(probs)
            raw_emotion = EMOTION_LABELS[idx] if idx < len(EMOTION_LABELS) else "neutral"
            app_emotion = APP_MAPPING.get(raw_emotion, "calm")
            confidence = float(np.max(probs)) * 100

            # 5. Calcul des stats pour le frontend
            stats = self._calculate_stats(probs)
            
            # 6. Durée réelle
            duration = librosa.get_duration(filename=file_path) * 1000

            return {
                "dominant_emotion": app_emotion,
                "client_emotions": [
                    {"emotion": app_emotion, "confidence": confidence, "timestamp": 0},
                    {"emotion": app_emotion, "confidence": confidence, "timestamp": duration} 
                ],
                "agent_emotions": [], 
                "stats": stats,
                "duration": duration
            }

        except Exception as e:
            print(f"[AI] Erreur lors de l'analyse : {e}")
            import traceback
            traceback.print_exc()
            return self._get_error_result(str(e))

    def _calculate_stats(self, probs):
        """Calcule les pourcentages pour chaque émotion"""
        stats = {
            "average_confidence": float(np.max(probs)) * 100,
            "anger_percentage": 0, "joy_percentage": 0, "calm_percentage": 0,
            "sadness_percentage": 0, "anxiety_percentage": 0, "surprise_percentage": 0
        }
        
        for i, score in enumerate(probs):
            if i < len(EMOTION_LABELS):
                raw = EMOTION_LABELS[i]
                target = APP_MAPPING.get(raw)
                if target:
                    # On additionne car plusieurs émotions brutes peuvent mapper vers la même (ex: disgust -> anger)
                    key = f"{target}_percentage"
                    if key in stats:
                        stats[key] += round(float(score) * 100)
        return stats

    def _get_error_result(self, error_msg):
        return {
            "dominant_emotion": "calm",
            "client_emotions": [], "agent_emotions": [],
            "stats": {"average_confidence": 0},
            "error": error_msg, "duration": 0
        }
        
    async def analyze_realtime_chunk(self, audio_data):
        # Placeholder pour éviter les erreurs d'import si nécessaire
        pass

# Instance globale
emotion_service = EmotionAIService()