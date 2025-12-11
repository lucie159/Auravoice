import os
import asyncio
# On n'utilise plus tensorflow !
# import tensorflow as tf 
from transformers import pipeline

# 1. Configuration du Mapping
LABEL_MAPPING = {
    "neu": "calm",
    "hap": "joy",
    "ang": "anger",
    "sad": "sadness"
}

class EmotionAIService:
    def __init__(self):
        self.classifier = None
        self.model_name = "superb/wav2vec2-base-superb-er"

    async def initialize(self):
        """Charge le modèle Hugging Face au démarrage de l'API"""
        print(f"[AI] Chargement du modèle {self.model_name}...")
        try:
            # Exécution dans un thread séparé pour ne pas bloquer le démarrage asynchrone
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._load_model)
            print("[AI] Modèle chargé avec succès !")
        except Exception as e:
            print(f"[AI] ERREUR CRITIQUE: Impossible de charger le modèle : {e}")

    def _load_model(self):
        """Fonction synchrone pour charger le pipeline"""
        self.classifier = pipeline("audio-classification", model=self.model_name)

    def _map_emotion(self, label):
        """Traduit 'neu' en 'calm', etc."""
        return LABEL_MAPPING.get(label, "calm")

    async def analyze_audio_file(self, file_path: str):
        """
        Reçoit le chemin d'un fichier audio, l'analyse et retourne le JSON formaté.
        """
        if not self.classifier:
            print("[AI] Le modèle n'était pas chargé, tentative de rechargement...")
            await self.initialize()
            if not self.classifier:
                return self._get_error_result("Modèle IA non disponible")

        try:
            # Exécuter la prédiction (opération lourde) dans un thread séparé
            loop = asyncio.get_event_loop()
            predictions = await loop.run_in_executor(None, lambda: self.classifier(file_path, top_k=None))
            
            # 2. Trouver l'émotion dominante
            sorted_preds = sorted(predictions, key=lambda x: x['score'], reverse=True)
            top_prediction = sorted_preds[0]
            
            dominant_label_raw = top_prediction['label']
            dominant_label = self._map_emotion(dominant_label_raw)
            confidence = top_prediction['score'] * 100

            # 3. Préparer les statistiques
            stats = {
                "average_confidence": confidence,
                "anger_percentage": 0,
                "joy_percentage": 0,
                "calm_percentage": 0,
                "sadness_percentage": 0,
                "anxiety_percentage": 0,
                "surprise_percentage": 0
            }
            
            for p in predictions:
                label_mapped = self._map_emotion(p['label'])
                score_pct = round(p['score'] * 100)

                if label_mapped == "anger": stats["anger_percentage"] = score_pct
                elif label_mapped == "joy": stats["joy_percentage"] = score_pct
                elif label_mapped == "calm": stats["calm_percentage"] = score_pct
                elif label_mapped == "sadness": stats["sadness_percentage"] = score_pct

            # 4. Construire la réponse
            return {
                "dominant_emotion": dominant_label,
                "client_emotions": [
                    {"emotion": dominant_label, "confidence": confidence, "timestamp": 0},
                    {"emotion": dominant_label, "confidence": confidence, "timestamp": 5000} 
                ],
                "agent_emotions": [], 
                "stats": stats,
                "duration": 5000
            }

        except Exception as e:
            print(f"[AI] Erreur lors de l'analyse : {e}")
            return self._get_error_result(str(e))

    def _get_error_result(self, error_msg):
        return {
            "dominant_emotion": "calm",
            "client_emotions": [], 
            "agent_emotions": [],
            "stats": {
                "average_confidence": 0,
                "anger_percentage": 0,
                "joy_percentage": 0,
                "calm_percentage": 0,
                "sadness_percentage": 0,
                "anxiety_percentage": 0,
                "surprise_percentage": 0
            },
            "error": error_msg
        }

    # Méthode placeholder pour le temps réel (à implémenter plus tard avec WebSocket)
    async def analyze_realtime_chunk(self, audio_data):
        # Pour l'instant, on renvoie une donnée factice pour ne pas bloquer
        return type('obj', (object,), {
            "emotion": "calm", 
            "confidence": 0.0, 
            "timestamp": 0.0,
            "model_dump": lambda: {"emotion": "calm", "confidence": 0}
        })

# Création de l'instance unique
emotion_service = EmotionAIService()