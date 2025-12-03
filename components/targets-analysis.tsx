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
  ScatterChart,
  Scatter,
  ZAxis,
  LineChart,
  Line,
  Legend,
} from "recharts"
import type { PCIComplaint } from "@/lib/types"

interface TargetsAnalysisProps {
  data: PCIComplaint[]
}

export function TargetsAnalysis({ data }: TargetsAnalysisProps) {
  // Use the data as-is (already filtered by parent component)
  // Note: This component is designed for "against press" complaints,
  // but will work with any filtered data passed to it

  // Top media organizations targeted
  const topTargets = useMemo(() => {
    const counts = new Map<string, number>()
    data.forEach((d) => {
      counts.set(d.against, (counts.get(d.against) || 0) + 1)
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name: name.length > 20 ? name.slice(0, 20) + "..." : name, fullName: name, count }))
  }, [data])

  // Complaint types distribution
  const typeDistribution = useMemo(() => {
    const counts = new Map<string, number>()
    data.forEach((d) => {
      counts.set(d.complaintType, (counts.get(d.complaintType) || 0) + 1)
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }))
  }, [data])

  // Bubble chart: Year x Complaints with media name
  const bubbleData = useMemo(() => {
    const yearMediaCounts: Record<number, Map<string, number>> = {}
    data.forEach((d) => {
      if (!yearMediaCounts[d.year]) yearMediaCounts[d.year] = new Map()
      yearMediaCounts[d.year].set(d.against, (yearMediaCounts[d.year].get(d.against) || 0) + 1)
    })

    const result: Array<{ year: number; name: string; count: number }> = []
    Object.entries(yearMediaCounts).forEach(([year, mediaMap]) => {
      const top5 = Array.from(mediaMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
      top5.forEach(([name, count]) => {
        result.push({ year: Number(year), name: name.length > 15 ? name.slice(0, 15) + "..." : name, count })
      })
    })
    return result
  }, [data])

  // Yearly trend by complaint type
  const yearlyTrend = useMemo(() => {
    const yearType: Record<number, Record<string, number>> = {}
    data.forEach((d) => {
      if (!yearType[d.year]) yearType[d.year] = {}
      yearType[d.year][d.complaintType] = (yearType[d.year][d.complaintType] || 0) + 1
    })

    return Object.entries(yearType)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, typeCounts]) => ({
        year: Number(year),
        ...typeCounts,
      }))
  }, [data])

  const complaintTypes = Array.from(new Set(data.map((d) => d.complaintType)))
  const typeColors = [
    "#dc2626",
    "#d97706",
    "#16a34a",
    "#2563eb",
    "#7c3aed",
    "#db2777",
    "#0d9488",
    "#ea580c",
    "#0891b2",
    "#65a30d",
  ]

  const tooltipStyle = {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Targeted Media Organizations */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Top Targeted News Sources</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Media organizations with most complaints filed against them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topTargets} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#64748b", fontSize: 10 }} width={120} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "#0f172a" }}
                  formatter={(value: number, name: string, props: any) => [value, props.payload.fullName]}
                />
                <Bar dataKey="count" fill="#d97706" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Complaint Types Distribution */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-foreground">Dominant Complaint Categories</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Types of complaints filed against news sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={typeDistribution} margin={{ bottom: 60 }}>
                <XAxis
                  dataKey="type"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#0f172a" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={typeColors[index % typeColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bubble Chart: Top 5 per Year */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground">Top Targets by Year</CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            Top 5 news sources with most complaints per year (bubble size = complaint count)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis
                dataKey="year"
                type="number"
                domain={["dataMin", "dataMax"]}
                tick={{ fill: "#64748b", fontSize: 11 }}
              />
              <YAxis dataKey="count" tick={{ fill: "#64748b", fontSize: 11 }} />
              <ZAxis dataKey="count" range={[50, 400]} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#0f172a" }}
                formatter={(value: any, name: string) => {
                  if (name === "count") return [value, "Complaints"]
                  return [value, name]
                }}
                labelFormatter={(label: any, payload: any) => payload[0]?.payload?.name || ""}
              />
              <Scatter data={bubbleData} fill="#2563eb">
                {bubbleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={typeColors[index % typeColors.length]} fillOpacity={0.8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Yearly Trend by Type */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground">Yearly Trend by Complaint Type</CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            How different complaint categories have evolved over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={yearlyTrend}>
              <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#0f172a" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {complaintTypes.slice(0, 5).map((type, idx) => (
                <Line
                  key={type}
                  type="monotone"
                  dataKey={type}
                  stroke={typeColors[idx]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
