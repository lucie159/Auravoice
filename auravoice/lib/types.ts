// Core emotion types based on specifications
export type EmotionType = "joy" | "anger" | "sadness" | "anxiety" | "calm" | "surprise"

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
  role: "agent" | "admin" // Changed supervisor to admin
  teamId: string
  avatar?: string
}

// Emotion color mapping
export const EMOTION_COLORS: Record<EmotionType, string> = {
  joy: "#2ECC71",
  calm: "#3498DB",
  surprise: "#F1C40F",
  anxiety: "#E67E22",
  anger: "#E74C3C",
  sadness: "#95A5A6",
}

export const EMOTION_LABELS: Record<EmotionType, { fr: string; en: string }> = {
  joy: { fr: "Joie / Satisfaction", en: "Joy / Satisfaction" },
  calm: { fr: "Calme / Neutre", en: "Calm / Neutral" },
  surprise: { fr: "Surprise", en: "Surprise" },
  anxiety: { fr: "Peur / Anxiété", en: "Fear / Anxiety" },
  anger: { fr: "Colère / Frustration", en: "Anger / Frustration" },
  sadness: { fr: "Tristesse", en: "Sadness" },
}

export const isNegativeEmotion = (emotion: EmotionType): boolean => {
  return emotion === "anger" || emotion === "anxiety"
}
