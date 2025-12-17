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