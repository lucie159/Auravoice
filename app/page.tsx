"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Waves, Activity, Shield, Zap, ArrowRight, BarChart3, LayoutDashboard } from "lucide-react"
import { useAuth, AuthProvider } from "@/lib/auth-context"

// On crée un composant interne pour utiliser le hook useAuth
function LandingContent() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-[#020817] text-white">
      {/* --- NAVBAR --- */}
      <header className="container mx-auto flex h-20 items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Waves className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">AuraVoice</span>
        </div>
        <nav className="flex gap-4">
          {user ? (
            // Si l'utilisateur est déjà connecté, on lui propose d'aller au Dashboard
            <Link href="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Mon Espace
              </Button>
            </Link>
          ) : (
            // Sinon, boutons Connexion / Inscription
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/10">
                  Connexion
                </Button>
              </Link>
              {/* Si tu n'as pas de page /register distincte, pointe aussi vers /login */}
              <Link href="/login"> 
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  S'inscrire
                </Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* --- HERO SECTION --- */}
      <main className="flex-1">
        <section className="container mx-auto flex flex-col items-center justify-center px-6 py-24 text-center lg:py-32">
          <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            Version 1.0 Disponible
          </div>
          
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-400 to-zinc-600">
            Le Copilote Émotionnel <br />
            pour vos Centres d'Appels
          </h1>
          
          <p className="mb-10 max-w-2xl text-lg text-zinc-400">
            Analysez les émotions de vos clients en temps réel grâce à l'IA. 
            Aidez vos agents à mieux réagir et améliorez la satisfaction client instantanément.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href={user ? "/dashboard" : "/login"}>
              <Button size="lg" className="h-12 px-8 text-base bg-white text-black hover:bg-zinc-200">
                {user ? "Accéder au Dashboard" : "Démarrer maintenant"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* --- FEATURES --- */}
        <section id="features" className="container mx-auto px-6 py-24 border-t border-white/5">
          <div className="grid gap-12 md:grid-cols-3">
            
            <div className="group rounded-2xl border border-white/5 bg-white/5 p-8 transition-colors hover:border-primary/20 hover:bg-white/10">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Analyse Vocale IA</h3>
              <p className="text-zinc-400">
                Détection automatique de la colère, de la joie et du calme à partir de fichiers audio.
              </p>
            </div>

            <div className="group rounded-2xl border border-white/5 bg-white/5 p-8 transition-colors hover:border-primary/20 hover:bg-white/10">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Rapide & Précis</h3>
              <p className="text-zinc-400">
                Obtenez un rapport détaillé en quelques secondes pour débriefer vos appels efficacement.
              </p>
            </div>

            <div className="group rounded-2xl border border-white/5 bg-white/5 p-8 transition-colors hover:border-primary/20 hover:bg-white/10">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Suivi Superviseur</h3>
              <p className="text-zinc-400">
                Accédez à l'historique des analyses pour coacher votre équipe avec des données objectives.
              </p>
            </div>

          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 py-8 text-center text-sm text-zinc-600">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <p>© 2025 AuraVoice.</p>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Sécurisé</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// On enveloppe le tout dans le AuthProvider pour savoir si le user est connecté
export default function LandingPage() {
  return (
    <AuthProvider>
      <LandingContent />
    </AuthProvider>
  )
}