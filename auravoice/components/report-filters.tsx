"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import type { Agent, EmotionType } from "@/lib/types"
import { EMOTION_LABELS } from "@/lib/types"

export interface ReportFilters {
  search?: string
  agentId?: string
  emotion?: string
  dateFrom?: string
  dateTo?: string
}

interface ReportFiltersProps {
  agents: Agent[]
  filters: ReportFilters
  onFiltersChange: (filters: ReportFilters) => void
}

export function ReportFiltersComponent({ agents, filters, onFiltersChange }: ReportFiltersProps) {
  const handleReset = () => {
    onFiltersChange({})
  }

  const hasFilters = Object.values(filters).some((v) => v)

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-card p-4 shadow-sm">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un agent..."
          value={filters.search || ""}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-9 bg-background"
        />
      </div>

      {/* Agent Filter */}
      {agents.length > 0 && (
        <Select
          value={filters.agentId || "all"}
          onValueChange={(value) => onFiltersChange({ ...filters, agentId: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Tous les agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les agents</SelectItem>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Emotion Filter */}
      <Select
        value={filters.emotion || "all"}
        onValueChange={(value) => onFiltersChange({ ...filters, emotion: value === "all" ? undefined : value })}
      >
        <SelectTrigger className="w-[180px] bg-background">
          <SelectValue placeholder="Toutes les emotions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les emotions</SelectItem>
          {(Object.keys(EMOTION_LABELS) as EmotionType[]).map((emotion) => (
            <SelectItem key={emotion} value={emotion}>
              {EMOTION_LABELS[emotion].fr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
          <X className="h-4 w-4" />
          Effacer
        </Button>
      )}
    </div>
  )
}
