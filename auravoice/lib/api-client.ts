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
    formData.append("audio", file) // Backend attend "audio", pas "file" (voir api/analyze/route.ts)
    if (agentId) formData.append("agentId", agentId)

    const res = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      headers: getAuthHeaders(true), // true pour dire "laisse le navigateur gérer le multipart"
      body: formData,
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Erreur analyse: ${err}`)
    }

    const responseData = await res.json()
    
    // Si le backend renvoie { reportId, analysis }, on retourne l'objet fusionné
    // ou on refetch le rapport complet
    if (responseData.reportId) {
        return this.getReportById(responseData.reportId) as Promise<CallReport>
    }
    
    return responseData
  },

  async analyzeRecording(blob: Blob, agentId?: string): Promise<CallReport> {
    const file = new File([blob], "recording.wav", { type: "audio/wav" })
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