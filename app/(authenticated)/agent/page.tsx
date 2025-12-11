"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { EMOTION_COLORS, EMOTION_LABELS, type EmotionType, type EmotionData } from "@/lib/types"
import { Mic, MicOff, Phone, PhoneOff, Activity, Waves, Clock, TrendingUp, AlertCircle } from "lucide-react"

export default function AgentPage() {
  const { user } = useAuth()
  const [isOnCall, setIsOnCall] = useState(false)
  const [isMicActive, setIsMicActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null)
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([])
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)

  // WebSocket connection to Python backend
  const connectWebSocket = useCallback(() => {
    setWsStatus("connecting")

    // TODO: Replace with your Python backend WebSocket URL
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/audio"

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setWsStatus("connected")
        ws.send(
          JSON.stringify({
            type: "start_call",
            agentId: user?.id,
            agentName: user?.name,
          }),
        )
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "emotion_result") {
            const emotionData: EmotionData = {
              emotion: data.emotion as EmotionType,
              confidence: data.confidence,
              timestamp: Date.now(),
            }
            setCurrentEmotion(emotionData)
            setEmotionHistory((prev) => [...prev.slice(-50), emotionData])
          }
        } catch (e) {
          // Handle parse error
        }
      }

      ws.onerror = () => {
        setWsStatus("disconnected")
      }

      ws.onclose = () => {
        setWsStatus("disconnected")
      }

      wsRef.current = ws
    } catch (error) {
      setWsStatus("disconnected")
      // Fallback: simulate emotions for demo
      simulateEmotions()
    }
  }, [user])

  // Simulate emotions when no backend is connected
  const simulateEmotions = useCallback(() => {
    const emotions: EmotionType[] = ["calm", "joy", "anxiety", "anger", "sadness", "surprise"]
    const weights = [40, 25, 15, 8, 7, 5]

    const interval = setInterval(() => {
      if (!isOnCall) {
        clearInterval(interval)
        return
      }

      let random = Math.random() * 100
      let selectedEmotion: EmotionType = "calm"

      for (let i = 0; i < emotions.length; i++) {
        random -= weights[i]
        if (random <= 0) {
          selectedEmotion = emotions[i]
          break
        }
      }

      const emotionData: EmotionData = {
        emotion: selectedEmotion,
        confidence: 65 + Math.random() * 35,
        timestamp: Date.now(),
      }

      setCurrentEmotion(emotionData)
      setEmotionHistory((prev) => [...prev.slice(-50), emotionData])
    }, 2000)

    return () => clearInterval(interval)
  }, [isOnCall])

  // Start microphone capture
  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Audio context for visualization
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      // MediaRecorder for sending audio chunks
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          const arrayBuffer = await event.data.arrayBuffer()
          wsRef.current.send(arrayBuffer)
        }
      }

      // Send audio every 2 seconds
      mediaRecorder.start(2000)
      setIsMicActive(true)
    } catch (error) {
      console.error("Microphone access denied")
    }
  }

  // Stop microphone
  const stopMicrophone = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setIsMicActive(false)
  }

  // Start call
  const startCall = async () => {
    setIsOnCall(true)
    setCallDuration(0)
    setEmotionHistory([])
    setCurrentEmotion(null)

    // Start timer
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)

    // Connect WebSocket
    connectWebSocket()

    // Start microphone
    await startMicrophone()
  }

  // End call
  const endCall = () => {
    setIsOnCall(false)

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }

    stopMicrophone()

    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "end_call" }))
      wsRef.current.close()
      wsRef.current = null
    }

    setWsStatus("disconnected")
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall()
    }
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getEmotionStats = () => {
    if (emotionHistory.length === 0) return null

    const counts: Record<EmotionType, number> = {
      joy: 0,
      anger: 0,
      sadness: 0,
      anxiety: 0,
      calm: 0,
      surprise: 0,
    }
    emotionHistory.forEach((e) => counts[e.emotion]++)

    return Object.entries(counts)
      .map(([emotion, count]) => ({
        emotion: emotion as EmotionType,
        percentage: Math.round((count / emotionHistory.length) * 100),
      }))
      .filter((e) => e.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
  }

  const emotionStats = getEmotionStats()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Interface Agent</h1>
          <p className="text-muted-foreground">Bienvenue, {user?.name}</p>
        </div>
        <Badge
          variant="outline"
          className={
            wsStatus === "connected"
              ? "border-green-300 bg-green-50 text-green-700"
              : wsStatus === "connecting"
                ? "border-orange-300 bg-orange-50 text-orange-700"
                : "border-gray-300 bg-gray-50 text-gray-700"
          }
        >
          {wsStatus === "connected" ? "Connecte" : wsStatus === "connecting" ? "Connexion..." : "Hors ligne"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Call Control */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Controle d'appel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Call Status */}
            <div className="flex flex-col items-center gap-4 rounded-xl bg-secondary/50 p-6">
              {isOnCall ? (
                <>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <Phone className="h-10 w-10 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-green-600">Appel en cours</p>
                    <div className="flex items-center justify-center gap-2 text-2xl font-mono font-bold">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      {formatDuration(callDuration)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-3 w-3 rounded-full ${isMicActive ? "bg-red-500 animate-pulse" : "bg-gray-400"}`}
                    />
                    <span className="text-sm text-muted-foreground">
                      {isMicActive ? "Microphone actif" : "Microphone desactive"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                    <PhoneOff className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">Pas d'appel actif</p>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isOnCall ? (
                <Button onClick={startCall} className="flex-1 gap-2" size="lg">
                  <Phone className="h-5 w-5" />
                  Demarrer l'appel
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => (isMicActive ? stopMicrophone() : startMicrophone())}
                    variant={isMicActive ? "secondary" : "outline"}
                    className="flex-1 gap-2"
                    size="lg"
                  >
                    {isMicActive ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    {isMicActive ? "Couper micro" : "Activer micro"}
                  </Button>
                  <Button onClick={endCall} variant="destructive" className="flex-1 gap-2" size="lg">
                    <PhoneOff className="h-5 w-5" />
                    Terminer
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current Emotion */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Emotion detectee
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentEmotion ? (
              <div
                className="flex flex-col items-center gap-4 rounded-xl p-8"
                style={{ backgroundColor: `${EMOTION_COLORS[currentEmotion.emotion]}15` }}
              >
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full animate-pulse-emotion"
                  style={{ backgroundColor: EMOTION_COLORS[currentEmotion.emotion] }}
                >
                  <Waves className="h-12 w-12 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: EMOTION_COLORS[currentEmotion.emotion] }}>
                    {EMOTION_LABELS[currentEmotion.emotion].fr}
                  </p>
                  <p className="text-muted-foreground">Confiance: {Math.round(currentEmotion.confidence)}%</p>
                </div>
                {(currentEmotion.emotion === "anger" || currentEmotion.emotion === "anxiety") && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Emotion negative detectee</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8 text-muted-foreground">
                <Activity className="h-16 w-16 opacity-30" />
                <p>En attente d'analyse...</p>
                <p className="text-sm">L'emotion sera detectee pendant l'appel</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emotion History Stats */}
      {emotionStats && emotionStats.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Statistiques de l'appel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emotionStats.map(({ emotion, percentage }) => (
                <div key={emotion} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{EMOTION_LABELS[emotion].fr}</span>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: EMOTION_COLORS[emotion],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
