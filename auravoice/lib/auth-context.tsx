"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { apiClient } from "./api-client"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (
    email: string,
    password: string,
    name: string,
    role: "agent" | "admin",
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored session
    const stored = localStorage.getItem("auravoice_user")
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem("auravoice_user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const user = await apiClient.login(email, password)
      if (user) {
        setUser(user)
        localStorage.setItem("auravoice_user", JSON.stringify(user))
        return { success: true }
      }
      return { success: false, error: "Email ou mot de passe incorrect" }
    } catch (error) {
      return { success: false, error: "Erreur de connexion au serveur" }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name: string, role: "agent" | "admin") => {
    setIsLoading(true)
    try {
      const result = await apiClient.register(email, password, name, role)
      if (result.user) {
        setUser(result.user)
        localStorage.setItem("auravoice_user", JSON.stringify(result.user))
        return { success: true }
      }
      return { success: false, error: result.error || "Erreur lors de l'inscription" }
    } catch (error) {
      return { success: false, error: "Erreur de connexion au serveur" }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("auravoice_user")
  }, [])

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
