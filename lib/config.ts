/**
 * AuraVoice Configuration
 *
 * Centralized configuration for all services.
 * Update these values to connect to your infrastructure.
 */

export const config = {
  // Application
  app: {
    name: "AuraVoice",
    version: "1.0.0",
    locale: "fr-FR",
  },

  // Feature flags
  features: {
    useMockData: process.env.NEXT_PUBLIC_USE_REAL_API !== "true",
    enableRealtime: true,
    enableVoiceRecording: true,
    debugMode: process.env.NODE_ENV === "development",
  },

  // Real-time updates
  realtime: {
    pollingInterval: 3000, // ms
    alertThresholdSeconds: 30, // seconds of negative emotion before alert
  },

  // Audio analysis
  audio: {
    supportedFormats: ["audio/wav", "audio/mp3", "audio/mpeg", "audio/webm"],
    maxFileSizeMB: 100,
    defaultLanguage: "fr" as const,
  },

  // API endpoints (for when using real backend)
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "",
    aiModelEndpoint: process.env.NEXT_PUBLIC_AI_MODEL_ENDPOINT || "/api/analyze",
  },

  // Emotions configuration
  emotions: {
    negative: ["anger", "anxiety"] as const,
    positive: ["joy", "calm"] as const,
    neutral: ["surprise", "sadness"] as const,
  },
}

// Type exports for configuration
export type SupportedLanguage = "fr" | "en"
export type AudioFormat = (typeof config.audio.supportedFormats)[number]
