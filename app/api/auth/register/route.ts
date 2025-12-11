import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-service"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    // Validation
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 })
    }

    if (!["agent", "admin"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Format d'email invalide" }, { status: 400 })
    }

    const result = await db.registerUser(email, password, name, role)

    if (result.error === "EMAIL_EXISTS") {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 })
    }

    if (!result.user) {
      return NextResponse.json({ error: "Erreur lors de l'inscription" }, { status: 500 })
    }

    return NextResponse.json({ user: result.user }, { status: 201 })
  } catch (error) {
    console.error("[API] Register error:", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
