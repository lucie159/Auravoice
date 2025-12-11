"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CallReportView } from "./call-report-view"
import type { CallReport } from "@/lib/types"
import { EMOTION_COLORS, EMOTION_LABELS } from "@/lib/types"
import { Clock, Eye, Loader2 } from "lucide-react"

interface ReportsTableProps {
  reports: CallReport[]
  isLoading: boolean
}

export function ReportsTable({ reports, isLoading }: ReportsTableProps) {
  const [selectedReport, setSelectedReport] = useState<CallReport | null>(null)

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (reports.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p>Aucun rapport trouve</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Duree</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Emotion dominante
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Confiance</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{report.agentName}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(report.date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDuration(report.duration)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: EMOTION_COLORS[report.dominantEmotion],
                        backgroundColor: `${EMOTION_COLORS[report.dominantEmotion]}15`,
                        color: EMOTION_COLORS[report.dominantEmotion],
                      }}
                    >
                      {EMOTION_LABELS[report.dominantEmotion].fr}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium">{Math.round(report.stats.averageConfidence)}%</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedReport(report)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail du rapport</DialogTitle>
          </DialogHeader>
          {selectedReport && <CallReportView report={selectedReport} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
