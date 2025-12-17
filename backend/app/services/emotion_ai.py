import os
import asyncio
import numpy as np
import librosa
import joblib
import soundfile as sf
import noisereduce as nr
import warnings
import pickle  # pour le scaler si pickle utilisé

# 1. LISTE DES ÉMOTIONS
EMOTION_LABELS = ["anger", "disgust", "fear", "happiness", "neutral", "sadness", "surprise"]

# 2. MAPPING
APP_MAPPING = {
    "anger": "anger",
    "disgust": "anger",
    "fear": "anxiety",
    "happiness": "joy",
    "neutral": "calm",
    "sadness": "sadness",
    "surprise": "surprise"
}

CONFIDENCE_THRESHOLD = 40.0

class EmotionAIService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.tf = None
        self.tf_available = False

        base_path = os.path.dirname(__file__)
        self.model_path = os.path.join(base_path, "../models/speech_emotion_model.keras")
        self.scaler_path = os.path.join(base_path, "../models/scaler.pkl")

    async def initialize(self):
        """
        Initialisation safe : TF est chargé uniquement si possible.
        En local Windows, backend démarre même si TF est absent.
        """
        try:
            import tensorflow as tf
            self.tf = tf
            self.tf_available = True
            print("✅ TensorFlow loaded")
        except Exception as e:
            print("⚠️ TensorFlow not available, backend continues:", e)
            self.tf = None
            self.tf_available = False

        # Charger le scaler
        if os.path.exists(self.scaler_path):
            with open(self.scaler_path, "rb") as f:
                self.scaler = pickle.load(f)
            print("✅ Scaler loaded")
        else:
            print(f"[AI] Scaler introuvable : {self.scaler_path}")
            self.scaler = None

    def _load_model_sync(self):
        """Charge le modèle TF uniquement si disponible"""
        if not self.tf_available:
            print("[AI] TF non disponible, modèle ignoré")
            return
        if os.path.exists(self.model_path):
            self.model = self.tf.keras.models.load_model(self.model_path)
            print("[AI] Modèle TF chargé")
        else:
            print(f"[AI] Modèle introuvable : {self.model_path}")
            self.model = None

    def _clean_audio(self, file_path):
        try:
            data, rate = librosa.load(file_path, sr=22050)
            reduced_noise = nr.reduce_noise(y=data, sr=rate, prop_decrease=0.8)
            clean_path = file_path.replace(".wav", "_clean.wav").replace(".mp3", "_clean.wav")
            sf.write(clean_path, reduced_noise, rate)
            return clean_path
        except Exception as e:
            print(f"[AI] Warning nettoyage: {e}")
            return file_path

    def extract_features(self, file_path, sr=22050, n_mfcc=40, max_len=300):
        try:
            y, _ = librosa.load(file_path, sr=sr)
            if y is None or len(y) < 2048:
                return np.zeros((max_len, 54))
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc).T
                chroma = librosa.feature.chroma_stft(y=y, sr=sr).T
                zcr = librosa.feature.zero_crossing_rate(y).T
                rms = librosa.feature.rms(y=y).T
            min_l = min(len(mfccs), len(chroma), len(zcr), len(rms))
            combined = np.hstack([mfccs[:min_l], chroma[:min_l], zcr[:min_l], rms[:min_l]])
            if combined.shape[0] < max_len:
                pad_width = max_len - combined.shape[0]
                combined = np.pad(combined, ((0, pad_width), (0, 0)), mode='constant')
            else:
                combined = combined[:max_len]
            return combined
        except Exception as e:
            print(f"[AI] Erreur extraction: {e}")
            return np.zeros((max_len, 54))

    async def analyze_audio_file(self, file_path: str):
        # Lazy loading
        if not self.scaler:
            await self.initialize()
        if not self.model:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._load_model_sync)
        if not self.model or not self.scaler:
            return self._get_error_result("Modèle ou scaler indisponible")

        clean_file_path = None
        try:
            loop = asyncio.get_event_loop()
            clean_file_path = await loop.run_in_executor(None, self._clean_audio, file_path)
            features = await loop.run_in_executor(None, self.extract_features, clean_file_path)

            features_flat = features.reshape(-1, features.shape[-1])
            features_scaled = self.scaler.transform(features_flat)
            X = features_scaled.reshape(1, features.shape[0], features.shape[1])

            predictions = await loop.run_in_executor(None, lambda: self.model.predict(X))
            probs = predictions[0]

            idx = np.argmax(probs)
            raw_emotion_label = EMOTION_LABELS[idx] if idx < len(EMOTION_LABELS) else "neutral"
            app_emotion = APP_MAPPING.get(raw_emotion_label, "calm")
            raw_confidence = float(np.max(probs)) * 100
            confidence = raw_confidence if raw_confidence >= CONFIDENCE_THRESHOLD else 55.0

            stats = self._calculate_stats(probs)
            duration = librosa.get_duration(filename=clean_file_path) * 1000

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
            import traceback
            traceback.print_exc()
            return self._get_error_result(str(e))
        finally:
            if clean_file_path and clean_file_path != file_path and os.path.exists(clean_file_path):
                try: os.remove(clean_file_path)
                except: pass

    def _calculate_stats(self, probs):
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
                    key = f"{target}_percentage"
                    stats[key] += round(float(score) * 100)
        return stats

    def _get_error_result(self, error_msg):
        return {
            "dominant_emotion": "calm",
            "client_emotions": [], "agent_emotions": [],
            "stats": {"average_confidence": 0},
            "error": error_msg,
            "duration": 0
        }

    async def analyze_realtime_chunk(self, audio_data):
        pass

# Instance globale
emotion_service = EmotionAIService()
