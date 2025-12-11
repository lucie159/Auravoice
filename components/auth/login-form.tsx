"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Eye, EyeOff, Shield, Headphones, ArrowLeft } from "lucide-react"

interface LoginFormProps {
  onSwitchToRegister: () => void
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [step, setStep] = useState<"role" | "form">("role")
  const [role, setRole] = useState<"agent" | "admin">("agent")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login } = useAuth()
  const router = useRouter()

  const handleRoleSelect = (selectedRole: "agent" | "admin") => {
    setRole(selectedRole)
    setStep("form")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    const result = await login(email, password)

    if (result.success) {
      router.push("/dashboard")
    } else {
      setError(result.error || "Erreur de connexion")
    }

    setIsSubmitting(false)
  }

  // Step 1: Role Selection
  if (step === "role") {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-foreground">Connexion</CardTitle>
          <CardDescription className="text-muted-foreground">Sélectionnez votre profil pour continuer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <button
              type="button"
              onClick={() => handleRoleSelect("agent")}
              className="group flex items-center gap-4 rounded-xl border-2 border-border bg-card p-5 text-left transition-all hover:border-primary hover:bg-secondary"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Headphones className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Agent</h3>
                <p className="text-sm text-muted-foreground">Accédez à vos appels et analyses</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect("admin")}
              className="group flex items-center gap-4 rounded-xl border-2 border-border bg-card p-5 text-left transition-all hover:border-primary hover:bg-secondary"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Shield className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Administrateur</h3>
                <p className="text-sm text-muted-foreground">Tableau de bord et supervision</p>
              </div>
            </button>
          </div>

          <div className="pt-2 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <button type="button" onClick={onSwitchToRegister} className="font-medium text-primary hover:underline">
              Créer un compte Agent
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Step 2: Login Form
  return (
    <Card className="w-full max-w-md border-0 shadow-xl">
      <CardHeader className="pb-2">
        <button
          type="button"
          onClick={() => setStep("role")}
          className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Changer de profil
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            {role === "admin" ? <Shield className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
          </div>
          <div>
            <CardTitle className="text-xl">Connexion {role === "admin" ? "Administrateur" : "Agent"}</CardTitle>
            <CardDescription>Entrez vos identifiants</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre.email@auravoice.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="bg-card"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="bg-card pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>

          {/* LOGIQUE CONDITIONNELLE ICI : On affiche l'inscription uniquement pour les AGENTS */}
          {role === "agent" ? (
            <div className="text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <button 
                type="button" 
                onClick={onSwitchToRegister} 
                className="font-medium text-primary hover:underline"
              >
                Créer un compte
              </button>
            </div>
          ) : (
            <div className="text-center text-xs text-muted-foreground mt-4 px-4">
              <span className="flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" />
                L'accès administrateur est restreint.
              </span>
              Contactez le support pour créer un compte admin.
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}