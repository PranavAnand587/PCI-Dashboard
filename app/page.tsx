"use client"

import { useState, useMemo, useEffect } from "react"
import { fetchAllComplaints } from "@/lib/data-loader"
import { getFilters, type FiltersResponse } from "@/lib/api"
import type { PCIComplaint } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Network, Target, Users, Scale, TrendingUp, Filter, MapIcon, Loader2 } from "lucide-react"

// Components
import { FilterPanel } from "@/components/filter-panel"
import { StatisticsPanel } from "@/components/statistics-panel"
import { IndiaMap } from "@/components/india-map"
import { TargetsAnalysis } from "@/components/targets-analysis"
import { ComplainantsAnalysis } from "@/components/complainants-analysis"
import { ThreatsAnalysis } from "@/components/threats-analysis"
import { AccountabilityAnalysis } from "@/components/accountability-analysis"
import { RegionalAnalysis } from "@/components/regional-analysis"
import { NetworkGraph } from "@/components/network-graph"
import { ExportPanel } from "@/components/export-panel"
import { ResearchFindings } from "@/components/research-findings"

export default function Dashboard() {
  const [allData, setAllData] = useState<PCIComplaint[]>([])
  const [filters, setFilters] = useState<FiltersResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load data and filters from API on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)
      try {
        const [data, filtersData] = await Promise.all([fetchAllComplaints(), getFilters()])

        if (data.length === 0) {
          setError("No data received from API. Make sure the Backend is connected")
        }

        setAllData(data)
        setFilters(filtersData)

        console.log("Loaded filters from API:", filtersData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
        console.error("Error loading data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Filter states
  const [selectedYears, setSelectedYears] = useState<number[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedDirection, setSelectedDirection] = useState<"all" | "by_press" | "against_press">("all")
  const [selectedAffiliations, setSelectedAffiliations] = useState<string[]>([])
  const [selectedDecisions, setSelectedDecisions] = useState<string[]>([])
  const [activeView, setActiveView] = useState("targets")

  // If the user switches to 'against_press', hide the threats tab and ensure activeView isn't 'threats'
  useEffect(() => {
    if (selectedDirection === "against_press" && activeView === "threats") {
      setActiveView("targets")
    }
  }, [selectedDirection, activeView])

  // Data filtered only by direction, for the FilterPanel counts
  const directionFilteredData = useMemo(() => {
    if (selectedDirection === "all") return allData
    return allData.filter((d) => d.complaintDirection === selectedDirection)
  }, [allData, selectedDirection])

  // Filtered data based on all active filters
  const filteredData = useMemo(() => {
    const result = allData.filter((item) => {
      if (selectedYears.length > 0 && !selectedYears.includes(item.year)) return false
      if (selectedStates.length > 0 && !selectedStates.includes(item.state)) return false
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.complaintType)) return false
      if (selectedDirection !== "all" && item.complaintDirection !== selectedDirection) return false
      if (selectedAffiliations.length > 0) {
        const hasAffiliation =
          selectedAffiliations.includes(item.complainantAffiliation) ||
          selectedAffiliations.includes(item.accusedAffiliation)
        if (!hasAffiliation) return false
      }
      if (selectedDecisions.length > 0 && !selectedDecisions.includes(item.decision)) return false
      return true
    })

    console.log("Filter applied:", {
      selectedDirection,
      totalData: allData.length,
      filteredCount: result.length,
      directionCounts: {
        by_press: allData.filter((d) => d.complaintDirection === "by_press").length,
        against_press: allData.filter((d) => d.complaintDirection === "against_press").length,
      },
    })

    return result
  }, [
    allData,
    selectedYears,
    selectedStates,
    selectedTypes,
    selectedDirection,
    selectedAffiliations,
    selectedDecisions,
  ])

  // State data for map
  const stateMapData = useMemo(() => {
    const counts = new Map<string, { total: number; byPress: number; againstPress: number }>()
    filteredData.forEach((d) => {
      const current = counts.get(d.state) || { total: 0, byPress: 0, againstPress: 0 }
      current.total++
      if (d.complaintDirection === "by_press") current.byPress++
      else current.againstPress++
      counts.set(d.state, current)
    })
    return Array.from(counts.entries()).map(([state, data]) => ({
      state,
      count: data.total,
      byPress: data.byPress,
      againstPress: data.againstPress,
    }))
  }, [filteredData])

  // Statistics
  const statistics = useMemo(() => {
    const byPress = filteredData.filter((d) => d.complaintDirection === "by_press").length
    const againstPress = filteredData.filter((d) => d.complaintDirection === "against_press").length
    const upheld = filteredData.filter((d) => d.decisionParent === "Upheld").length
    const dismissed = filteredData.filter((d) => d.decisionParent === "Closed").length

    return {
      total: filteredData.length,
      byPress,
      againstPress,
      upheld,
      dismissed,
      upheldRate: filteredData.length > 0 ? ((upheld / filteredData.length) * 100).toFixed(1) : "0",
      statesCovered: new Set(filteredData.map((d) => d.state)).size,
      yearsSpanned: new Set(filteredData.map((d) => d.year)).size,
    }
  }, [filteredData])

  const activeFilterCount = [
    selectedYears.length,
    selectedStates.length,
    selectedTypes.length,
    selectedDirection !== "all" ? 1 : 0,
    selectedAffiliations.length,
    selectedDecisions.length,
  ].reduce((a, b) => a + b, 0)

  const clearAllFilters = () => {
    setSelectedYears([])
    setSelectedStates([])
    setSelectedTypes([])
    setSelectedDirection("all")
    setSelectedAffiliations([])
    setSelectedDecisions([])
  }

  const handleStateClick = (state: string) => {
    if (state === "" || selectedStates.includes(state)) {
      setSelectedStates([])
    } else {
      setSelectedStates([state])
    }
  }

  const mapDirection = selectedDirection === "all" ? "all" : selectedDirection === "by_press" ? "by" : "against"

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading PCI complaints data...</p>
          <p className="text-sm text-muted-foreground">Fetching Data from Backend</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-semibold text-foreground">Failed to Load Data</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="bg-secondary/50 p-4 rounded-lg text-left text-sm">
            <p className="font-medium mb-2">Troubleshooting:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Make sure the FastAPI backend is running</li>
              <li>
                Check that it's accessible at{" "}
                <code className="bg-background px-1 py-0.5 rounded">http://localhost:8000</code>
              </li>
              <li>
                Verify the database file exists at{" "}
                <code className="bg-background px-1 py-0.5 rounded">complaints.db</code>
              </li>
              <li>Check browser console for detailed errors</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Press Council of India: Complaints Analytics</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Analyzing press freedom, threats, and accountability across India
              </p>
            </div>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="border-primary/30 text-primary">
                  <Filter className="h-3 w-3 mr-1" />
                  {activeFilterCount} filters
                </Badge>
              )}
              <ExportPanel data={filteredData} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-6 space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="general">General Analytics</TabsTrigger>
            <TabsTrigger value="research">Research Findings</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Statistics Overview */}
            <StatisticsPanel stats={statistics} selectedDirection={selectedDirection} />

            {/* Filter Panel */}
            <FilterPanel
              data={directionFilteredData}
              filters={filters}
              selectedYears={selectedYears}
              selectedStates={selectedStates}
              selectedTypes={selectedTypes}
              selectedDirection={selectedDirection}
              selectedAffiliations={selectedAffiliations}
              selectedDecisions={selectedDecisions}
              onYearsChange={setSelectedYears}
              onStatesChange={setSelectedStates}
              onTypesChange={setSelectedTypes}
              onDirectionChange={setSelectedDirection}
              onAffiliationsChange={setSelectedAffiliations}
              onDecisionsChange={setSelectedDecisions}
              onClearAll={clearAllFilters}
            />

            {/* Interactive India Map - Primary Visualization */}
            <IndiaMap
              stateData={stateMapData}
              onStateClick={handleStateClick}
              selectedState={selectedStates.length === 1 ? selectedStates[0] : null}
              direction={mapDirection}
            />

            {/* Research Question Views */}
            <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
              <TabsList className="bg-secondary border border-border p-1 h-auto flex-wrap">
                <TabsTrigger
                  value="targets"
                  className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2"
                >
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Targets</span>
                </TabsTrigger>

                <TabsTrigger
                  value="complainants"
                  className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Complainants</span>
                </TabsTrigger>

                {/* Only render the Threats tab if direction is NOT 'against_press' */}
                {selectedDirection !== "against_press" && (
                  <TabsTrigger value="threats" className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Threats</span>
                  </TabsTrigger>
                )}

                <TabsTrigger
                  value="accountability"
                  className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2"
                >
                  <Scale className="h-4 w-4" />
                  <span className="hidden sm:inline">Accountability</span>
                </TabsTrigger>

                <TabsTrigger value="regional" className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
                  <MapIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Regional</span>
                </TabsTrigger>

                <TabsTrigger value="network" className="data-[state=active]:bg-card data-[state=active]:shadow-sm gap-2">
                  <Network className="h-4 w-4" />
                  <span className="hidden sm:inline">Network</span>
                </TabsTrigger>
              </TabsList>

              {/* Q1: Who is being targeted? (Context-aware) */}
              <TabsContent value="targets" className="mt-6">
                <TargetsAnalysis
                  data={filteredData}
                  selectedDirection={selectedDirection}
                />
              </TabsContent>

              {/* Q4: Who are the primary complainants? */}
              <TabsContent value="complainants" className="mt-6">
                <ComplainantsAnalysis data={filteredData} selectedDirection={selectedDirection} />
              </TabsContent>

              {/* Q2: Media organizations and journalists facing threats */}
              {/* Only render Threats content when direction is NOT 'against_press' */}
              {selectedDirection !== "against_press" && (
                <TabsContent value="threats" className="mt-6">
                  <ThreatsAnalysis data={filteredData} />
                </TabsContent>
              )}

              {/* Q5: Case outcomes and accountability */}
              <TabsContent value="accountability" className="mt-6">
                <AccountabilityAnalysis data={filteredData} />
              </TabsContent>

              {/* Q3: State-wise hotspots */}
              <TabsContent value="regional" className="mt-6">
                <RegionalAnalysis data={filteredData} onStateSelect={handleStateClick} />
              </TabsContent>

              {/* Network Analysis */}
              <TabsContent value="network" className="mt-6">
                <NetworkGraph data={filteredData} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="research">
            <ResearchFindings filters={filters} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
