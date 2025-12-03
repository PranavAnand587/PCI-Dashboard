"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, Legend } from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { PCIComplaint } from "@/lib/types"

interface RegionalAnalysisProps {
  data: PCIComplaint[]
  onStateSelect: (state: string) => void
}

export function RegionalAnalysis({ data, onStateSelect }: RegionalAnalysisProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const years = useMemo(() => Array.from(new Set(data.map((d) => d.year))).sort((a, b) => b - a), [data])

  const filteredData = useMemo(() => {
    if (!selectedYear) return data
    return data.filter((d) => d.year === selectedYear)
  }, [data, selectedYear])

  // State-wise complaint counts
  const stateData = useMemo(() => {
    const counts = new Map<string, { total: number; byPress: number; againstPress: number }>()
    filteredData.forEach((d) => {
      const current = counts.get(d.state) || { total: 0, byPress: 0, againstPress: 0 }
      current.total++
      if (d.complaintDirection === "by_press") current.byPress++
      else current.againstPress++
      counts.set(d.state, current)
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([state, counts]) => ({ state, ...counts }))
  }, [filteredData])

  // Yearly trend by state (top 5 states)
  const topStates = stateData.slice(0, 5).map((s) => s.state)
  const yearlyByState = useMemo(() => {
    const yearState: Record<number, Record<string, number>> = {}
    data.forEach((d) => {
      if (!topStates.includes(d.state)) return
      if (!yearState[d.year]) yearState[d.year] = {}
      yearState[d.year][d.state] = (yearState[d.year][d.state] || 0) + 1
    })
    return Object.entries(yearState)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, states]) => ({ year: Number(year), ...states }))
  }, [data, topStates])

  // Heatmap data
  const stateColors = useMemo(() => {
    const max = Math.max(...stateData.map((s) => s.total))
    return stateData.map((s) => ({
      ...s,
      intensity: s.total / max,
      color: `rgba(37, 99, 235, ${0.2 + (s.total / max) * 0.8})`,
    }))
  }, [stateData])

  const colors = ["#dc2626", "#d97706", "#16a34a", "#2563eb", "#7c3aed"]
  const tooltipStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  }

  return (
    <div className="space-y-6">
      {/* Year Toggle */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">Filter by year:</span>
            <Button
              size="sm"
              variant={selectedYear === null ? "default" : "outline"}
              onClick={() => setSelectedYear(null)}
              className="h-7 text-xs"
            >
              All Years
            </Button>
            {years.map((year) => (
              <Button
                key={year}
                size="sm"
                variant={selectedYear === year ? "default" : "outline"}
                onClick={() => setSelectedYear(year)}
                className={`h-7 text-xs`}
              >
                {year}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State Heatmap (simplified as bar chart with color intensity) */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">State-wise Hotspots</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Complaint density across states (click to filter)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={450}>
              <BarChart data={stateData.slice(0, 15)} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis dataKey="state" type="category" tick={{ fill: "#64748b", fontSize: 10 }} width={100} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} onClick={(data: any) => {
                  if (data && data.state) {
                    onStateSelect(data.state)
                  }
                }}>
                  {stateData.slice(0, 15).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={stateColors[index]?.color || "#2563eb"} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Press vs Against Press by State */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Threats vs Complaints by State</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              By Press (threats) vs Against Press (complaints)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={450}>
              <BarChart data={stateData.slice(0, 15)} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis dataKey="state" type="category" tick={{ fill: "#64748b", fontSize: 10 }} width={100} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="byPress" name="By Press (Threats)" fill="#2563eb" stackId="a" />
                <Bar dataKey="againstPress" name="Against Press" fill="#d97706" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Yearly Trend by Top States */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground">Yearly Trend: Top 5 States</CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            How complaint patterns have evolved in high-activity states
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yearlyByState}>
              <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {topStates.map((state, idx) => (
                <Line key={state} type="monotone" dataKey={state} stroke={colors[idx]} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* State Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {stateData.slice(0, 10).map((state) => (
          <Card
            key={state.state}
            className="bg-card border-border p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
            onClick={() => onStateSelect(state.state)}
          >
            <p className="text-xs text-muted-foreground truncate">{state.state}</p>
            <p className="text-xl font-bold text-foreground mt-1">{state.total}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {state.byPress} threats
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
