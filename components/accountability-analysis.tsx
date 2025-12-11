"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from "recharts"
import type { PCIComplaint } from "@/lib/types"

interface AccountabilityAnalysisProps {
  data: PCIComplaint[]
}

export function AccountabilityAnalysis({ data }: AccountabilityAnalysisProps) {
  // Overall decision distribution (Parent)
  const decisionDistribution = useMemo(() => {
    const counts = new Map<string, number>()
    data.forEach((d) => counts.set(d.decisionParent, (counts.get(d.decisionParent) || 0) + 1))
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([decision, count]) => ({ decision, count }))
  }, [data])

  // Decision by accused occupation
  const decisionByOccupation = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {}
    data.forEach((d) => {
      const occ = d.accusedOccupation || "Unknown"
      if (!matrix[occ]) matrix[occ] = {}
      matrix[occ][d.decisionParent] = (matrix[occ][d.decisionParent] || 0) + 1
    })

    return Object.entries(matrix)
      .map(([occupation, decisions]) => {
        const total = Object.values(decisions).reduce((a, b) => a + b, 0)
        const upheld = decisions["Upheld"] || 0
        const closed = decisions["Closed"] || 0
        return {
          occupation: occupation.length > 18 ? occupation.slice(0, 18) + "..." : occupation,
          fullOccupation: occupation,
          Upheld: upheld,
          Closed: closed,
          Other: total - upheld - closed,
          total,
          upheldRate: total > 0 ? ((upheld / total) * 100).toFixed(1) : "0",
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [data])

  // Decision by complaint type (Normalized)
  const decisionByType = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {}
    data.forEach((d) => {
      const type = d.complaintTypeNormalized || "Unknown"
      if (!matrix[type]) matrix[type] = {}
      matrix[type][d.decisionParent] = (matrix[type][d.decisionParent] || 0) + 1
    })

    return Object.entries(matrix)
      .map(([type, decisions]) => {
        const total = Object.values(decisions).reduce((a, b) => a + b, 0)
        const upheld = decisions["Upheld"] || 0
        return {
          type,
          Upheld: upheld,
          Closed: decisions["Closed"] || 0,
          Disposed: decisions["Disposed"] || 0,
          Pending: decisions["Pending"] || 0,
          total,
          upheldRate: total > 0 ? ((upheld / total) * 100).toFixed(1) : "0",
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [data])

  // Upheld Rate by Accused Occupation (Top 5)
  const upheldRateByOccupation = useMemo(() => {
    return decisionByOccupation
      .filter(d => d.total > 10) // Filter out low sample sizes
      .sort((a, b) => parseFloat(b.upheldRate) - parseFloat(a.upheldRate))
      .slice(0, 8)
  }, [decisionByOccupation])

  const decisionColors: Record<string, string> = {
    Upheld: "#16a34a",
    Closed: "#dc2626",
    Disposed: "#2563eb",
    Pending: "#d97706",
    "Sub-judice": "#7c3aed",
    Other: "#64748b",
  }

  const tooltipStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Decision Distribution */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Overall Decisions</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">Case outcome distribution (High Level)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={decisionDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="count"
                  nameKey="decision"
                  label={(props) => {
                    const decision = props.payload?.decision || props.name
                    const percent = props.percent || 0
                    return `${decision}: ${(percent * 100).toFixed(0)}%`
                  }}
                  labelLine={false}
                >
                  {decisionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={decisionColors[entry.decision] || "#64748b"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upheld Rate by Accused Occupation */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Highest Upheld Rates by Accused Occupation</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Which occupations face the most upheld complaints? (Min 10 cases)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={upheldRateByOccupation}>
                <XAxis dataKey="occupation" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`${value}%`, "Upheld Rate"]}
                />
                <Bar dataKey="upheldRate" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Decision by Accused Occupation */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground">Decisions by Accused Occupation</CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            How outcomes vary based on who the accused is
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={decisionByOccupation.slice(0, 12)} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis dataKey="occupation" type="category" tick={{ fill: "#64748b", fontSize: 10 }} width={130} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [value, name]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Upheld" stackId="a" fill="#16a34a" />
              <Bar dataKey="Closed" stackId="a" fill="#dc2626" />
              <Bar dataKey="Other" stackId="a" fill="#64748b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Decision by Complaint Type */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground">Decisions by Complaint Type</CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            Which complaint types are more likely to be upheld?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Complaint Type</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Upheld</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Closed</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Disposed</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Pending</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Upheld %</th>
                </tr>
              </thead>
              <tbody>
                {decisionByType.slice(0, 12).map((row) => (
                  <tr key={row.type} className="border-b border-border hover:bg-secondary/50">
                    <td className="py-2 px-3 text-foreground">{row.type}</td>
                    <td className="py-2 px-3 text-right text-emerald-600 font-medium">{row.Upheld}</td>
                    <td className="py-2 px-3 text-right text-red-600">{row.Closed}</td>
                    <td className="py-2 px-3 text-right text-blue-600">{row.Disposed}</td>
                    <td className="py-2 px-3 text-right text-amber-600">{row.Pending}</td>
                    <td className="py-2 px-3 text-right text-foreground font-medium">{row.upheldRate}%</td>
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
