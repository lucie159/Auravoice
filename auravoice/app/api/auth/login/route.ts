import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-service"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const user = await db.authenticateUser(email, password)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // In production, set httpOnly cookie with session token
    return NextResponse.json({ user })
  } catch (error) {
    console.error("[API] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
