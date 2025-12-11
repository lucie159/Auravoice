import { type NextRequest, NextResponse } from "next/server"
import { analyzeAudioFile } from "@/lib/emotion-ai-service"
import { db } from "@/lib/database-service"
// IMPORTANT : Assure-toi que ce chemin correspond à ton fichier de types
import { EmotionType } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    // 1. Récupération des données du formulaire
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const agentId = formData.get("agentId") as string
    const language = (formData.get("language") as "fr" | "en") || "fr"

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file required" }, { status: 400 })
    }

    console.log("[API Next.js] Analyzing audio file:", audioFile.name)

    // 2. Upload du fichier audio vers le stockage (ex: dossier local ou S3)
    const audioUrl = await db.uploadAudioFile(audioFile, agentId)

    // 3. Analyse audio via le service IA (qui appelle ton backend Python)
    const analysis = await analyzeAudioFile(audioFile, {
      language,
      separateSpeakers: true,
    })

    // 4. Création du rapport en base de données
    const reportId = await db.createCallReport({
      agentId,
      agentName: "Agent", // TODO: À récupérer via la session auth réelle
      date: new Date(),
      duration: analysis.duration || 0,
      audioUrl,
      
      // --- CORRECTION TYPESCRIPT ---
      // On convertit les chaînes de caractères reçues du Python en EmotionType
      clientEmotions: analysis.clientEmotions.map((e) => ({
        ...e,
        emotion: e.emotion as EmotionType,
      })),

      agentEmotions: analysis.agentEmotions.map((e) => ({
        ...e,
        emotion: e.emotion as EmotionType,
      })),

      dominantEmotion: analysis.dominant_emotion as EmotionType,
      // -----------------------------

      // On utilise les stats calculées par le backend Python
      stats: {
        angerPercentage: analysis.stats.angerPercentage,
        joyPercentage: analysis.stats.joyPercentage,
        calmPercentage: analysis.stats.calmPercentage,
        anxietyPercentage: 0, // Ajuste si ton Python renvoie l'anxiété plus tard
        surprisePercentage: 0, // Ajuste si ton Python renvoie la surprise plus tard
        sadnessPercentage: analysis.stats.sadnessPercentage,
        averageConfidence: analysis.stats.averageConfidence,
      },
    })

    return NextResponse.json({ reportId, analysis })
    
  } catch (error) {
    console.error("[API] Analysis error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed" },
      { status: 500 }
    )
  }
}