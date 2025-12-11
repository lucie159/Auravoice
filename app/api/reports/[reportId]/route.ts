import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-service"

export async function GET(request: NextRequest, { params }: { params: { reportId: string } }) {
  try {
    const report = await db.getCallReportById(params.reportId)

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error("[API] Get report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { reportId: string } }) {
  try {
    await db.deleteCallReport(params.reportId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Delete report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
