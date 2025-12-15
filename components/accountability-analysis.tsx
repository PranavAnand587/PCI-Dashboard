"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from "recharts"
import type { PCIComplaint } from "@/lib/types"

interface AccountabilityAnalysisProps {
  data: PCIComplaint[]
  selectedDirection: "all" | "by_press" | "against_press"
}

export function AccountabilityAnalysis({ data, selectedDirection }: AccountabilityAnalysisProps) {
  // Overall decision distribution (Parent)
  // const decisionDistribution = useMemo(() => {
  //   const counts = new Map<string, number>()
  //   data.forEach((d) => counts.set(d.decisionParent, (counts.get(d.decisionParent) || 0) + 1))
  //   return Array.from(counts.entries())
  //     .sort((a, b) => b[1] - a[1])
  //     .map(([decision, count]) => ({ decision, count }))
  // }, [data])

  const decisionCounts = useMemo(() => {
    const counts = new Map<string, number>()

    data.forEach(d => {
      const decision = d.decisionSpecific || "Unknown"
      counts.set(decision, (counts.get(decision) || 0) + 1)
    })

    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])

    // Top N logic
    const TOP_N = 10
    if (sorted.length <= TOP_N) {
      return sorted.map(([decision, count]) => ({ decision, count }))
    }

    const top = sorted.slice(0, TOP_N)
    const rest = sorted.slice(TOP_N)
    const otherCount = rest.reduce((sum, [, c]) => sum + c, 0)

    return [
      ...top.map(([decision, count]) => ({ decision, count })),
      { decision: "All Other Decisions", count: otherCount },
    ]
  }, [data])


  // Decision by accused occupation or level
  const decisionByCategory = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {}
    data.forEach((d) => {
      let category = d.accusedCategory || "Unknown"

      // Use level for against_press direction
      if (selectedDirection === "against_press") {
        category = d.level || "Unknown"
      }

      if (!matrix[category]) matrix[category] = {}
      matrix[category][d.decisionParent] = (matrix[category][d.decisionParent] || 0) + 1
    })

    return Object.entries(matrix)
      .map(([category, decisions]) => {
        const total = Object.values(decisions).reduce((a, b) => a + b, 0)
        const upheld = decisions["Upheld"] || 0
        return {
          category,
          Upheld: upheld,
          Closed: decisions["Closed"] || 0,
          Other: total - upheld - (decisions["Closed"] || 0),
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
  const upheldRateByCategory = useMemo(() => {
    return decisionByCategory
      .filter(d => d.total >= 20) // Increased from 10 to 50!
      .sort((a, b) => parseFloat(b.upheldRate) - parseFloat(a.upheldRate))
      .slice(0, 8)
  }, [decisionByCategory])

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
            <CardTitle>Specific Decision Outcomes</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Most frequent decision texts as recorded in orders
            </CardDescription>

          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={decisionCounts}>
                  <XAxis
                    dataKey="decision"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upheld Rate by Accused Occupation */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">
              {selectedDirection === "against_press" ? "Highest Upheld Rates by Press Level" : "Highest Upheld Rates by Accused Category"}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              {selectedDirection === "against_press"
                ? "Upheld rates across different levels of press organizations"
                : "Categories inferred from affiliation text using rule-based methods. Minimum 20 cases required."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={upheldRateByCategory}>
                <XAxis
                  dataKey="category"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string, props: any) => {
                    const item = props.payload
                    return [
                      `${value}%`,
                      `Upheld Rate (${item.Upheld}/${item.total} cases)`
                    ]
                  }}
                />
                <Bar dataKey="upheldRate" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Decision by Accused Category */}
      {/* Decision by Accused Category - Hidden for against_press */}
      {selectedDirection !== "against_press" && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">
              Decisions by Accused Category
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Outcomes grouped by broad accused category (rule-based inference)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={decisionByCategory.slice(0, 12)}
                layout="vertical"
                margin={{ left: 60 }}
              >
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis
                  dataKey="category"
                  type="category"
                  interval={0}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  width={140}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Upheld" stackId="a" fill="#16a34a" />
                <Bar dataKey="Closed" stackId="a" fill="#dc2626" />
                <Bar dataKey="Other" stackId="a" fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}


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
