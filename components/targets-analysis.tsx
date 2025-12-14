"use client"

import { useMemo, useEffect } from "react"
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

export interface TargetsAnalysisProps {
  data: PCIComplaint[]
  selectedDirection: "all" | "by_press" | "against_press"
}

function wrapByLength(text: string, maxChars = 16, maxLines = 2) {
  const words = text.split(" ")
  const lines: string[] = []
  let current = ""

  for (const w of words) {
    if ((current + " " + w).trim().length > maxChars) {
      lines.push(current)
      current = w
      if (lines.length === maxLines - 1) break
    } else {
      current = current ? `${current} ${w}` : w
    }
  }

  if (current && lines.length < maxLines) lines.push(current)
  if (lines.length === maxLines && words.join(" ").length > maxChars * maxLines) {
    lines[lines.length - 1] += "…"
  }

  return lines
}

function getTargetDisplayName(d: PCIComplaint) {
  const aff = d.accusedAffiliation?.trim()
  const name = d.against?.trim()

  // 1. If no valid affiliation
  if (!aff || aff === "Unknown" || aff === "None") {
    const lowerName = name?.toLowerCase() || ""
    const genericRoles = [
      "editor", "the editor", "chief editor", "resident editor", "executive editor",
      "reporter", "correspondent", "publisher", "printer", "owner", "manager",
      "editor-in-chief", "sub-editor", "news editor", "group editor", "managing editor"
    ]

    // If the name itself is just "Editor", label it clearly
    if (genericRoles.includes(lowerName)) {
      return `${name} (Unspecified Media Outlet)`
    }

    return name || "Unknown"
  }

  // 2. If name is missing, just return affiliation
  if (!name) return aff

  // 3. Check for generic roles to ignore in the 'name' field
  // If we know the organization (aff), we don't need to say " - Editor"
  const lowerName = name.toLowerCase()
  const genericRoles = [
    "editor", "the editor", "chief editor", "resident editor", "executive editor",
    "reporter", "correspondent", "publisher", "printer", "owner", "manager",
    "editor-in-chief", "sub-editor", "news editor", "group editor", "managing editor"
  ]

  if (genericRoles.includes(lowerName)) {
    return aff
  }

  // 4. If the name is effectively the same as the affiliation (fuzzy match)
  // e.g. Aff: "Dainik Jagran", Name: "Dainik Jagran"
  if (lowerName === aff.toLowerCase()) {
    return aff
  }

  // 5. Default: Show "Organization — Name"
  return `${aff} — ${name}`
}

