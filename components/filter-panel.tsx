"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { PCIComplaint } from "@/lib/types"
import type { FiltersResponse } from "@/lib/api"
import { Slider } from "@/components/ui/slider"

import {
  X,
  Filter,
  RotateCcw,
  Calendar,
  MapPin,
  FileText,
  Users,
  Scale,
  ArrowLeftRight,
  ChevronDown,
  Search,
} from "lucide-react"

interface FilterPanelProps {
  data: PCIComplaint[]
  filters: FiltersResponse | null
  selectedYears: number[]
  selectedStates: string[]
  selectedTypes: string[]
  selectedDirection: "all" | "by_press" | "against_press"
  selectedAffiliations: string[]
  selectedDecisions: string[]
  onYearsChange: (years: number[]) => void
  onStatesChange: (states: string[]) => void
  onTypesChange: (types: string[]) => void
  onDirectionChange: (direction: "all" | "by_press" | "against_press") => void
  onAffiliationsChange: (affiliations: string[]) => void
  onDecisionsChange: (decisions: string[]) => void
  onClearAll: () => void
}

export function FilterPanel({
  data,
  filters,
  selectedYears,
  selectedStates,
  selectedTypes,
  selectedDirection,
  selectedAffiliations,
  selectedDecisions,
  onYearsChange,
  onStatesChange,
  onTypesChange,
  onDirectionChange,
  onAffiliationsChange,
  onDecisionsChange,
  onClearAll,
}: FilterPanelProps) {
  const [stateSearch, setStateSearch] = useState("")
  const [typeSearch, setTypeSearch] = useState("")
  const [affiliationSearch, setAffiliationSearch] = useState("")
  const [decisionSearch, setDecisionSearch] = useState("")
  const [isExpanded, setIsExpanded] = useState(true)

  // Calculate counts for items that exist in the data (for display purposes)
  const counts = useMemo(() => {
    const yearCounts = new Map<number, number>()
    const stateCounts = new Map<string, number>()
    const typeCounts = new Map<string, number>()
    const affCounts = new Map<string, number>()
    const decCounts = new Map<string, number>()

    data.forEach((d) => {
      yearCounts.set(d.year, (yearCounts.get(d.year) || 0) + 1)
      stateCounts.set(d.state, (stateCounts.get(d.state) || 0) + 1)
      typeCounts.set(d.complaintType, (typeCounts.get(d.complaintType) || 0) + 1)
      affCounts.set(d.complainantAffiliation, (affCounts.get(d.complainantAffiliation) || 0) + 1)
      affCounts.set(d.accusedAffiliation, (affCounts.get(d.accusedAffiliation) || 0) + 1)
      decCounts.set(d.decision, (decCounts.get(d.decision) || 0) + 1)
    })

    return { yearCounts, stateCounts, typeCounts, affCounts, decCounts }
  }, [data])

  // Use backend filters as source of truth, fallback to derived from data if not loaded
  const years = useMemo(() => {
    if (filters?.years) {
      return filters.years.map(y => [y, counts.yearCounts.get(y) || 0] as [number, number])
    }
    return Array.from(counts.yearCounts.entries()).sort((a, b) => b[0] - a[0])
  }, [filters, counts.yearCounts])

  const states = useMemo(() => {
    if (filters?.states) {
      return filters.states.map(s => [s, counts.stateCounts.get(s) || 0] as [string, number]).sort((a, b) => b[1] - a[1])
    }
    return Array.from(counts.stateCounts.entries()).sort((a, b) => b[1] - a[1])
  }, [filters, counts.stateCounts])

  const types = useMemo(() => {
    if (filters?.complaint_types) {
      return filters.complaint_types.map(t => [t, counts.typeCounts.get(t) || 0] as [string, number]).sort((a, b) => b[1] - a[1])
    }
    return Array.from(counts.typeCounts.entries()).sort((a, b) => b[1] - a[1])
  }, [filters, counts.typeCounts])

  const affiliations = useMemo(() => {
    let list: [string, number][] = []
    if (filters?.affiliations) {
      list = filters.affiliations.map(a => [a, counts.affCounts.get(a) || 0] as [string, number]).sort((a, b) => b[1] - a[1])
    } else {
      list = Array.from(counts.affCounts.entries()).sort((a, b) => b[1] - a[1])
    }

    // Filter out government/police affiliations if direction is 'by_press'
    if (selectedDirection === "by_press") {
      const suspiciousKeywords = [
        "police", "govt", "government", "administration", "officer",
        "superintendent", "inspector", "commissioner", "constable",
        "station house officer", "sho", "dm", "sdm", "collector",
        "magistrate", "ministry", "department", "panchayat", "municipality"
      ]

      return list.filter(([aff]) => {
        const lowerAff = aff.toLowerCase()
        return !suspiciousKeywords.some(keyword => lowerAff.includes(keyword))
      })
    }

    return list
  }, [filters, counts.affCounts, selectedDirection])


  const decisions = useMemo(() => {
    const available = filters?.decisions || Array.from(counts.decCounts.keys())
    return available
      .map(d => [d, counts.decCounts.get(d) || 0] as [string, number])
      .sort((a, b) => b[1] - a[1])
  }, [filters, counts.decCounts])

  const filteredStates = states.filter(([s]) => s.toLowerCase().includes(stateSearch.toLowerCase()))
  const filteredTypes = types.filter(([t]) => t.toLowerCase().includes(typeSearch.toLowerCase()))
  const filteredAffiliations = affiliations.filter(([a]) => a.toLowerCase().includes(affiliationSearch.toLowerCase()))
  const filteredDecisions = decisions.filter(([d]) => d.toLowerCase().includes(decisionSearch.toLowerCase()))

  const toggleYear = (year: number) => {
    onYearsChange(selectedYears.includes(year) ? selectedYears.filter((y) => y !== year) : [...selectedYears, year])
  }

  const toggleState = (state: string) => {
    onStatesChange(
      selectedStates.includes(state) ? selectedStates.filter((s) => s !== state) : [...selectedStates, state],
    )
  }

  const toggleType = (type: string) => {
    onTypesChange(selectedTypes.includes(type) ? selectedTypes.filter((t) => t !== type) : [...selectedTypes, type])
  }

  const toggleAffiliation = (aff: string) => {
    onAffiliationsChange(
      selectedAffiliations.includes(aff)
        ? selectedAffiliations.filter((a) => a !== aff)
        : [...selectedAffiliations, aff],
    )
  }

  const toggleDecision = (dec: string) => {
    onDecisionsChange(
      selectedDecisions.includes(dec) ? selectedDecisions.filter((d) => d !== dec) : [...selectedDecisions, dec],
    )
  }

  const totalActiveFilters =
    selectedYears.length +
    selectedStates.length +
    selectedTypes.length +
    (selectedDirection !== "all" ? 1 : 0) +
    selectedAffiliations.length +
    selectedDecisions.length

  return (
    <Card className="bg-card border-border">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardContent className="pt-4 pb-4">
          {/* Header */}
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-secondary/50 -mx-2 px-2 py-1 rounded-md transition-colors">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Filters</span>
                {totalActiveFilters > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    {totalActiveFilters} active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {totalActiveFilters > 0 && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      onClearAll()
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>
            </div>
          </CollapsibleTrigger>

          {/* Active Filters Display */}
          {totalActiveFilters > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pb-3 border-b border-border">
              {selectedDirection !== "all" && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <ArrowLeftRight className="h-3 w-3" />
                  {selectedDirection === "by_press" ? "By Press" : "Against Press"}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                    onClick={() => onDirectionChange("all")}
                  />
                </Badge>
              )}
              {/* Years badge: show a single chip for the selected range (or single year) */}
              {selectedYears.length > 0 && (() => {
                const min = Math.min(...selectedYears)
                const max = Math.max(...selectedYears)
                const label = min === max ? String(min) : `${min}-${max}`

                return (
                  <Badge
                    key={`years-${min}-${max}`}
                    variant="secondary"
                    className="text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <Calendar className="h-3 w-3" />
                    {label}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                      onClick={() => onYearsChange([])}
                      aria-label="Clear year range"
                    />
                  </Badge>
                )
              })()}

              {selectedStates.map((state) => (
                <Badge
                  key={state}
                  variant="secondary"
                  className="text-xs gap-1 bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  <MapPin className="h-3 w-3" />
                  {state}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                    onClick={() => toggleState(state)}
                  />
                </Badge>
              ))}
              {selectedTypes.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="text-xs gap-1 bg-purple-50 text-purple-700 border-purple-200"
                >
                  <FileText className="h-3 w-3" />
                  {type}
                  <X className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" onClick={() => toggleType(type)} />
                </Badge>
              ))}
              {selectedAffiliations.map((aff) => (
                <Badge
                  key={aff}
                  variant="secondary"
                  className="text-xs gap-1 bg-amber-50 text-amber-700 border-amber-200"
                >
                  <Users className="h-3 w-3" />
                  {aff}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                    onClick={() => toggleAffiliation(aff)}
                  />
                </Badge>
              ))}
              {selectedDecisions.map((dec) => (
                <Badge key={dec} variant="secondary" className="text-xs gap-1 bg-red-50 text-red-700 border-red-200">
                  <Scale className="h-3 w-3" />
                  {dec}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                    onClick={() => toggleDecision(dec)}
                  />
                </Badge>
              ))}
            </div>
          )}

          <CollapsibleContent>
            {/* Filter Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-4">
              {/* Direction Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
                  Direction
                </div>
                <div className="flex flex-col gap-1">
                  {[
                    { value: "all", label: "All Complaints" },
                    { value: "by_press", label: "By Press (Threats)" },
                    { value: "against_press", label: "Against Press" },
                  ].map((dir) => (
                    <Button
                      key={dir.value}
                      size="sm"
                      variant={selectedDirection === dir.value ? "default" : "outline"}
                      onClick={() => onDirectionChange(dir.value as any)}
                      className={`text-xs h-8 justify-start ${selectedDirection === dir.value ? "" : "text-muted-foreground"
                        }`}
                    >
                      {dir.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Years Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  Years
                </div>

                {(() => {
                  const allYears = years.map(([y]) => y)
                  if (allYears.length === 0) return null

                  const minYear = Math.min(...allYears)
                  const maxYear = Math.max(...allYears)

                  const currentMin = selectedYears.length > 0 ? Math.min(...selectedYears) : minYear
                  const currentMax = selectedYears.length > 0 ? Math.max(...selectedYears) : maxYear

                  return (
                    <div className="px-2">
                      <Slider
                        min={minYear}
                        max={maxYear}
                        step={1}
                        value={[currentMin, currentMax]}
                        onValueChange={([minVal, maxVal]) => {
                          const newRange = allYears.filter((y) => y >= minVal && y <= maxVal)
                          if (newRange.length === allYears.length) {
                            onYearsChange([])
                          } else {
                            onYearsChange(newRange)
                          }
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>{currentMin}</span>
                        <span>{currentMax}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>


              {/* States Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  States
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search states..."
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    className="h-8 text-xs pl-7"
                  />
                </div>
                <ScrollArea className="h-24">
                  <div className="space-y-1">
                    {filteredStates.map(([state, count]) => (
                      <label
                        key={state}
                        className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      >
                        <Checkbox
                          checked={selectedStates.includes(state)}
                          onCheckedChange={() => toggleState(state)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="flex-1 truncate">{state}</span>
                        <span className="text-muted-foreground/60">{count}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Types Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <FileText className="h-3.5 w-3.5 text-purple-600" />
                  Complaint Type
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search types..."
                    value={typeSearch}
                    onChange={(e) => setTypeSearch(e.target.value)}
                    className="h-8 text-xs pl-7"
                  />
                </div>
                <ScrollArea className="h-24">
                  <div className="space-y-1">
                    {filteredTypes.map(([type, count]) => (
                      <label
                        key={type}
                        className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      >
                        <Checkbox
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => toggleType(type)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="flex-1 truncate">{type}</span>
                        <span className="text-muted-foreground/60">{count}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Affiliations Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Users className="h-3.5 w-3.5 text-amber-600" />
                  Affiliations
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={affiliationSearch}
                    onChange={(e) => setAffiliationSearch(e.target.value)}
                    className="h-8 text-xs pl-7"
                  />
                </div>
                <ScrollArea className="h-24">
                  <div className="space-y-1">
                    {filteredAffiliations.map(([aff, count]) => (
                      <label
                        key={aff}
                        className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      >
                        <Checkbox
                          checked={selectedAffiliations.includes(aff)}
                          onCheckedChange={() => toggleAffiliation(aff)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="flex-1 truncate">{aff}</span>
                        <span className="text-muted-foreground/60">{count}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>


              {/* Decisions Filter (Hierarchical) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Scale className="h-3.5 w-3.5 text-red-600" />
                  Decision
                </div>

                {/* Specific Decision Filter */}
                <div>
                  <div className="relative mb-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={decisionSearch}
                      onChange={(e) => setDecisionSearch(e.target.value)}
                      className="h-8 text-xs pl-7"
                    />
                  </div>
                  <ScrollArea className="h-24">
                    <div className="space-y-1">
                      {filteredDecisions.map(([dec, count]) => (
                        <label
                          key={dec}
                          className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        >
                          <Checkbox
                            checked={selectedDecisions.includes(dec)}
                            onCheckedChange={() => toggleDecision(dec)}
                            className="h-3.5 w-3.5"
                          />
                          <span className="flex-1 truncate">{dec}</span>
                          <span className="text-muted-foreground/60">{count}</span>
                        </label>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

              </div>


            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  )
}
