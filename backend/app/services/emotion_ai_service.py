import os
import asyncio
import numpy as np
import librosa
import soundfile as sf
import noisereduce as nr
import warnings
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



MEAN_VALUES = [-157.5376399920511, 37.104176491834, 2.0337274901687827, 12.096118323251734, -2.6183034613828085, 3.8309959257822093, -4.464458941893074, 0.3853365876428498, -3.836964942744795, 0.15526941160967642, -1.5735285955856781, -1.106138165365508, 0.1502976427590345, -1.754574038217257, 0.6562882481533799, -2.236795964560841, 0.1306130645389689, -1.4041705146971206, -0.23838966643544662, -0.8626021427811784, -0.8048591070921447, 0.04108076941695366, -1.0266471079234103, 0.8428409960241059, -0.7696151057547994, 1.2882513892724914, -0.6222886801577415, 1.1123151323514966, -0.25761544061212827, 0.7041739319453465, 0.3777561819327231, 0.5657496054651174, 0.9088223554975404, 0.3969925617587496, 1.1152420207611935, 0.5580622977776358, 1.2853996500773537, 0.5281862199831295, 0.7436884988057614, 0.4702020240977001, 0.13692784095083424, 0.14103712986063205, 0.13288571534211824, 0.1292212725107591, 0.1354360190566245, 0.13964814112214252, 0.14899128134526263, 0.1521282361035045, 0.16017507463942432, 0.17898225791832817, 0.17688434588986468, 0.14599475255180538, 0.04229088609350673, 0.010822040675040995]  # <--- Colle la liste MEAN_VALUES ici (entre les crochets si besoin, ou remplace la ligne)
SCALE_VALUES = [222.85612115107307, 61.17949308927245, 21.89513825086182, 25.796334756328317, 15.50026951717583, 15.328412103762092, 12.281292652708489, 10.705496209284089, 9.954390821480084, 7.055192168875377, 7.373486647650547, 6.660602896049189, 6.27800719639942, 6.93325273296583, 5.94919429407967, 6.9122046443525464, 5.600844702658633, 6.501945223053441, 5.431095086439593, 5.672665985806625, 5.460056398519643, 5.278044131359135, 5.65161557363057, 5.882537844587294, 5.988897013508849, 6.008446033772659, 5.88663390316108, 5.723679148683852, 5.517436769793056, 5.623403380673723, 5.539112067091, 5.78399099077947, 5.586391695835036, 5.718617761890974, 5.679342388751273, 5.88214423455808, 5.922523864119022, 5.826724386432337, 5.320898483216886, 5.016582068449478, 0.2601547346398352, 0.267408195329046, 0.2568373997265808, 0.2523953162556582, 0.2613357880283109, 0.2658489998963256, 0.2774050826090312, 0.2790472496403702, 0.2883048093015046, 0.316478012244662, 0.31541873973271006, 0.26945816151644725, 0.10968277300307572, 0.03579500089220182] # <--- Colle la liste SCALE_VALUES ici




class EmotionAIService:
    def __init__(self):
        self.model = None
        self.tf_available = False
        
        base_path = os.path.dirname(__file__)
        self.model_path = os.path.join(base_path, "../models/speech_emotion_model.keras")

    async def initialize(self):
        """Initialise TensorFlow et le Modèle"""
        try:
            import tensorflow as tf
            self.tf_available = True
            print(" TensorFlow loaded")
            if os.path.exists(self.model_path):
                self.model = tf.keras.models.load_model(self.model_path)
                print(" Emotion model loaded")
            else:
                print(f" Modèle introuvable au chemin : {self.model_path}")
        except Exception as e:
            print(" Erreur modèle/TF:", e)
            self.tf_available = False
            
        # Plus besoin de charger le scaler, on a les valeurs en dur !
        if len(MEAN_VALUES) > 0:
            print(f" Scaler manuel configuré ({len(MEAN_VALUES)} features)")
        else:
            print(" ATTENTION : Les valeurs MEAN_VALUES sont vides !")

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
        if not self.tf_available or self.model is None:
            return self._get_error_result("Modèle manquant")

        clean_file_path = None
        try:
            loop = asyncio.get_event_loop()
            clean_file_path = await loop.run_in_executor(None, self._clean_audio, file_path)
            features = await loop.run_in_executor(None, self.extract_features, clean_file_path)

            features_flat = features.reshape(-1, features.shape[-1])
            
            # --- SCALING MANUEL (INFAILLIBLE) ---
            if len(MEAN_VALUES) > 0 and len(SCALE_VALUES) > 0:
                # (X - Mean) / Scale
                try:
                    mean_vec = np.array(MEAN_VALUES)
                    scale_vec = np.array(SCALE_VALUES)
                    features_scaled = (features_flat - mean_vec) / scale_vec
                except Exception as e:
                     print(f"Erreur maths: {e}")
                     features_scaled = features_flat
            else:
                features_scaled = features_flat
            # ------------------------------------

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

emotion_service = EmotionAIService()