export function TargetsAnalysis({ data, selectedDirection }: TargetsAnalysisProps) {
  // Dynamic titles based on direction
  let title = "Top Entities Involved in Complaints"
  let subtitle = "Organizations most frequently named across all complaints"

  switch (selectedDirection) {
    case "against_press":
      title = "Top Targeted News Sources"
      subtitle = "Media organizations with most complaints filed against them"
      break

    case "by_press":
      title = "Top Entities Accused by the Press"
      subtitle = "Organizations most frequently complained against by journalists"
      break
  }

  // Dynamic titles for Bubble Plot
  let bubbleTitle = "Top Entities Involved in Complaints by Year"
  let bubbleSubtitle = "Organizations most frequently named in complaints each year"

  switch (selectedDirection) {
    case "against_press":
      bubbleTitle = "Top Targeted News Sources by Year"
      bubbleSubtitle = "News organizations with most complaints filed against them each year"
      break

    case "by_press":
      bubbleTitle = "Top Entities Accused by the Press by Year"
      bubbleSubtitle = "Organizations most frequently complained against by journalists each year"
      break
  }

  // Top media organizations targeted
  const topTargets = useMemo(() => {
    const counts = new Map<string, number>()

    data.forEach((d) => {
      const label = getTargetDisplayName(d)
      counts.set(label, (counts.get(label) || 0) + 1)
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({
        name,          // full label for axis
        fullName: name, // keep if you want it elsewhere
        count,
      }))
  }, [data])

  useEffect(() => {
    console.log("TOP TARGETS SAMPLE:", topTargets.slice(0, 5))
  }, [topTargets])


  // Complaint types distribution
  const typeDistribution = useMemo(() => {
    const counts = new Map<string, number>()
    data.forEach((d) => {
      counts.set(d.complaintTypeNormalized, (counts.get(d.complaintTypeNormalized) || 0) + 1)
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }))
  }, [data])

  // Bubble chart: Year x Complaints with media name
  const { bubbleData, topTargetsByYear } = useMemo(() => {
    const yearly: Record<number, Map<string, number>> = {}
    const validTargets = new Set(topTargets.map(t => t.fullName))

    data.forEach((d) => {
      const label = getTargetDisplayName(d)
      if (!validTargets.has(label)) return   // 🔑 THIS IS THE FIX

      if (!yearly[d.year]) yearly[d.year] = new Map()
      yearly[d.year].set(label, (yearly[d.year].get(label) || 0) + 1)
    })

    const bubbles: any[] = []
    const topMap: Record<number, any[]> = {}

    Object.entries(yearly).forEach(([yearStr, map]) => {
      const year = Number(yearStr)
      const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
      const top5 = sorted.slice(0, 5)

      topMap[year] = top5.map(([fullName, count]) => ({ fullName, count }))

      top5.forEach(([fullName, count]) => {
        bubbles.push({
          year,
          name: fullName,   // 👈 full label, not `against`
          count,
        })
      })
    })

    return { bubbleData: bubbles, topTargetsByYear: topMap }
  }, [data, topTargets])

  // Yearly trend by complaint type
  const yearlyTrend = useMemo(() => {
    const yearType: Record<number, Record<string, number>> = {}
    data.forEach((d) => {
      if (!yearType[d.year]) yearType[d.year] = {}
      yearType[d.year][d.complaintTypeNormalized] = (yearType[d.year][d.complaintTypeNormalized] || 0) + 1
    })

    return Object.entries(yearType)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, typeCounts]) => ({
        year: Number(year),
        ...typeCounts,
      }))
  }, [data])

  const complaintTypes = useMemo(() => {
    const counts = new Map<string, number>()

    data.forEach((d) => {
      counts.set(d.complaintTypeNormalized, (counts.get(d.complaintTypeNormalized) || 0) + 1)
    })

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])       // sort by count descending
      .slice(0, 5)                       // take top 5
      .map(([type]) => type)             // return only names
  }, [data])
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

  function CustomBubbleTooltip({
    active,
    payload,
    label,
    topTargetsByYear,
  }: {
    active?: boolean
    payload?: any[]
    label?: any
    topTargetsByYear: Record<number, Array<{ fullName: string; count: number }>>
  }) {
    if (!active || !payload || payload.length === 0) return null

    // payload[0].payload is the bubble data item
    const p = payload[0].payload
    if (!p) return null

    const year: number = p.year
    const name: string = p.fullName || p.name
    const count: number = p.count

    const top5 = topTargetsByYear?.[year] || []

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 220, backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
        {/* Main bubble tooltip */}
        <div style={{ paddingBottom: 8, borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{name}</div>
          <div style={{ fontSize: 12, color: "#475569" }}>{count} complaints</div>
        </div>

        {/* Top 5 list */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
            Top 5 in {year}:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {top5.map((t, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#334155" }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                  {idx + 1}. {t.fullName}
                </div>
                <div style={{ fontWeight: 700 }}>{t.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // function CustomBubbleTooltip({
  //   active,
  //   payload,
  //   label,
  //   topTargetsByYear,
  // }: {
  //   active?: boolean
  //   payload?: any[]
  //   label?: any
  //   topTargetsByYear: Record<number, Array<{ fullName: string; count: number }>>
  // }) {
  //   if (!active || !payload || payload.length === 0) return null

  //   // payload[0].payload is the bubble data item
  //   const p = payload[0].payload
  //   if (!p) return null

  //   const year: number = p.year
  //   const name: string = p.name
  //   const count: number = p.count

  //   const top5 = topTargetsByYear?.[year] || []

  //   return (
  //     <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 220 }}>
  //       {/* Top 5 panel (compact) */}
  //       <div style={{ ...tooltipStyle, padding: 8 }}>
  //         <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>
  //           Top 5 sources — {year}
  //         </div>
  //         <div style={{ fontSize: 12, color: "#475569" }}>
  //           {top5.length === 0 ? (
  //             <div style={{ fontSize: 12, color: "#94a3b8" }}>No data</div>
  //           ) : (
  //             top5.map((t, idx) => (
  //               <div key={t.fullName} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
  //                 <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
  //                   {idx + 1}. {t.fullName}
  //                 </div>
  //                 <div style={{ fontWeight: 700 }}>{t.count}</div>
  //               </div>
  //             ))
  //           )}
  //         </div>
  //       </div>

  //       {/* Main bubble tooltip */}
  //       <div style={{ ...tooltipStyle, padding: 8 }}>
  //         <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{name}</div>
  //         <div style={{ fontSize: 12, color: "#475569" }}>{count} complaints</div>
  //       </div>
  //     </div>
  //   )
  // }

  const WrappedYAxisTick = ({ x, y, payload }: any) => {
    const value = String(payload?.value || "")
    const lines = wrapByLength(value, 18)

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-5}
          y={0}
          dy={4}
          textAnchor="end"
          fill="#64748b"
          fontSize={10}
        >
          {lines.map((line, idx) => (
            <tspan key={idx} x={-5} dy={idx === 0 ? 0 : 12}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    )
  }




  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Targeted Media Organizations */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topTargets} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />

                <YAxis
                  dataKey="name"
                  type="category"
                  interval={0}
                  width={110}
                  tick={<WrappedYAxisTick />}
                />


                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload

                    return (
                      <div style={tooltipStyle}>
                        <div style={{ fontWeight: 700, fontSize: 14, margin: "6px 5px" }}>{p.fullName}</div>
                        <div style={{ fontSize: 12, color: "#475569", margin: "6px 5px" }}>
                          {p.count} complaints
                        </div>
                      </div>
                    )
                  }}
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
          <CardTitle className="text-base text-foreground">{bubbleTitle}</CardTitle>
          <CardDescription className="text-muted-foreground text-xs">
            {bubbleSubtitle} (bubble size = complaint count)
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
                // pass the topTargetsByYear map to the custom renderer via function closure
                content={(props: any) => <CustomBubbleTooltip {...props} topTargetsByYear={topTargetsByYear} />}
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
          <CardTitle className="text-base text-foreground">Yearly Trend of Top 5 Complaint Type</CardTitle>
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