"use client"

import { useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts"
import type { PCIComplaint } from "@/lib/types"

interface RegionalAnalysisProps {
  data: PCIComplaint[]
  onStateSelect: (state: string) => void
}

export function RegionalAnalysis({ data, onStateSelect }: RegionalAnalysisProps) {
  /* -----------------------------
     State-wise aggregation
  ------------------------------ */
  const stateData = useMemo(() => {
    const counts = new Map<
      string,
      { total: number; byPress: number; againstPress: number }
    >()

    data.forEach((d) => {
      if (
        !d.state ||
        d.state.toLowerCase() === "unknown" ||
        d.state.toLowerCase() === "none"
      )
        return

      const current =
        counts.get(d.state) || { total: 0, byPress: 0, againstPress: 0 }

      current.total++
      if (d.complaintDirection === "by_press") current.byPress++
      else current.againstPress++

      counts.set(d.state, current)
    })

    return Array.from(counts.entries())
      .map(([state, c]) => ({
        state,
        ...c,
        threatPct: c.total > 0 ? (c.byPress / c.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
  }, [data])

  /* -----------------------------
     Yearly trend (top 5 by volume)
  ------------------------------ */
  const topStates = stateData.slice(0, 5).map((s) => s.state)

  const yearlyByState = useMemo(() => {
    const yearState: Record<number, Record<string, number>> = {}

    data.forEach((d) => {
      if (!topStates.includes(d.state)) return

      if (!yearState[d.year]) yearState[d.year] = {}
      yearState[d.year][d.state] =
        (yearState[d.year][d.state] || 0) + 1
    })

    return Object.entries(yearState)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, states]) => ({
        year: Number(year),
        ...states,
      }))
  }, [data, topStates])

  const colors = ["#dc2626", "#d97706", "#16a34a", "#2563eb", "#7c3aed"]

  const tooltipStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  }

  return (
    <div className="space-y-6">
      {/* -----------------------------
         Threats vs Complaints (Bar)
      ------------------------------ */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground">
            Threats vs Complaints by State
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            By Press (threats) vs Against Press (complaints)
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ResponsiveContainer width="100%" height={450}>
            <BarChart
              data={stateData.slice(0, 15)}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis
                dataKey="state"
                type="category"
                tick={{ fill: "#64748b", fontSize: 10 }}
                width={120}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="byPress"
                name="By Press (Threats)"
                fill="#2563eb"
                stackId="a"
              />
              <Bar
                dataKey="againstPress"
                name="Against Press"
                fill="#d97706"
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* -----------------------------
         Yearly Trend (Line)
      ------------------------------ */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground">
            Complaints Over Time by State
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            Compare complaint volume over time for selected states (max 5)
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yearlyByState}>
              <XAxis
                dataKey="year"
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {topStates.map((state, idx) => (
                <Line
                  key={state}
                  type="monotone"
                  dataKey={state}
                  stroke={colors[idx]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* -----------------------------
         State-wise Analytical Table
      ------------------------------ */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground">
            State-wise Complaints and Threats
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            Distribution of complaints and threats across states
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    State
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Total
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Threats
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Complaints
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Threat %
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Rank <br /> (Total Complainants)
                  </th>
                </tr>
              </thead>

              <tbody>
                {stateData.map((state, idx) => (
                  <tr
                    key={state.state}
                    className="border-b border-border hover:bg-secondary/50 cursor-pointer"
                    onClick={() => onStateSelect(state.state)}
                  >
                    <td className="py-2 px-3 text-foreground">
                      {state.state}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">
                      {state.total}
                    </td>
                    <td className="py-2 px-3 text-right text-blue-600">
                      {state.byPress}
                    </td>
                    <td className="py-2 px-3 text-right text-red-600">
                      {state.againstPress}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {state.threatPct.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right text-muted-foreground">
                      #{idx + 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
