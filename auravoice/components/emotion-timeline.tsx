"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import type { EmotionData, EmotionType } from "@/lib/types"
import { EMOTION_COLORS, EMOTION_LABELS } from "@/lib/types"
import { cn } from "@/lib/utils"

interface EmotionTimelineProps {
  clientEmotions: EmotionData[]
  agentEmotions: EmotionData[]
  duration: number // seconds
  audioUrl?: string
  onTimeClick?: (time: number) => void
  currentTime?: number
  className?: string
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function EmotionTimeline({
  clientEmotions,
  agentEmotions,
  duration,
  audioUrl,
  onTimeClick,
  currentTime = 0,
  className,
}: EmotionTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)
  const [hoveredEmotion, setHoveredEmotion] = useState<{ client: EmotionType | null; agent: EmotionType | null }>({
    client: null,
    agent: null,
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = container.clientWidth
    const height = 120

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.fillStyle = "rgba(0,0,0,0)"
    ctx.clearRect(0, 0, width, height)

    const waveHeight = 40
    const clientY = 35
    const agentY = 85
    const segmentWidth = width / Math.max(clientEmotions.length, 1)

    // Draw client wave (top)
    clientEmotions.forEach((emotion, i) => {
      const x = i * segmentWidth
      const color = EMOTION_COLORS[emotion.emotion]

      ctx.fillStyle = color
      ctx.globalAlpha = 0.8

      // Draw waveform-like shape
      const amplitude = (emotion.confidence / 100) * (waveHeight / 2)
      ctx.beginPath()
      ctx.moveTo(x, clientY)
      ctx.lineTo(x + segmentWidth, clientY)
      ctx.lineTo(x + segmentWidth, clientY - amplitude)
      ctx.bezierCurveTo(
        x + segmentWidth * 0.75,
        clientY - amplitude * 1.2,
        x + segmentWidth * 0.25,
        clientY - amplitude * 0.8,
        x,
        clientY - amplitude,
      )
      ctx.closePath()
      ctx.fill()
    })

    // Draw agent wave (bottom)
    agentEmotions.forEach((emotion, i) => {
      const x = i * segmentWidth
      const color = EMOTION_COLORS[emotion.emotion]

      ctx.fillStyle = color
      ctx.globalAlpha = 0.8

      const amplitude = (emotion.confidence / 100) * (waveHeight / 2)
      ctx.beginPath()
      ctx.moveTo(x, agentY)
      ctx.lineTo(x + segmentWidth, agentY)
      ctx.lineTo(x + segmentWidth, agentY + amplitude)
      ctx.bezierCurveTo(
        x + segmentWidth * 0.75,
        agentY + amplitude * 1.2,
        x + segmentWidth * 0.25,
        agentY + amplitude * 0.8,
        x,
        agentY + amplitude,
      )
      ctx.closePath()
      ctx.fill()
    })

    // Draw playhead
    if (currentTime > 0) {
      const playheadX = (currentTime / duration) * width
      ctx.globalAlpha = 1
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, height)
      ctx.stroke()
    }

    ctx.globalAlpha = 1
  }, [clientEmotions, agentEmotions, duration, currentTime])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = (x / rect.width) * duration
    setHoveredTime(time)

    // Find emotions at this time
    const index = Math.floor((x / rect.width) * clientEmotions.length)
    setHoveredEmotion({
      client: clientEmotions[index]?.emotion || null,
      agent: agentEmotions[index]?.emotion || null,
    })
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !onTimeClick) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = (x / rect.width) * duration
    onTimeClick(time)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Labels */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#3498DB]" />
          <span>Client</span>
        </div>
        {hoveredTime !== null && (
          <div className="rounded bg-muted px-2 py-1">
            <span className="font-mono">{formatTime(hoveredTime)}</span>
            {hoveredEmotion.client && (
              <span className="ml-2" style={{ color: EMOTION_COLORS[hoveredEmotion.client] }}>
                {EMOTION_LABELS[hoveredEmotion.client].fr}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="relative rounded-lg bg-muted/30 p-2">
        <canvas
          ref={canvasRef}
          className="cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setHoveredTime(null)
            setHoveredEmotion({ client: null, agent: null })
          }}
          onClick={handleClick}
        />
      </div>

      {/* Agent label */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#2ECC71]" />
          <span>Agent</span>
        </div>
        {hoveredTime !== null && hoveredEmotion.agent && (
          <span style={{ color: EMOTION_COLORS[hoveredEmotion.agent] }}>{EMOTION_LABELS[hoveredEmotion.agent].fr}</span>
        )}
      </div>

      {/* Time axis */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0:00</span>
        <span>{formatTime(duration / 4)}</span>
        <span>{formatTime(duration / 2)}</span>
        <span>{formatTime((duration * 3) / 4)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}
