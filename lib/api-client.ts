import type { Agent, ActiveCall, CallReport, EmotionType, User } from "./types"

// On force l'URL de l'API (assure-toi que c'est la bonne)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// On garde le mock uniquement pour les parties ADMIN complexes (stats globales) si besoin
async function getMockModule() {
  return import("./mock-data")
}

function getAuthHeaders(isMultipart = false) {
  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") : null
  const headers: Record<string, string> = {}
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  
  if (!isMultipart) {
    headers["Content-Type"] = "application/json"
  }
  return headers
}

export const apiClient = {
  // ----------------------------------------------------
  // VRAIE AUTHENTIFICATION (Plus de mock ici)
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
        body: JSON.stringify({ email, password, name, role }), // Pas de team_id
      })

      const data = await res.json()
      if (!res.ok) return { error: data.detail || "Erreur" }
      return { user: data.user }
    } catch (e) {
      return { error: "Erreur serveur" }
    }
  },

  // ----------------------------------------------------
  // VRAIE ANALYSE AUDIO (Utilise ton modèle LSTM)
  // ----------------------------------------------------
 async analyzeAudio(file: File, agentId?: string): Promise<CallReport> {
    const formData = new FormData()
    formData.append("file", file) 
    if (agentId) formData.append("agentId", agentId)

    const res = await fetch(`${API_BASE_URL}/analyze/upload`, {
      method: "POST",
      body: formData,
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Erreur analyse: ${err}`)
    }

    const data = await res.json()
    
    // --- C'EST ICI QUE LA MAGIE OPÈRE ---
    // On traduit manuellement les champs Python vers JavaScript
    return {
        ...data,
        // Traduction de l'émotion dominante
        dominantEmotion: data.dominant_emotion, // snake_case -> camelCase
        
        // Traduction des statistiques
        stats: {
            angerPercentage: data.stats.anger_percentage,
            joyPercentage: data.stats.joy_percentage,
            calmPercentage: data.stats.calm_percentage,
            sadnessPercentage: data.stats.sadness_percentage,
            anxietyPercentage: data.stats.anxiety_percentage || 0,
            surprisePercentage: data.stats.surprise_percentage || 0,
            averageConfidence: data.stats.average_confidence
        },
        
        // Correction des tableaux d'émotions
        clientEmotions: data.client_emotions.map((e: any) => ({
            emotion: e.emotion,
            confidence: e.confidence,
            timestamp: e.timestamp
        })),
        agentEmotions: data.agent_emotions || [],
        
        // Correction de la durée (Python envoie ms ? on veut des secondes ?)
        // Si Python envoie 5000 (ms), on divise par 1000 pour avoir 5 secondes
        duration: data.duration > 1000 ? Math.round(data.duration / 1000) : data.duration
    }
  },

  async analyzeRecording(blob: Blob, agentId?: string): Promise<CallReport> {
    const file = new File([blob], "recording.wav", { type: "file/wav" })
    return this.analyzeAudio(file, agentId)
  },

  // ----------------------------------------------------
  // PARTIE ADMIN / DASHBOARD (Peut rester hybride ou Mock pour l'instant)
  // ----------------------------------------------------
  
  async getAgents(): Promise<Agent[]> {
    // Si tu veux tester le dashboard Admin avec des vraies données :
    try {
      const res = await fetch(`${API_BASE_URL}/api/agents`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        return Array.isArray(data) ? data : data.agents
      }
    } catch(e) {}
    
    // Fallback Mock si l'API n'est pas prête pour ça
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
     // Pour l'instant on laisse le mock pour la démo dashboard
     const { api } = await getMockModule()
     return api.getActiveCalls()
  },
  
  async getReportById(id: string): Promise<CallReport | null> {
      const res = await fetch(`${API_BASE_URL}/api/reports/${id}`, { headers: getAuthHeaders() })
      if(res.ok) return (await res.json()).report
      return null
  }
}