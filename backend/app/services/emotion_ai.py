import os
import asyncio
import numpy as np
import librosa
import tensorflow as tf
import joblib
import soundfile as sf
import noisereduce as nr
import warnings

# 1. LISTE DES ÉMOTIONS DU MODÈLE (Ordre de l'entraînement TensorFlow)
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

# 3. SEUIL DE CONFIANCE (Lissage)
# Si une émotion forte est détectée avec moins de 40% de certitude, on la ramène à "Calm"
CONFIDENCE_THRESHOLD = 40.0 

class EmotionAIService:
    def __init__(self):
        self.model = None
        self.scaler = None
        
        # Chemins absolus vers les fichiers modèles
        base_path = os.path.dirname(__file__)
        self.model_path = os.path.join(base_path, "../models/speech_emotion_model.keras")
        self.scaler_path = os.path.join(base_path, "../models/scaler.pkl") 

    async def initialize(self):
        """Charge le modèle Keras et le Scaler au démarrage"""
        print("[AI] Initialisation des composants IA (TensorFlow)...")
        try:
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

        # 2. Charger le scaler
        if os.path.exists(self.scaler_path):
            self.scaler = joblib.load(self.scaler_path)
            print(f"[AI] Scaler chargé avec succès : {self.scaler_path}")
        else:
            print(f"[AI] ERREUR : Fichier scaler introuvable à {self.scaler_path}")

    def _clean_audio(self, file_path):
        """Nettoie le bruit de fond du fichier audio"""
        try:
            # print(f"[AI] Nettoyage audio en cours : {file_path}")
            # Charger l'audio
            data, rate = librosa.load(file_path, sr=22050) # 22050 est standard pour librosa/ton modèle

            # Réduire le bruit
            # prop_decrease=0.8 signifie qu'on enlève 80% du bruit estimé (pour ne pas rendre la voix robotique)
            reduced_noise = nr.reduce_noise(y=data, sr=rate, prop_decrease=0.8)

            # Sauvegarder le fichier nettoyé
            clean_path = file_path.replace(".wav", "_clean.wav").replace(".mp3", "_clean.wav")
            sf.write(clean_path, reduced_noise, rate)
            
            return clean_path
        except Exception as e:
            print(f"[AI] Attention: Échec du nettoyage, utilisation de l'original. Erreur: {e}")
            return file_path

    def extract_features(self, file_path, sr=22050, n_mfcc=40, max_len=300):
        """Extraction des features (MFCC, Chroma, etc.)"""
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
            print(f"[AI] Erreur extraction features : {e}")
            return np.zeros((max_len, 54))

    async def analyze_audio_file(self, file_path: str):
        if not self.model or not self.scaler:
            await self.initialize()
            if not self.model or not self.scaler:
                return self._get_error_result("Modèle ou Scaler manquant sur le serveur")

        clean_file_path = None
        
        try:
            loop = asyncio.get_event_loop()
            
            # 1. Nettoyage Audio (NOUVEAU)
            clean_file_path = await loop.run_in_executor(None, self._clean_audio, file_path)

            # 2. Extraction des features sur le fichier PROPRE
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
            
            # 5. Logique de Lissage (NOUVEAU)
            idx = np.argmax(probs)
            raw_confidence = float(np.max(probs)) * 100
            
            raw_emotion_label = EMOTION_LABELS[idx] if idx < len(EMOTION_LABELS) else "neutral"
            app_emotion = APP_MAPPING.get(raw_emotion_label, "calm")

            # Appliquer le seuil : Si c'est une émotion forte mais peu sûre -> Calme
            if app_emotion in ["anger", "joy", "sadness", "anxiety"] and raw_confidence < CONFIDENCE_THRESHOLD:
                # print(f"[AI] Lissage: {app_emotion} ({raw_confidence:.1f}%) -> Ignoré (Confiance trop basse)")
                app_emotion = "calm"
                # On ajuste la confiance pour refléter l'incertitude
                confidence = 55.0 
            else:
                confidence = raw_confidence

            # 6. Stats et Durée
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
            print(f"[AI] Erreur lors de l'analyse : {e}")
            import traceback
            traceback.print_exc()
            return self._get_error_result(str(e))
        
        finally:
            # Nettoyage fichier temporaire
            if clean_file_path and clean_file_path != file_path and os.path.exists(clean_file_path):
                try:
                    os.remove(clean_file_path)
                except:
                    pass

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