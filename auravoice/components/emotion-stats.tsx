"use client"

import type { CallStats, EmotionType } from "@/lib/types"
import { EMOTION_COLORS, EMOTION_LABELS } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface EmotionStatsProps {
  stats: CallStats
  dominantEmotion: EmotionType
}

export function EmotionStats({ stats, dominantEmotion }: EmotionStatsProps) {
  const emotionData: { key: EmotionType; label: string; value: number }[] = [
    { key: "joy", label: EMOTION_LABELS.joy.fr, value: stats.joyPercentage },
    { key: "calm", label: EMOTION_LABELS.calm.fr, value: stats.calmPercentage },
    { key: "surprise", label: EMOTION_LABELS.surprise.fr, value: stats.surprisePercentage },
    { key: "anxiety", label: EMOTION_LABELS.anxiety.fr, value: stats.anxietyPercentage },
    { key: "anger", label: EMOTION_LABELS.anger.fr, value: stats.angerPercentage },
    { key: "sadness", label: EMOTION_LABELS.sadness.fr, value: stats.sadnessPercentage },
  ].sort((a, b) => b.value - a.value)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-card-foreground">Répartition des Émotions (Client)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {emotionData.map(({ key, label, value }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: EMOTION_COLORS[key] }} />
                <span className="text-muted-foreground">{label}</span>
                {key === dominantEmotion && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Dominant</span>
                )}
              </div>
              <span className="font-mono text-foreground">{value}%</span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${value}%`,
                  backgroundColor: EMOTION_COLORS[key],
                }}
              />
            </div>
          </div>
        ))}

        <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Confiance moyenne</span>
            <span className="font-mono text-lg text-foreground">{Math.round(stats.averageConfidence)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
