import type { Agent, ActiveCall, CallReport, EmotionType, User } from "./types"

// 1. CONFIGURATION DE L'URL API
// En local : utilise http://localhost:8000
// En prod (Vercel) : utilisera la variable d'environnement (l'URL Render)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Import dynamique des mocks pour éviter de charger du code inutile
async function getMockModule() {
  return import("./mock-data")
}

function getAuthHeaders(isMultipart = false) {
  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") : null
  const headers: Record<string, string> = {}
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  
  // Pour l'upload de fichiers (multipart), on laisse le navigateur gérer le Content-Type
  if (!isMultipart) {
    headers["Content-Type"] = "application/json"
  }
  return headers
}

export const apiClient = {
  // ----------------------------------------------------
  // AUTHENTIFICATION
  // ----------------------------------------------------
  async login(email: string, password: string): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) return null
      const data = await res.json()
      
      if (data.access_token) {
        localStorage.setItem("auth_token", data.access_token)
      }
      return data.user
    } catch (e) {
      console.error("Login error:", e)
      return null
    }
  },

  async register(email: string, password: string, name: string, role: "agent" | "admin"): Promise<{ user?: User; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      })

      const data = await res.json()
      if (!res.ok) return { error: data.detail || "Erreur" }
      return { user: data.user }
    } catch (e) {
      return { error: "Erreur serveur" }
    }
  },

  // ----------------------------------------------------
  // ANALYSE AUDIO (Le cœur du sujet)
  // ----------------------------------------------------
  async analyzeAudio(file: File, agentId?: string): Promise<CallReport> {
    const formData = new FormData()
    formData.append("file", file) // IMPORTANT : La clé doit être "file" pour FastAPI
    if (agentId) formData.append("agentId", agentId)

    // Note : On utilise /api/analyze/upload pour être cohérent avec /api/auth
    // Si tu as une erreur 404, vérifie si ton backend attend /analyze/upload sans /api
    const res = await fetch(`${API_BASE_URL}/api/analyze/upload`, {
      method: "POST",
      body: formData,
      // Pas de headers ici, fetch gère le multipart automatiquement
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Erreur analyse: ${err}`)
    }

    const data = await res.json()
    
    // --- TRADUCTION PYTHON -> JAVASCRIPT ---
    return {
        ...data,
        // Mapping snake_case (Python) -> camelCase (JS)
        dominantEmotion: data.dominant_emotion,
        
        stats: {
            angerPercentage: data.stats.anger_percentage,
            joyPercentage: data.stats.joy_percentage,
            calmPercentage: data.stats.calm_percentage,
            sadnessPercentage: data.stats.sadness_percentage,
            anxietyPercentage: data.stats.anxiety_percentage || 0,
            surprisePercentage: data.stats.surprise_percentage || 0,
            averageConfidence: data.stats.average_confidence
        },
        
        // Mapping des tableaux
        clientEmotions: data.client_emotions.map((e: any) => ({
            emotion: e.emotion,
            confidence: e.confidence,
            timestamp: e.timestamp
        })),
        agentEmotions: data.agent_emotions || [],
        
        // Correction durée (si Python renvoie des ms, on convertit en secondes)
        duration: data.duration > 1000 ? Math.round(data.duration / 1000) : data.duration
    }
  },

  async analyzeRecording(blob: Blob, agentId?: string): Promise<CallReport> {
    // On convertit le Blob du micro en File
    const file = new File([blob], "recording.wav", { type: "audio/wav" })
    return this.analyzeAudio(file, agentId)
  },

  // ----------------------------------------------------
  // DASHBOARD & ADMIN (Mode Hybride : API si dispo, sinon Mock)
  // ----------------------------------------------------
  
  async getAgents(): Promise<Agent[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/agents`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        return Array.isArray(data) ? data : data.agents
      }
    } catch(e) {}
    
    // Fallback Mock
    const { api } = await getMockModule()
    return api.getAgents()
  },

  async getReports(filters?: any): Promise<CallReport[]> {
    try {
        const params = new URLSearchParams()
        if (filters?.agentId) params.append("agentId", filters.agentId)
        
        const res = await fetch(`${API_BASE_URL}/api/reports?${params}`, { headers: getAuthHeaders() })
        if(res.ok) return (await res.json()).reports || []
    } catch(e) {}

    const { api } = await getMockModule()
    return api.getReports(filters)
  },

  async getActiveCalls(): Promise<ActiveCall[]> {
     // Mock pour le temps réel pour l'instant
     const { api } = await getMockModule()
     return api.getActiveCalls()
  },
  
  async getReportById(id: string): Promise<CallReport | null> {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports/${id}`, { headers: getAuthHeaders() })
        if(res.ok) return (await res.json())
      } catch(e) {}
      return null
  }
}