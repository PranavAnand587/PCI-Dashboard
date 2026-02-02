"use client"

import { useState, useMemo, useEffect } from "react"
import { fetchAllComplaints } from "@/lib/data-loader"
import { getFilters, type FiltersResponse } from "@/lib/api"
import type { PCIComplaint } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DisclaimerModal } from "@/components/disclaimer-modal"
import { Target, Users, Scale, TrendingUp, Filter, MapIcon, Loader2, RefreshCw, AlertTriangle, Info } from "lucide-react"

// Components
import { FilterPanel } from "@/components/filter-panel"
import { StatisticsPanel } from "@/components/statistics-panel"
import { IndiaMap } from "@/components/india-map"
import { TargetsAnalysis } from "@/components/targets-analysis"
import { ComplainantsAnalysis } from "@/components/complainants-analysis"
import { ThreatsAnalysis } from "@/components/threats-analysis"
import { AccountabilityAnalysis } from "@/components/accountability-analysis"
import { RegionalAnalysis } from "@/components/regional-analysis"
// import { NetworkGraph } from "@/components/network-graph"
import { ExportPanel } from "@/components/export-panel"
import { ResearchFindings } from "@/components/research-findings"

export default function Dashboard() {
  const [allData, setAllData] = useState<PCIComplaint[]>([])
  const [filters, setFilters] = useState<FiltersResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDisclaimer, setShowDisclaimer] = useState(true)

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

  // If the user switches to anything other than 'by_press', hide the threats tab and ensure activeView isn't 'threats'
  useEffect(() => {
    if (selectedDirection !== "by_press" && activeView === "threats") {
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md space-y-8 text-center relative z-10">
          <div className="relative flex justify-center mb-8">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/10 duration-2000"></div>
            <div className="relative bg-card rounded-full p-6 ring-1 ring-border shadow-xl">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Initializing Analytics Engine</h3>
            <div className="flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
              <span className="animate-pulse duration-1000">Loading Historical PCI Records (1990-2023)...</span>
              <span className="text-xs opacity-70">Verifying Data Integrity & Relations</span>
            </div>
          </div>

          {/* Progress Bar Simulation */}
          <div className="w-full bg-secondary/50 h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary/80 h-full w-1/2 animate-[translateX_1.5s_ease-in-out_infinite] rounded-full"></div>
          </div>

          <div className="pt-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/30 rounded-full border border-border/50 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              Beta Version 1.0
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (

      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-card border border-destructive/20 shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-destructive/5 p-8 flex flex-col items-center text-center border-b border-destructive/10">
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4 text-destructive ring-1 ring-destructive/20">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Connection Error</h2>
            <p className="text-sm text-destructive/80 font-medium mt-1">Unable to Retrieve Analytics Data</p>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              The dashboard could not establish a secure connection with the backend data services. This might be due to local server unavailability or network interruptions.
            </p>

            <div className="bg-secondary/30 rounded-lg p-4 border border-border/60">
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                <Info className="h-3 w-3" /> Technical Diagnostic:
              </p>
              <code className="text-xs font-mono text-destructive break-all block">{error}</code>
            </div>

            <div className="text-xs text-muted-foreground/60 text-center">
              Please ensure the backend server is running on <span className="font-mono">port 8000</span>
            </div>
          </div>

          <div className="p-6 pt-0">
            <Button
              onClick={() => window.location.reload()}
              className="w-full gap-2"
              size="lg"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    )

  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DisclaimerModal isOpen={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowDisclaimer(true)}
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900/30 dark:hover:bg-red-950/30 transition-all hover:scale-105"
                title="View Data Disclaimer & Beta Info"
              >
                <Info className="h-5 w-5" />
                <span className="sr-only">Disclaimer</span>
              </Button>
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

                {/* Only render the Threats tab if direction is 'by_press' */}
                {selectedDirection === "by_press" && (
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
              {/* Only render Threats content when direction is 'by_press' */}
              {selectedDirection === "by_press" && (
                <TabsContent value="threats" className="mt-6">
                  <ThreatsAnalysis data={filteredData} />
                </TabsContent>
              )}

              {/* Q5: Case outcomes and accountability */}
              <TabsContent value="accountability" className="mt-6">
                <AccountabilityAnalysis data={filteredData} selectedDirection={selectedDirection} />
              </TabsContent>

              {/* Q3: State-wise hotspots */}
              <TabsContent value="regional" className="mt-6">
                <RegionalAnalysis data={filteredData} onStateSelect={handleStateClick} />
              </TabsContent>

              {/* Network Analysis */}
              {/* <TabsContent value="network" className="mt-6">
                <NetworkGraph data={filteredData} />
              </TabsContent> */}
            </Tabs>
          </TabsContent>

          <TabsContent value="research">
            <ResearchFindings filters={filters} />
          </TabsContent>
        </Tabs>
      </main >
    </div >
  )
}
