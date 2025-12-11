"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import type { CallReport, Agent, EmotionType } from "@/lib/types"
import { ReportFiltersComponent, type ReportFilters } from "@/components/report-filters"
import { ReportsTable } from "@/components/reports-table"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, TrendingUp, AlertTriangle, Clock } from "lucide-react"

export default function HistoryPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<CallReport[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [filters, setFilters] = useState<ReportFilters>({})
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [reportsData, agentsData] = await Promise.all([
        apiClient.getReports({
          agentId: filters.agentId,
          emotion: filters.emotion as EmotionType | undefined,
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
        }),
        apiClient.getAgents(),
      ])

      // Filter reports based on user role
      const filteredReports =
        user?.role === "agent"
          ? reportsData.filter((r) => r.agentId === user.id || r.agentName === user.name)
          : reportsData

      const searchFiltered = filters.search
        ? filteredReports.filter((r) => r.agentName.toLowerCase().includes(filters.search!.toLowerCase()))
        : filteredReports

      setReports(searchFiltered)
      setAgents(agentsData)
    } finally {
      setIsLoading(false)
    }
  }, [filters, user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalReports = reports.length
  const avgConfidence =
    reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + r.stats.averageConfidence, 0) / reports.length) : 0
  const alertCount = reports.filter((r) => r.stats.angerPercentage > 20 || r.stats.anxietyPercentage > 20).length
  const avgDuration =
    reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + r.duration, 0) / reports.length / 60) : 0

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Historique des Appels</h1>
          <p className="text-sm text-muted-foreground">
            {user?.role === "admin"
              ? "Consultez et analysez les rapports de votre equipe"
              : "Consultez vos rapports d'appels"}
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalReports}</p>
                <p className="text-xs text-muted-foreground">Rapports</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgConfidence}%</p>
                <p className="text-xs text-muted-foreground">Confiance moyenne</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{alertCount}</p>
                <p className="text-xs text-muted-foreground">Appels a risque</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{avgDuration} min</p>
                <p className="text-xs text-muted-foreground">Duree moyenne</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <ReportFiltersComponent
            agents={user?.role === "admin" ? agents : []}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        <ReportsTable reports={reports} isLoading={isLoading} />
      </div>
    </div>
  )
}
