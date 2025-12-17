import os
import asyncio
import numpy as np
import librosa
import soundfile as sf
import noisereduce as nr
import warnings
import pickle
import base64
import tensorflow as tf

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

# 3. DONNÉES DU SCALER EN BASE64 (Pour éviter la corruption fichier)
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
        """
        Initialisation robuste : 
        1. Charge TensorFlow/Keras
        2. Charge le Scaler depuis le texte Base64 (Anti-Crash)
        """
        # 1. Chargement TensorFlow
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
            print("⚠️ Erreur modèle/TF:", e)
            self.tf_available = False

        # 2. Chargement Scaler (Mode "Blindé")
        try:
            print("[AI] Tentative de chargement du scaler...")
            if 'SCALER_DATA_B64' in globals() and len(SCALER_DATA_B64) > 100:
                binary_data = base64.b64decode(SCALER_DATA_B64)
                self.scaler = pickle.loads(binary_data)
                print("✅ Scaler chargé avec succès (via Base64)")
            else:
                print("⚠️ Pas de données Scaler valides.")
                self.scaler = None
        except Exception as e:
            print(f"⚠️ ATTENTION : Le scaler est corrompu ({e}). Mode dégradé.")
            self.scaler = None

    def _clean_audio(self, file_path):
        """Nettoie le bruit de l'audio"""
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
        """Extrait les caractéristiques audio (MFCC, Chroma, etc.)"""
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
        """Fonction principale d'analyse"""
        
        # Vérification de sécurité
        if not self.model or not self.scaler:
            print("⚠️ Analyse impossible : Modèle ou Scaler manquant.")
            return self._get_error_result("IA non initialisée correctement")

        clean_file_path = None
        try:
            loop = asyncio.get_event_loop()
            
            # 1. Nettoyage
            clean_file_path = await loop.run_in_executor(None, self._clean_audio, file_path)
            
            # 2. Extraction
            features = await loop.run_in_executor(None, self.extract_features, clean_file_path)

            # 3. Préparation & Scaling
            features_flat = features.reshape(-1, features.shape[-1])
            features_scaled = self.scaler.transform(features_flat)
            X = features_scaled.reshape(1, features.shape[0], features.shape[1])

            # 4. Prédiction
            predictions = await loop.run_in_executor(None, lambda: self.model.predict(X))
            probs = predictions[0]

            # 5. Interprétation
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
            # Nettoyage fichier temporaire
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
                    if key in stats:
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

# Instance globale
emotion_service = EmotionAIService()