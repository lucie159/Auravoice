import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-service"

export async function GET(request: NextRequest) {
  try {
    // TODO: Get teamId from authenticated session
    const teamId = "team-1"

    const activeCalls = await db.getActiveCalls(teamId)

    return NextResponse.json({ calls: activeCalls })
  } catch (error) {
    console.error("[API] Get active calls error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { agentId, callSid } = await request.json()

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 })
    }

    const call = await db.createActiveCall(agentId, callSid)

    return NextResponse.json({ call })
  } catch (error) {
    console.error("[API] Create active call error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
