"use client"

import { useState } from "react"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { Waves } from "lucide-react"

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Waves className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">AuraVoice</h1>
          <p className="text-sm text-muted-foreground">Copilote Emotionnel IA</p>
        </div>
      </div>

      {/* Auth Forms */}
      <div className="relative z-10 w-full max-w-md">
        {mode === "login" ? (
          <LoginForm onSwitchToRegister={() => setMode("register")} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setMode("login")} />
        )}
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-center text-xs text-muted-foreground">
        Analyse emotionnelle en temps reel pour centres d'appels
      </p>
    </div>
  )
}
