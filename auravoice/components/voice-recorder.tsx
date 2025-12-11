"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2, Play, RotateCcw } from "lucide-react"

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  isProcessing: boolean
}

export function VoiceRecorder({ onRecordingComplete, isProcessing }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/wav" })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Microphone access denied")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const resetRecording = () => {
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setRecordingTime(0)
  }

  const handleSubmit = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-6">
          {/* Recording indicator */}
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full transition-all ${
              isRecording ? "bg-red-100 animate-recording-pulse" : audioBlob ? "bg-primary/10" : "bg-secondary"
            }`}
          >
            {isRecording ? (
              <Mic className="h-12 w-12 text-red-500" />
            ) : audioBlob ? (
              <Play className="h-12 w-12 text-primary" />
            ) : (
              <Mic className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          {/* Timer / Status */}
          <div className="text-center">
            {isRecording ? (
              <>
                <p className="text-3xl font-mono font-bold text-red-500">{formatTime(recordingTime)}</p>
                <p className="text-sm text-muted-foreground">Enregistrement en cours...</p>
              </>
            ) : audioBlob ? (
              <>
                <p className="text-3xl font-mono font-bold text-foreground">{formatTime(recordingTime)}</p>
                <p className="text-sm text-muted-foreground">Enregistrement termine</p>
              </>
            ) : (
              <p className="text-muted-foreground">Cliquez pour commencer l'enregistrement</p>
            )}
          </div>

          {/* Audio Player */}
          {audioUrl && <audio controls src={audioUrl} className="w-full max-w-sm" />}

          {/* Controls */}
          <div className="flex gap-3">
            {!isRecording && !audioBlob && (
              <Button onClick={startRecording} className="gap-2" size="lg">
                <Mic className="h-5 w-5" />
                Enregistrer
              </Button>
            )}

            {isRecording && (
              <Button onClick={stopRecording} variant="destructive" className="gap-2" size="lg">
                <Square className="h-5 w-5" />
                Arreter
              </Button>
            )}

            {audioBlob && !isProcessing && (
              <>
                <Button onClick={resetRecording} variant="outline" className="gap-2 bg-transparent">
                  <RotateCcw className="h-4 w-4" />
                  Recommencer
                </Button>
                <Button onClick={handleSubmit} className="gap-2">
                  Analyser
                </Button>
              </>
            )}

            {isProcessing && (
              <Button disabled className="gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyse en cours...
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
