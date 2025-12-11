"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CallReport } from "@/lib/types"
import { EMOTION_COLORS, EMOTION_LABELS, type EmotionType } from "@/lib/types"
import { Clock, User, TrendingUp, Activity } from "lucide-react"

interface CallReportViewProps {
  report: CallReport
}

export function CallReportView({ report }: CallReportViewProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins} min ${secs} sec`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const emotionStats = [
    { emotion: "joy" as EmotionType, value: report.stats.joyPercentage },
    { emotion: "calm" as EmotionType, value: report.stats.calmPercentage },
    { emotion: "anxiety" as EmotionType, value: report.stats.anxietyPercentage },
    { emotion: "anger" as EmotionType, value: report.stats.angerPercentage },
    { emotion: "sadness" as EmotionType, value: report.stats.sadnessPercentage },
    { emotion: "surprise" as EmotionType, value: report.stats.surprisePercentage },
  ].sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Agent</p>
              <p className="font-medium">{report.agentName}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duree</p>
              <p className="font-medium">{formatDuration(report.duration)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confiance moyenne</p>
              <p className="font-medium">{Math.round(report.stats.averageConfidence)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date */}
      <p className="text-sm text-muted-foreground text-center">{formatDate(report.date)}</p>

      {/* Dominant Emotion */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-primary" />
            Emotion dominante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-center justify-center gap-4 rounded-xl p-6"
            style={{ backgroundColor: `${EMOTION_COLORS[report.dominantEmotion]}15` }}
          >
            <div
              className="h-16 w-16 rounded-full"
              style={{ backgroundColor: EMOTION_COLORS[report.dominantEmotion] }}
            />
            <div>
              <p className="text-2xl font-bold" style={{ color: EMOTION_COLORS[report.dominantEmotion] }}>
                {EMOTION_LABELS[report.dominantEmotion].fr}
              </p>
              <p className="text-muted-foreground">{emotionStats[0].value}% du temps d'appel</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emotion Distribution */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Repartition des emotions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {emotionStats.map(({ emotion, value }) => (
            <div key={emotion} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: EMOTION_COLORS[emotion] }} />
                  <span>{EMOTION_LABELS[emotion].fr}</span>
                </div>
                <span className="font-medium">{value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${value}%`,
                    backgroundColor: EMOTION_COLORS[emotion],
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
