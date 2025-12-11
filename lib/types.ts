// Core emotion types based on specifications
export type EmotionType = "joy" | "anger" | "sadness" | "anxiety" | "calm" | "surprise"

export const EMOTION_COLORS = {
  joy: "#22c55e",      // vert
  anger: "#ef4444",    // rouge
  sadness: "#3b82f6",  // bleu
  anxiety: "#f97316",  // orange
  surprise: "#eab308", // jaune
  calm: "#14b8a6",     // <-- AJOUTE CETTE LIGNE (Teal/Cyan pour le calme)
}

export const EMOTION_LABELS = {
  joy: { fr: "Joie", en: "Joy" },
  anger: { fr: "Colère", en: "Anger" },
  sadness: { fr: "Tristesse", en: "Sadness" },
  anxiety: { fr: "Anxiété", en: "Anxiety" },
  surprise: { fr: "Surprise", en: "Surprise" },
  calm: { fr: "Calme", en: "Calm" }, // <-- AJOUTE CETTE LIGNE
}


export interface EmotionData {
  emotion: EmotionType
  confidence: number // 0-100
  timestamp: number
}

export interface Agent {
  id: string
  name: string
  email: string
  avatar?: string
  role: "agent" | "supervisor"
  teamId: string
  status: "online" | "offline" | "on-call" | "break"
}

export interface ActiveCall {
  id: string
  agentId: string
  startTime: Date
  currentEmotion: EmotionData
  emotionHistory: EmotionData[]
  alertTriggered: boolean
  alertDuration: number // seconds of negative emotion
}

export interface CallReport {
  id: string
  agentId: string
  agentName: string
  date: Date
  duration: number // seconds
  audioUrl?: string
  clientEmotions: EmotionData[]
  agentEmotions: EmotionData[]
  dominantEmotion: EmotionType
  stats: CallStats
}

export interface CallStats {
  angerPercentage: number
  joyPercentage: number
  calmPercentage: number
  anxietyPercentage: number
  surprisePercentage: number
  sadnessPercentage: number
  averageConfidence: number
}

export interface User {
  id: string
  email: string
  name: string
  role: "agent" | "supervisor" // Changed supervisor to admin
  teamId: string
  avatar?: string
}


export const isNegativeEmotion = (emotion: EmotionType): boolean => {
  return emotion === "anger" || emotion === "anxiety"
}
