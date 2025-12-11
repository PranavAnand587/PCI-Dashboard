"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
} from "recharts"
import type { PCIComplaint } from "@/lib/types"

interface ComplainantsAnalysisProps {
  data: PCIComplaint[]
}

export function ComplainantsAnalysis({ data }: ComplainantsAnalysisProps) {
  // Use the data as-is (already filtered by parent component)
  // Note: This component is designed for "against press" complaints,
  // but will work with any filtered data passed to it

  // Top complainants by occupation
  const complainantOccupations = useMemo(() => {
    const counts = new Map<string, number>()
    data.forEach((d) => {
      const occ = d.complainantOccupation || "Unknown"
      counts.set(occ, (counts.get(occ) || 0) + 1)
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([occupation, count]) => ({ occupation, count }))
  }, [data])

  // Government vs Non-Government breakdown (using Category)
  const govVsNonGov = useMemo(() => {
    let gov = 0,
      nonGov = 0

    data.forEach((d) => {
      // Check if category is Government or Political
      const cat = d.complainantCategory
      if (cat === "Government" || cat === "Political") {
        gov++
      } else {
        nonGov++
      }
    })

    return [
      { name: "Government/Political", value: gov, fill: "#dc2626" },
      { name: "Non-Government", value: nonGov, fill: "#2563eb" },
    ]
  }, [data])

  // Complainant occupation by complaint type (Normalized)
  const occupationByType = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {}
    data.forEach((d) => {
      const type = d.complaintTypeNormalized || "Unknown"
      const occ = d.complainantOccupation || "Unknown"

      if (!matrix[type]) matrix[type] = {}
      matrix[type][occ] = (matrix[type][occ] || 0) + 1
    })

    return Object.entries(matrix)
      .map(([type, occupations]) => {
        const topOcc = Object.entries(occupations).sort((a, b) => b[1] - a[1])[0]
        return {
          type,
          topComplainant: topOcc?.[0] || "Unknown",
          count: topOcc?.[1] || 0,
          total: Object.values(occupations).reduce((a, b) => a + b, 0),
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [data])

  // Yearly trend: Government vs Non-Government
  const yearlyGovTrend = useMemo(() => {
    const yearData: Record<number, { gov: number; nonGov: number }> = {}

    data.forEach((d) => {
      if (!yearData[d.year]) yearData[d.year] = { gov: 0, nonGov: 0 }

      const cat = d.complainantCategory
      if (cat === "Government" || cat === "Political") {
        yearData[d.year].gov++
      } else {
        yearData[d.year].nonGov++
      }
    })

    return Object.entries(yearData)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, counts]) => ({
        year: Number(year),
        Government: counts.gov,
        "Non-Government": counts.nonGov,
      }))
  }, [data])

  const affColors = ["#dc2626", "#d97706", "#16a34a", "#2563eb", "#7c3aed", "#db2777", "#0d9488", "#ea580c"]
  const tooltipStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Government vs Non-Government Pie */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Government vs Non-Government</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Who files complaints against the press?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={govVsNonGov}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={(props) => {
                    const name = props.name || ''
                    const percent = props.percent || 0
                    return `${name}: ${(percent * 100).toFixed(0)}%`
                  }}
                  labelLine={false}
                >
                  {govVsNonGov.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Complainant Occupations */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Top Complainant Occupations</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Primary sources of complaints against press
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={complainantOccupations.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis dataKey="occupation" type="category" tick={{ fill: "#64748b", fontSize: 10 }} width={120} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#0f172a" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {complainantOccupations.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={affColors[index % affColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Yearly Trend */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground">
            Yearly Trend: Government vs Non-Government Complainants
          </CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            How the source of complaints has evolved over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yearlyGovTrend}>
              <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#0f172a" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Government" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Non-Government" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Complainant by Type Matrix */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground">Top Complainant per Complaint Type</CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            Which occupations dominate each complaint category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Complaint Type</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Top Complainant</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Count</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {occupationByType.slice(0, 10).map((row) => (
                  <tr key={row.type} className="border-b border-border hover:bg-secondary/50">
                    <td className="py-2 px-3 text-foreground">{row.type}</td>
                    <td className="py-2 px-3 text-muted-foreground">{row.topComplainant}</td>
                    <td className="py-2 px-3 text-right text-amber-600 font-medium">{row.count}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground">{row.total}</td>
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
