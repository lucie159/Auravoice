import os
import asyncio
import numpy as np
import librosa
import tensorflow as tf
import joblib
import soundfile as sf
import noisereduce as nr
import warnings

# Pour éviter les warnings AVX2 qui polluent les logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# 1. LISTE DES ÉMOTIONS DU MODÈLE
EMOTION_LABELS = ["anger", "disgust", "fear", "happiness", "neutral", "sadness", "surprise"]

# 2. MAPPING VERS TON APPLICATION
APP_MAPPING = {
    "anger": "anger",
    "disgust": "anger",
    "fear": "anxiety",
    "happiness": "joy",
    "neutral": "calm",
    "sadness": "sadness",
    "surprise": "surprise"
}

# 3. SEUIL DE CONFIANCE
CONFIDENCE_THRESHOLD = 40.0 

class EmotionAIService:
    def __init__(self):
        self.model = None
        self.scaler = None
        
        # Chemins absolus
        base_path = os.path.dirname(__file__)
        self.model_path = os.path.join(base_path, "../models/speech_emotion_model.keras")
        self.scaler_path = os.path.join(base_path, "../models/scaler.pkl") 

    async def initialize(self):
        """Charge le modèle Keras et le Scaler au démarrage (Version Stable Synchrone)"""
        print("[AI] Démarrage de l'initialisation IA...")
        
        # On charge directement ici pour éviter l'erreur "Event loop is closed"
        self._load_components()
        
        if self.model and self.scaler:
            print("[AI] Système prêt.")
        else:
            print("[AI] ATTENTION : Le système a démarré sans modèle IA.")

    def _load_components(self):
        try:
            # 1. Charger le modèle
            if os.path.exists(self.model_path):
                self.model = tf.keras.models.load_model(self.model_path)
                print(f"[AI] Modèle chargé : {self.model_path}")
            else:
                print(f"[AI] ERREUR : Fichier modèle introuvable à {self.model_path}")

            # 2. Charger le scaler
            if os.path.exists(self.scaler_path):
                self.scaler = joblib.load(self.scaler_path)
                print(f"[AI] Scaler chargé : {self.scaler_path}")
            else:
                print(f"[AI] ERREUR : Fichier scaler introuvable à {self.scaler_path}")
        except Exception as e:
            print(f"[AI] Erreur interne pendant le chargement : {e}")

    def _clean_audio(self, file_path):
        """Nettoie le bruit de fond du fichier audio"""
        try:
            # Charger l'audio
            data, rate = librosa.load(file_path, sr=22050) 
            # Réduire le bruit
            reduced_noise = nr.reduce_noise(y=data, sr=rate, prop_decrease=0.8)
            # Sauvegarder
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
        # Lazy loading de secours
        if not self.model or not self.scaler:
            self._load_components()
            if not self.model or not self.scaler:
                return self._get_error_result("Modèle ou Scaler manquant")

        clean_file_path = None
        
        try:
            loop = asyncio.get_event_loop()
            
            # 1. Nettoyage
            clean_file_path = await loop.run_in_executor(None, self._clean_audio, file_path)

            # 2. Extraction
            features = await loop.run_in_executor(None, self.extract_features, clean_file_path)
            
            # 3. Scaling & Reshape
            if features.ndim == 2:
                features_flat = features.reshape(-1, features.shape[-1])
                features_scaled = self.scaler.transform(features_flat)
                X = features_scaled.reshape(1, features.shape[0], features.shape[1])
            else:
                raise ValueError(f"Shape inattendue: {features.shape}")

            # 4. Prédiction
            predictions = await loop.run_in_executor(None, lambda: self.model.predict(X))
            probs = predictions[0]
            
            # 5. Résultat
            idx = np.argmax(probs)
            raw_emotion_label = EMOTION_LABELS[idx] if idx < len(EMOTION_LABELS) else "neutral"
            app_emotion = APP_MAPPING.get(raw_emotion_label, "calm")
            
            raw_confidence = float(np.max(probs)) * 100

            # Lissage
            if app_emotion in ["anger", "joy", "sadness", "anxiety"] and raw_confidence < CONFIDENCE_THRESHOLD:
                app_emotion = "calm"
                confidence = 55.0 
            else:
                confidence = raw_confidence

            # Stats
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
            print(f"[AI] Erreur analyse : {e}")
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
        pass

emotion_service = EmotionAIService()