"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/mock-data"
import { EMOTION_COLORS, EMOTION_LABELS, type EmotionType, type ActiveCall, type Agent } from "@/lib/types"
import { Phone, Users, AlertTriangle, Activity, Smile, Meh, Frown, Zap, Clock, Headphones, Radio } from "lucide-react"

export function SupervisorDashboard() {
  const { user } = useAuth()
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      const [callsData, agentsData] = await Promise.all([api.getActiveCalls(), api.getAgents()])
      setActiveCalls(callsData)
      setAgents(agentsData)
      setIsLoading(false)
    }
    fetchData()

    // Refresh every 5 seconds
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const getAgentName = (agentId: string) => {
    return agents.find((a) => a.id === agentId)?.name || "Agent"
  }

  const getAgentInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getEmotionIcon = (emotion: EmotionType) => {
    switch (emotion) {
      case "joy":
        return <Smile className="h-4 w-4" />
      case "calm":
        return <Meh className="h-4 w-4" />
      case "anger":
        return <Frown className="h-4 w-4" />
      case "anxiety":
        return <Zap className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const formatDuration = (startTime: Date) => {
    const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
    const mins = Math.floor(diff / 60)
    const secs = diff % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const alertCalls = activeCalls.filter((c) => c.alertTriggered)
  const onlineAgents = agents.filter((a) => a.status !== "offline")
  const onCallAgents = agents.filter((a) => a.status === "on-call")

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Activity className="h-5 w-5 animate-spin" />
          Chargement du tableau de bord...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground">Bienvenue, {user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
            <span className="h-2 w-2 animate-live-pulse rounded-full bg-green-500" />
            En direct
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCalls.length}</p>
              <p className="text-sm text-muted-foreground">Appels en cours</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{onlineAgents.length}</p>
              <p className="text-sm text-muted-foreground">Agents en ligne</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{onCallAgents.length}</p>
              <p className="text-sm text-muted-foreground">En communication</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-md ${alertCalls.length > 0 ? "animate-alert-blink border-2" : ""}`}>
          <CardContent className="flex items-center gap-4 p-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${alertCalls.length > 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{alertCalls.length}</p>
              <p className="text-sm text-muted-foreground">Alertes actives</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Calls Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Appels en cours</h2>
        {activeCalls.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Radio className="mb-3 h-12 w-12 opacity-50" />
              <p>Aucun appel en cours</p>
              <p className="text-sm">Les appels apparaitront ici en temps reel</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeCalls.map((call) => {
              const agentName = getAgentName(call.agentId)
              const emotion = call.currentEmotion.emotion
              const emotionColor = EMOTION_COLORS[emotion]

              return (
                <Card
                  key={call.id}
                  className={`border-0 shadow-md transition-all ${call.alertTriggered ? "animate-alert-blink border-2" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2" style={{ borderColor: emotionColor }}>
                          <AvatarFallback className="bg-secondary text-xs font-medium">
                            {getAgentInitials(agentName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{agentName}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDuration(call.startTime)}
                          </div>
                        </div>
                      </div>
                      {call.alertTriggered && (
                        <Badge variant="destructive" className="animate-pulse">
                          Alerte
                        </Badge>
                      )}
                    </div>

                    {/* Emotion indicator */}
                    <div
                      className="flex items-center justify-between rounded-lg p-3"
                      style={{ backgroundColor: `${emotionColor}15` }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full"
                          style={{ backgroundColor: emotionColor, color: "white" }}
                        >
                          {getEmotionIcon(emotion)}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: emotionColor }}>
                            {EMOTION_LABELS[emotion].fr}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Confiance: {Math.round(call.currentEmotion.confidence)}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${call.currentEmotion.confidence}%`,
                              backgroundColor: emotionColor,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Team Overview */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Equipe</h2>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                      {getAgentInitials(agent.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{agent.name}</p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        agent.status === "on-call"
                          ? "border-green-300 bg-green-50 text-green-700"
                          : agent.status === "online"
                            ? "border-blue-300 bg-blue-50 text-blue-700"
                            : agent.status === "break"
                              ? "border-orange-300 bg-orange-50 text-orange-700"
                              : "border-gray-300 bg-gray-50 text-gray-700"
                      }`}
                    >
                      {agent.status === "on-call"
                        ? "En appel"
                        : agent.status === "online"
                          ? "Disponible"
                          : agent.status === "break"
                            ? "Pause"
                            : "Hors ligne"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
