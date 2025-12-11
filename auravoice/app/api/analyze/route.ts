import { type NextRequest, NextResponse } from "next/server"
import { analyzeAudioFile } from "@/lib/emotion-ai-service"
import { db } from "@/lib/database-service"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const agentId = formData.get("agentId") as string
    const language = (formData.get("language") as "fr" | "en") || "fr"

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file required" }, { status: 400 })
    }

    console.log("[API] Analyzing audio file:", audioFile.name)

    // 1. Upload audio file to storage
    const audioUrl = await db.uploadAudioFile(audioFile, agentId)

    // 2. Analyze audio with AI model
    const analysis = await analyzeAudioFile(audioFile, {
      language,
      separateSpeakers: true,
    })

    // 3. Calculate statistics
    const emotionCounts = {
      joy: 0,
      anger: 0,
      sadness: 0,
      anxiety: 0,
      calm: 0,
      surprise: 0,
    }

    analysis.clientEmotions.forEach((e) => emotionCounts[e.emotion]++)
    const total = analysis.clientEmotions.length || 1

    const dominantEmotion = (Object.entries(emotionCounts) as any).sort((a: any, b: any) => b[1] - a[1])[0][0]

    // 4. Create call report in database
    const reportId = await db.createCallReport({
      agentId,
      agentName: "Agent", // TODO: Get from session
      date: new Date(),
      duration: analysis.duration,
      audioUrl,
      clientEmotions: analysis.clientEmotions,
      agentEmotions: analysis.agentEmotions,
      dominantEmotion,
      stats: {
        angerPercentage: Math.round((emotionCounts.anger / total) * 100),
        joyPercentage: Math.round((emotionCounts.joy / total) * 100),
        calmPercentage: Math.round((emotionCounts.calm / total) * 100),
        anxietyPercentage: Math.round((emotionCounts.anxiety / total) * 100),
        surprisePercentage: Math.round((emotionCounts.surprise / total) * 100),
        sadnessPercentage: Math.round((emotionCounts.sadness / total) * 100),
        averageConfidence: analysis.clientEmotions.reduce((sum, e) => sum + e.confidence, 0) / total,
      },
    })

    return NextResponse.json({ reportId, analysis })
  } catch (error) {
    console.error("[API] Analysis error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Analysis failed" }, { status: 500 })
  }
}
