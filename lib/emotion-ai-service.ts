// lib/emotion-ai-service.ts

// On définit l'URL de ton backend Python
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:8000";

export interface AnalysisResult {
  dominant_emotion: string;
  clientEmotions: Array<{
    emotion: string;
    confidence: number;
    timestamp: number;
  }>;
  agentEmotions: any[];
  stats: {
    averageConfidence: number;
    angerPercentage: number;
    joyPercentage: number;
    calmPercentage: number;
    sadnessPercentage: number;
    // Ajoute d'autres stats si ton Python en renvoie plus
  };
  duration: number; // Durée estimée
}

export async function analyzeAudioFile(file: File, options: any): Promise<AnalysisResult> {
  try {
    const formData = new FormData();
    // ATTENTION : Ton backend Python attend un champ nommé "file"
    // async def analyze_audio_endpoint(file: UploadFile = File(...)):
    formData.append("file", file);

    console.log(`[Service] Envoi du fichier à ${PYTHON_API_URL}/api/analyze/upload`);

    const response = await fetch(`${PYTHON_API_URL}/api/analyze/upload`, {
      method: "POST",
      body: formData,
      // Ne pas mettre de Content-Type header manuellement, fetch le fait pour multipart/form-data
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur Python Backend (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Mapping : On s'assure que le format retourné par Python correspond à ce que le front attend
    // Ton Python renvoie des clés en snake_case (anger_percentage), le front aime le camelCase
    return {
      dominant_emotion: data.dominant_emotion,
      clientEmotions: data.client_emotions,
      agentEmotions: data.agent_emotions || [],
      stats: {
        averageConfidence: data.stats.average_confidence,
        angerPercentage: data.stats.anger_percentage,
        joyPercentage: data.stats.joy_percentage,
        calmPercentage: data.stats.calm_percentage,
        sadnessPercentage: data.stats.sadness_percentage,
      },
      duration: data.client_emotions.length > 0 ? data.client_emotions[data.client_emotions.length - 1].timestamp : 0
    };

  } catch (error) {
    console.error("[Service] Erreur de connexion au backend Python:", error);
    throw error;
  }
}