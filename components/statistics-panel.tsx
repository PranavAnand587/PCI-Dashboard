"use client"

import { Card } from "@/components/ui/card"
import { ArrowUp, ArrowDown, FileText, Shield, AlertTriangle, Scale } from "lucide-react"

interface StatisticsPanelProps {
  stats: {
    total: number
    byPress: number
    againstPress: number
    upheld: number
    dismissed: number
    upheldRate: string
    statesCovered: number
    yearsSpanned: number
  }
  selectedDirection?: "all" | "by_press" | "against_press"
}

export function StatisticsPanel({ stats, selectedDirection = "all" }: StatisticsPanelProps) {
  // Determine what to display based on selected direction
  const byPressDisplay = selectedDirection === "against_press" ? "N/A" : stats.byPress.toLocaleString()
  const againstPressDisplay = selectedDirection === "by_press" ? "N/A" : stats.againstPress.toLocaleString()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card className="bg-card border-border p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
          <FileText className="h-3.5 w-3.5" />
          Total Cases
        </div>
        <p className="text-2xl font-bold text-foreground mt-2">{stats.total.toLocaleString()}</p>
      </Card>

      <Card className="bg-card border-border p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
          <Shield className="h-3.5 w-3.5 text-blue-600" />
          By Press
        </div>
        <p className="text-2xl font-bold text-blue-600 mt-2">{byPressDisplay}</p>
        <p className="text-muted-foreground text-xs mt-1">threats reported</p>
      </Card>

      <Card className="bg-card border-border p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          Against Press
        </div>
        <p className="text-2xl font-bold text-amber-600 mt-2">{againstPressDisplay}</p>
        <p className="text-muted-foreground text-xs mt-1">media complaints</p>
      </Card>

      <Card className="bg-card border-border p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
          <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />
          Upheld
        </div>
        <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.upheld.toLocaleString()}</p>
        <p className="text-muted-foreground text-xs mt-1">{stats.upheldRate}% rate</p>
      </Card>

      <Card className="bg-card border-border p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
          <ArrowDown className="h-3.5 w-3.5 text-red-600" />
          Dismissed
        </div>
        <p className="text-2xl font-bold text-red-600 mt-2">{stats.dismissed.toLocaleString()}</p>
      </Card>

      <Card className="bg-card border-border p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
          <Scale className="h-3.5 w-3.5 text-purple-600" />
          Coverage
        </div>
        <p className="text-2xl font-bold text-purple-600 mt-2">{stats.statesCovered}</p>
        <p className="text-muted-foreground text-xs mt-1">{stats.yearsSpanned} years</p>
      </Card>
    </div>
  )
}