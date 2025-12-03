"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, RefreshCw, Download } from "lucide-react"
import type { FiltersResponse } from "@/lib/api"

interface ResearchFindingsProps {
    filters: FiltersResponse | null
}

export function ResearchFindings({ filters }: ResearchFindingsProps) {
    const [table, setTable] = useState<"against" | "by">("against")
    const [startYear, setStartYear] = useState<string>("2010")
    const [endYear, setEndYear] = useState<string>("2023")
    const [state, setState] = useState<string>("Delhi")
    const [column, setColumn] = useState<string>("ComplaintType")
    const [chartType, setChartType] = useState<string>("bar")
    const [topK, setTopK] = useState<string>("10")
    const [loading, setLoading] = useState<boolean>(false)
    const [refreshKey, setRefreshKey] = useState<number>(0)

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

    const handleRefresh = () => {
        setLoading(true)
        setRefreshKey(prev => prev + 1)
        // Simulate loading delay for better UX since images load async
        setTimeout(() => setLoading(false), 1000)
    }

    const getImageUrl = (endpoint: string, params: Record<string, string>) => {
        const searchParams = new URLSearchParams()
        searchParams.set("table", table)
        if (startYear) searchParams.set("start_year", startYear)
        if (endYear) searchParams.set("end_year", endYear)

        Object.entries(params).forEach(([key, value]) => {
            if (value) searchParams.set(key, value)
        })

        // Add refresh key to bypass browser cache
        searchParams.set("_t", refreshKey.toString())

        return `${API_BASE_URL}/research/${endpoint}?${searchParams.toString()}`
    }

    return (
        <div className="space-y-6">
            {/* Controls Panel */}
            <Card className="bg-card border-border">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Research Parameters</CardTitle>
                    <CardDescription>Configure parameters for generating research visualizations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Dataset Table</Label>
                            <Select value={table} onValueChange={(v: "against" | "by") => setTable(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select table" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="against">Against Press (Complaints)</SelectItem>
                                    <SelectItem value="by">By Press (Threats)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Year Range</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={startYear}
                                    onChange={(e) => setStartYear(e.target.value)}
                                    placeholder="Start"
                                    className="w-full"
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                    type="number"
                                    value={endYear}
                                    onChange={(e) => setEndYear(e.target.value)}
                                    placeholder="End"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>State (for Map/Bubble)</Label>
                            <Select value={state} onValueChange={setState}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filters?.states.map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Group Column</Label>
                            <Select value={column} onValueChange={setColumn}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select column" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ComplaintType">Complaint Type</SelectItem>
                                    <SelectItem value="Decision">Decision</SelectItem>
                                    <SelectItem value="State">State</SelectItem>
                                    <SelectItem value="c_aff_resolved">Complainant Affiliation</SelectItem>
                                    <SelectItem value="a_aff_resolved">Accused Affiliation</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Chart Type (For Visualise Press tab)</Label>
                            <Select value={chartType} onValueChange={setChartType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bar">Bar Chart</SelectItem>
                                    <SelectItem value="bubble">Bubble Chart</SelectItem>
                                    <SelectItem value="wordcloud">Word Cloud</SelectItem>
                                    <SelectItem value="line">Line Chart</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Top K Items</Label>
                            <Input
                                type="number"
                                value={topK}
                                onChange={(e) => setTopK(e.target.value)}
                                min={1}
                                max={50}
                            />
                        </div>

                        <div className="flex items-end">
                            <Button onClick={handleRefresh} className="w-full" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Generate Visualizations
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Visualizations Tabs */}
            <Tabs defaultValue="map" className="w-full">
                <TabsList className="bg-secondary border border-border p-1 h-auto flex-wrap w-full justify-start">
                    <TabsTrigger value="map">India Map</TabsTrigger>
                    <TabsTrigger value="wordcloud">Word Cloud</TabsTrigger>
                    <TabsTrigger value="stacked">Stacked Histogram</TabsTrigger>
                    <TabsTrigger value="cdf">CDF Lineplot</TabsTrigger>
                    <TabsTrigger value="freq">Frequency Plot</TabsTrigger>
                    <TabsTrigger value="press">Visualize Press</TabsTrigger>
                    <TabsTrigger value="bubble_press">Bubble Top K Press</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="map">
                        <VizCard
                            title="State-wise Heatmap"
                            description={`Geographic distribution of cases in ${table} table`}
                            src={getImageUrl("india_map", {})}
                            loading={loading}
                        />
                    </TabsContent>

                    <TabsContent value="wordcloud">
                        <VizCard
                            title="Word Cloud Analysis"
                            description={`Most frequent terms in ${column} column`}
                            src={getImageUrl("wordcloud", { column: "Complaint" })}
                            loading={loading}
                        />
                    </TabsContent>

                    <TabsContent value="stacked">
                        <VizCard
                            title="Stacked Histogram"
                            description={`Complaints by Report for each ${column}`}
                            src={getImageUrl("stacked_histogram", { column })}
                            loading={loading}
                        />
                    </TabsContent>

                    <TabsContent value="cdf">
                        <VizCard
                            title="CDF Lineplot"
                            description={`Cumulative Distribution Function of complaints per ${column}`}
                            src={getImageUrl("cdf_lineplot", { column })}
                            loading={loading}
                        />
                    </TabsContent>

                    <TabsContent value="freq">
                        <VizCard
                            title="Frequency Lineplot"
                            description={`Year-wise frequency of complaints per ${column}`}
                            src={getImageUrl("freq_line_plot", { column })}
                            loading={loading}
                        />
                    </TabsContent>

                    <TabsContent value="press">
                        <VizCard
                            title="Press Visualization"
                            description={`Top ${topK} Media Houses grouped by ${column} (${chartType})`}
                            src={getImageUrl("visualize_press", { chart_type: chartType, group_col: column, top_k: topK })}
                            loading={loading}
                        />
                    </TabsContent>

                    <TabsContent value="bubble_press">
                        <VizCard
                            title="Top K Press Bubble Plot"
                            description={`Top ${topK} Media Houses in ${state} by Year`}
                            src={getImageUrl("bubble_topk_press", { state, topk: topK })}
                            loading={loading}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

function VizCard({ title, description, src, loading }: { title: string, description: string, src: string, loading: boolean }) {
    return (
        <Card className="bg-card border-border overflow-hidden">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <a href={src} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </a>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex justify-center p-6 bg-white/5 min-h-[500px] items-center">
                {loading ? (
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                ) : (
                    <img
                        src={src}
                        alt={title}
                        className="max-w-full max-h-[800px] object-contain rounded-md shadow-sm"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML += '<p class="text-destructive">Failed to load visualization. Check parameters or backend logs.</p>';
                        }}
                    />
                )}
            </CardContent>
        </Card>
    )
}
