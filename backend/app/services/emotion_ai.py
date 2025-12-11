import os
import asyncio
import numpy as np
import librosa
import soundfile as sf
import noisereduce as nr
from transformers import pipeline

# 1. Configuration du Mapping
LABEL_MAPPING = {
    "neu": "calm",
    "hap": "joy",
    "ang": "anger",
    "sad": "sadness"
}

# Seuil de confiance minimum pour accepter une émotion "forte" (Colère/Joie/Tristesse)
# Si c'est en dessous, on considère que c'est "Calme"
CONFIDENCE_THRESHOLD = 0.25  # 25%

class EmotionAIService:
    def __init__(self):
        self.classifier = None
        self.model_name = "superb/wav2vec2-base-superb-er"

    async def initialize(self):
        """Charge le modèle Hugging Face"""
        print(f"[AI] Chargement du modèle {self.model_name}...")
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._load_model)
            print("[AI] Modèle chargé avec succès !")
        except Exception as e:
            print(f"[AI] ERREUR CRITIQUE: Impossible de charger le modèle : {e}")

    def _load_model(self):
        self.classifier = pipeline("audio-classification", model=self.model_name)

    def _map_emotion(self, label):
        return LABEL_MAPPING.get(label, "calm")

    def _clean_audio(self, file_path):
        """
        Nettoie le bruit de fond (souffle, statique) du fichier audio.
        Retourne le chemin du fichier nettoyé.
        """
        try:
            print(f"[AI] Nettoyage audio en cours : {file_path}")
            # 1. Charger l'audio avec librosa
            data, rate = librosa.load(file_path, sr=16000) # 16kHz est standard pour ce modèle

            # 2. Réduire le bruit (utilise les parties silencieuses pour modéliser le bruit)
            reduced_noise = nr.reduce_noise(y=data, sr=rate, prop_decrease=0.8) # 0.8 = réduction modérée pour ne pas déformer la voix

            # 3. Sauvegarder le fichier nettoyé temporairement
            clean_path = file_path.replace(".wav", "_clean.wav").replace(".mp3", "_clean.wav")
            sf.write(clean_path, reduced_noise, rate)
            
            return clean_path
        except Exception as e:
            print(f"[AI] Attention: Échec du nettoyage audio, utilisation du fichier original. Erreur: {e}")
            return file_path

    async def analyze_audio_file(self, file_path: str):
        if not self.classifier:
            await self.initialize()
            if not self.classifier:
                return self._get_error_result("Modèle IA non disponible")

        # Fichier temporaire nettoyé
        clean_file_path = None

        try:
            # 1. Nettoyage Audio (Pre-processing)
            loop = asyncio.get_event_loop()
            # On lance le nettoyage dans un thread pour ne pas bloquer
            clean_file_path = await loop.run_in_executor(None, self._clean_audio, file_path)

            # 2. Prédiction sur le fichier PROPRE
            predictions = await loop.run_in_executor(None, lambda: self.classifier(clean_file_path, top_k=None))
            
            # 3. Logique de Lissage / Filtrage (Post-processing)
            # On trie par score
            sorted_preds = sorted(predictions, key=lambda x: x['score'], reverse=True)
            top_prediction = sorted_preds[0]
            
            raw_label = top_prediction['label']
            raw_score = top_prediction['score']
            
            # --- LISSAGE : Application du seuil de confiance ---
            # Si le modèle détecte une émotion forte mais n'est pas très sûr, on tempère vers "Calm"
            mapped_label = self._map_emotion(raw_label)
            
            if mapped_label in ["anger", "joy", "sadness"] and raw_score < CONFIDENCE_THRESHOLD:
                print(f"[AI] Lissage: {mapped_label} ({raw_score:.2f}) ignoré -> Calm (Confiance trop basse)")
                dominant_label = "calm"
                # On baisse artificiellement la confiance affichée car on a "forcé" le calme
                confidence = 50.0 
            else:
                dominant_label = mapped_label
                confidence = raw_score * 100

            # 4. Préparer les statistiques
            stats = {
                "average_confidence": confidence,
                "anger_percentage": 0, "joy_percentage": 0, "calm_percentage": 0, "sadness_percentage": 0,
                "anxiety_percentage": 0, "surprise_percentage": 0
            }
            
            for p in predictions:
                label_mapped = self._map_emotion(p['label'])
                score_pct = round(p['score'] * 100)
                if label_mapped == "anger": stats["anger_percentage"] = score_pct
                elif label_mapped == "joy": stats["joy_percentage"] = score_pct
                elif label_mapped == "calm": stats["calm_percentage"] = score_pct
                elif label_mapped == "sadness": stats["sadness_percentage"] = score_pct

            # 5. Récupérer la durée réelle (utile pour le frontend)
            duration = librosa.get_duration(filename=clean_file_path) * 1000 # en ms

            return {
                "dominant_emotion": dominant_label,
                "client_emotions": [
                    {"emotion": dominant_label, "confidence": confidence, "timestamp": 0},
                    {"emotion": dominant_label, "confidence": confidence, "timestamp": duration} 
                ],
                "agent_emotions": [], 
                "stats": stats,
                "duration": duration
            }

        except Exception as e:
            print(f"[AI] Erreur lors de l'analyse : {e}")
            return self._get_error_result(str(e))
        
        finally:
            # Nettoyage du fichier _clean généré
            if clean_file_path and clean_file_path != file_path and os.path.exists(clean_file_path):
                try:
                    os.remove(clean_file_path)
                except:
                    pass

    def _get_error_result(self, error_msg):
        return {
            "dominant_emotion": "calm",
            "client_emotions": [], 
            "agent_emotions": [],
            "stats": {
                "average_confidence": 0, "anger_percentage": 0, "joy_percentage": 0, 
                "calm_percentage": 0, "sadness_percentage": 0, "anxiety_percentage": 0, "surprise_percentage": 0
            },
            "error": error_msg,
            "duration": 0
        }

emotion_service = EmotionAIService()