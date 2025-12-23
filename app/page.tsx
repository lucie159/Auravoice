"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Waves, Activity, Shield, Zap, ArrowRight, BarChart3, LayoutDashboard } from "lucide-react"
import { useAuth, AuthProvider } from "@/lib/auth-context"

function LandingContent() {
  const { user } = useAuth()

  return (
    // "bg-background" utilise la couleur de fond par défaut de ton site
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      
      {/* --- NAVBAR (Épurée) --- */}
      <header className="container mx-auto flex h-20 items-center px-6 py-4">
        <div className="flex items-center gap-2">
          {/* Logo avec ton dégradé bleu/violet */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <Waves className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">AuraVoice</span>
        </div>
        {/* Pas de boutons à droite, comme demandé */}
      </header>

      {/* --- HERO SECTION --- */}
      <main className="flex-1 flex flex-col justify-center">
        <section className="container mx-auto flex flex-col items-center justify-center px-6 py-12 text-center lg:py-20">
          
          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            Intelligence Artificielle Vocale
          </div>
          
          {/* Titre Impactant */}
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Le Copilote Émotionnel <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
              pour Centres d'Appels
            </span>
          </h1>
          
          <p className="mb-10 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Analysez la voix de vos clients, détectez les émotions en temps réel et améliorez la qualité de votre service grâce à la puissance de l'IA.
          </p>
          
          {/* LE BOUTON UNIQUE */}
          <div className="flex flex-col gap-4 w-full sm:w-auto">
            <Link href={user ? "/dashboard" : "/login"}>
              <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300">
                {user ? (
                  <>
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    Accéder à mon espace
                  </>
                ) : (
                  <>
                    Démarrer l'expérience
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </Link>
          </div>
        </section>

        {/* --- FEATURES (Cartes simples) --- */}
        <section className="container mx-auto px-6 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            
            <div className="group rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Détection IA</h3>
              <p className="text-muted-foreground">
                Reconnaissance automatique de la colère, joie, tristesse et calme.
              </p>
            </div>

            <div className="group rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Rapide</h3>
              <p className="text-muted-foreground">
                Traitement optimisé pour une analyse post-appel instantanée.
              </p>
            </div>

            <div className="group rounded-2xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Analytique</h3>
              <p className="text-muted-foreground">
                Statistiques détaillées pour améliorer la performance des agents.
              </p>
            </div>

          </div>
        </section>
      </main>

      {/* --- FOOTER DISCRET --- */}
      <footer className="py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-6 flex justify-center items-center gap-6">
          <p>© 2025 AuraVoice</p>
          <div className="h-4 w-px bg-border"></div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Sécurisé & Privé</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function LandingPage() {
  return (
    <AuthProvider>
      <LandingContent />
    </AuthProvider>
  )
}