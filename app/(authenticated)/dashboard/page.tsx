"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { SupervisorDashboard } from "@/components/supervisor-dashboard"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user?.role === "agent") {
      router.push("/agent")
    }
  }, [user, router])

  if (user?.role === "agent") {
    return null
  }

  return <SupervisorDashboard />
}
