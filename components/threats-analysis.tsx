  "use client"

  import { useMemo } from "react"
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
  import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, AreaChart, Area } from "recharts"
  import type { PCIComplaint } from "@/lib/types"

  interface ThreatsAnalysisProps {
    data: PCIComplaint[]
  }

  export function ThreatsAnalysis({ data }: ThreatsAnalysisProps) {
    // Use the data as-is (already filtered by parent component)
    // Note: This component is designed for "by press" complaints (threats),
    // but will work with any filtered data passed to it

    // Top media organizations/journalists raising complaints
    const topComplainants = useMemo(() => {
      const counts = new Map<string, number>()
      data.forEach((d) => {
        counts.set(d.complainant, (counts.get(d.complainant) || 0) + 1)
      })
      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([name, count]) => ({ name: name.length > 20 ? name.slice(0, 20) + "..." : name, fullName: name, count }))
    }, [data])

    // Types of threats
    const threatTypes = useMemo(() => {
      const counts = new Map<string, number>()
      data.forEach((d) => {
        counts.set(d.complaintTypeNormalized, (counts.get(d.complaintTypeNormalized) || 0) + 1)
      })
      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({ type, count }))
    }, [data])

    // Yearly trend of threats
    const yearlyTrend = useMemo(() => {
      const yearCounts: Record<number, number> = {}
      data.forEach((d) => {
        yearCounts[d.year] = (yearCounts[d.year] || 0) + 1
      })
      return Object.entries(yearCounts)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([year, count]) => ({ year: Number(year), threats: count }))
    }, [data])

    const colors = ["#dc2626", "#d97706", "#16a34a", "#2563eb", "#7c3aed", "#db2777", "#0d9488", "#ea580c", "#0891b2"]
    const tooltipStyle = {
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 8,
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    }

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border p-4">
            <p className="text-muted-foreground text-xs font-medium">Total Threat Reports</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{data.length}</p>
          </Card>
          <Card className="bg-card border-border p-4">
            <p className="text-muted-foreground text-xs font-medium">Unique Complainants</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{new Set(data.map((d) => d.complainant)).size}</p>
          </Card>
          <Card className="bg-card border-border p-4">
            <p className="text-muted-foreground text-xs font-medium">Threat Types</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{threatTypes.length}</p>
          </Card>
          <Card className="bg-card border-border p-4">
            <p className="text-muted-foreground text-xs font-medium">States Affected</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{new Set(data.map((d) => d.state)).size}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Media Organizations Reporting Threats */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground">Organizations Reporting Threats</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Media houses and journalists filing threat complaints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topComplainants} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#64748b", fontSize: 10 }} width={120} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: "#0f172a" }}
                    formatter={(value: number, name: string, props: any) => [value, props.payload.fullName]}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Types of Threats */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground">Dominant Threat Types</CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                Categories of threats faced by press
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={threatTypes} margin={{ bottom: 80 }}>
                  <XAxis
                    dataKey="type"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {threatTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
            <CardTitle className="text-base text-foreground">Yearly Trend of Threat Reports</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              How threats to press freedom have evolved over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={yearlyTrend}>
                <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="threats" stroke="#dc2626" fill="#dc2626" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    )
  }
