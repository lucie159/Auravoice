"use client"

import { cn } from "@/lib/utils"
import type { EmotionType } from "@/lib/types"
import { EMOTION_COLORS, EMOTION_LABELS, isNegativeEmotion } from "@/lib/types"

interface EmotionIndicatorProps {
  emotion: EmotionType
  size?: "sm" | "md" | "lg" | "xl"
  pulse?: boolean
  alert?: boolean
  showLabel?: boolean
  confidence?: number
  className?: string
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-6 w-6",
  lg: "h-12 w-12",
  xl: "h-20 w-20",
}

export function EmotionIndicator({
  emotion,
  size = "md",
  pulse = true,
  alert = false,
  showLabel = false,
  confidence,
  className,
}: EmotionIndicatorProps) {
  const color = EMOTION_COLORS[emotion]
  const isNegative = isNegativeEmotion(emotion)

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full transition-all duration-300",
          sizeClasses[size],
          pulse && "animate-pulse-emotion",
          alert && "animate-alert-blink",
        )}
        style={{
          backgroundColor: color,
          boxShadow: `0 0 ${size === "xl" ? "30px" : size === "lg" ? "20px" : "10px"} ${color}40`,
        }}
      />
      {showLabel && (
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color }}>
            {EMOTION_LABELS[emotion].fr}
          </p>
          {confidence !== undefined && (
            <p className="text-xs text-muted-foreground">{Math.round(confidence)}% confiance</p>
          )}
        </div>
      )}
    </div>
  )
}

export function EmotionLegend() {
  const emotions: EmotionType[] = ["joy", "calm", "surprise", "anxiety", "anger", "sadness"]

  return (
    <div className="flex flex-wrap gap-4">
      {emotions.map((emotion) => (
        <div key={emotion} className="flex items-center gap-2">
          <EmotionIndicator emotion={emotion} size="sm" pulse={false} />
          <span className="text-xs text-muted-foreground">{EMOTION_LABELS[emotion].fr}</span>
        </div>
      ))}
    </div>
  )
}
