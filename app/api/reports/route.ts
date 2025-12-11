import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      agentId: searchParams.get("agentId") || undefined,
      emotion: searchParams.get("emotion") as any,
      dateFrom: searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined,
      dateTo: searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined,
      limit: searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 50,
      offset: searchParams.get("offset") ? Number.parseInt(searchParams.get("offset")!) : 0,
    }

    const reports = await db.getCallReports(filters)

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("[API] Get reports error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const reportData = await request.json()

    const reportId = await db.createCallReport(reportData)

    return NextResponse.json({ reportId })
  } catch (error) {
    console.error("[API] Create report error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
