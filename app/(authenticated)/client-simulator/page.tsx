"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mic, MicOff, User, Waves, Radio } from "lucide-react"

export default function ClientSimulatorPage() {
  const [clientName, setClientName] = useState("Client Test")
  const [isActive, setIsActive] = useState(false)
  const [isMicActive, setIsMicActive] = useState(false)
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const connectAndStart = async () => {
    setIsActive(true)
    setWsStatus("connecting")

    // Connect to backend
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/client"

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setWsStatus("connected")
        ws.send(
          JSON.stringify({
            type: "client_join",
            clientName,
          }),
        )
      }

      ws.onerror = () => setWsStatus("disconnected")
      ws.onclose = () => setWsStatus("disconnected")

      wsRef.current = ws
    } catch (error) {
      setWsStatus("disconnected")
    }

    // Start microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          const arrayBuffer = await event.data.arrayBuffer()
          wsRef.current.send(arrayBuffer)
        }
      }

      mediaRecorder.start(2000)
      setIsMicActive(true)
    } catch (error) {
      console.error("Microphone access denied")
    }
  }

  const disconnect = () => {
    setIsActive(false)

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsMicActive(false)
    setWsStatus("disconnected")
  }

  useEffect(() => {
    return () => disconnect()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Simulateur Client</h1>
          <p className="text-muted-foreground">Simulez un client pour tester l'analyse</p>
        </div>
        <Badge
          variant="outline"
          className={
            wsStatus === "connected"
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-gray-300 bg-gray-50 text-gray-700"
          }
        >
          {wsStatus === "connected" ? "Connecte" : "Deconnecte"}
        </Badge>
      </div>

      <Card className="mx-auto max-w-md border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center">
            <User className="h-5 w-5 text-primary" />
            Configuration Client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="clientName">Nom du client</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nom du client simule"
              disabled={isActive}
              className="bg-card"
            />
          </div>

          <div className="flex flex-col items-center gap-4 rounded-xl bg-secondary/50 p-6">
            {isActive ? (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                  <Waves className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-primary">Simulation active</p>
                  <p className="text-sm text-muted-foreground">Parlez dans le micro pour simuler le client</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${isMicActive ? "bg-red-500 animate-pulse" : "bg-gray-400"}`}
                  />
                  <span className="text-sm text-muted-foreground">
                    {isMicActive ? "Enregistrement..." : "Micro inactif"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                  <Radio className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-muted-foreground">Pret a simuler</p>
              </>
            )}
          </div>

          {!isActive ? (
            <Button onClick={connectAndStart} className="w-full gap-2" size="lg">
              <Mic className="h-5 w-5" />
              Demarrer la simulation
            </Button>
          ) : (
            <Button onClick={disconnect} variant="destructive" className="w-full gap-2" size="lg">
              <MicOff className="h-5 w-5" />
              Arreter
            </Button>
          )}

          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">Comment utiliser :</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Ouvrez cette page dans un autre navigateur/onglet</li>
              <li>Un agent demarre son appel dans son interface</li>
              <li>Parlez ici pour simuler les emotions du client</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
