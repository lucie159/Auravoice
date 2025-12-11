import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-service"

export async function PATCH(request: NextRequest, { params }: { params: { callId: string } }) {
  try {
    const { emotion, confidence, alertTriggered } = await request.json()

    await db.updateActiveCallEmotion(params.callId, emotion, confidence, alertTriggered)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Update call emotion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { callId: string } }) {
  try {
    await db.endActiveCall(params.callId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] End call error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
