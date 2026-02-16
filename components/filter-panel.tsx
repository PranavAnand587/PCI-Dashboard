"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { PCIComplaint } from "@/lib/types"
import type { FiltersResponse } from "@/lib/api"

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
  Check,
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
  const [complainantAffiliationSearch, setComplainantAffiliationSearch] = useState("")
  const [accusedAffiliationSearch, setAccusedAffiliationSearch] = useState("")
  const [decisionSearch, setDecisionSearch] = useState("")
  const [isExpanded, setIsExpanded] = useState(true)

  // Local state for deferred application
  const [localYears, setLocalYears] = useState<number[]>(selectedYears)
  const [localStates, setLocalStates] = useState<string[]>(selectedStates)
  const [localTypes, setLocalTypes] = useState<string[]>(selectedTypes)
  const [localDirection, setLocalDirection] = useState<"all" | "by_press" | "against_press">(selectedDirection)
  const [localAffiliations, setLocalAffiliations] = useState<string[]>(selectedAffiliations)
  const [localDecisions, setLocalDecisions] = useState<string[]>(selectedDecisions)

  // Sync local state when props change
  useEffect(() => {
    setLocalYears(selectedYears)
  }, [selectedYears])

  useEffect(() => {
    setLocalStates(selectedStates)
  }, [selectedStates])

  useEffect(() => {
    setLocalTypes(selectedTypes)
  }, [selectedTypes])

  useEffect(() => {
    setLocalDirection(selectedDirection)
  }, [selectedDirection])

  useEffect(() => {
    setLocalAffiliations(selectedAffiliations)
  }, [selectedAffiliations])

  useEffect(() => {
    setLocalDecisions(selectedDecisions)
  }, [selectedDecisions])


  // Calculate counts for items that exist in the data (for display purposes)
  const counts = useMemo(() => {
    const yearCounts = new Map<number, number>()
    const stateCounts = new Map<string, number>()
    const typeCounts = new Map<string, number>()
    const compAffCounts = new Map<string, number>()
    const accAffCounts = new Map<string, number>()
    const decCounts = new Map<string, number>()

    data.forEach((d) => {
      yearCounts.set(d.year, (yearCounts.get(d.year) || 0) + 1)
      stateCounts.set(d.state, (stateCounts.get(d.state) || 0) + 1)
      typeCounts.set(d.complaintType, (typeCounts.get(d.complaintType) || 0) + 1)

      if (d.complainantAffiliation) {
        compAffCounts.set(d.complainantAffiliation, (compAffCounts.get(d.complainantAffiliation) || 0) + 1)
      }
      if (d.accusedAffiliation) {
        accAffCounts.set(d.accusedAffiliation, (accAffCounts.get(d.accusedAffiliation) || 0) + 1)
      }

      decCounts.set(d.decision, (decCounts.get(d.decision) || 0) + 1)
    })

    return { yearCounts, stateCounts, typeCounts, compAffCounts, accAffCounts, decCounts }
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

  // Helper to filter bad affiliations
  const cleanAffiliation = (aff: string) => {
    const lower = aff.toLowerCase()
    return !!aff && aff !== "null" && lower !== "unknown" && lower !== "." && aff.trim().length > 1
  }

  // Split Affiliations Logic
  const complainantAffiliations = useMemo(() => {
    return Array.from(counts.compAffCounts.entries())
      .filter(([aff]) => cleanAffiliation(aff))
      .sort((a, b) => b[1] - a[1])
  }, [counts.compAffCounts])

  const accusedAffiliations = useMemo(() => {
    return Array.from(counts.accAffCounts.entries())
      .filter(([aff]) => cleanAffiliation(aff))
      .sort((a, b) => b[1] - a[1])
  }, [counts.accAffCounts])


  const decisions = useMemo(() => {
    const available = filters?.decisions || Array.from(counts.decCounts.keys())
    return available
      .map(d => [d, counts.decCounts.get(d) || 0] as [string, number])
      .sort((a, b) => b[1] - a[1])
  }, [filters, counts.decCounts])

  const filteredStates = states.filter(([s]) => s.toLowerCase().includes(stateSearch.toLowerCase()))
  const filteredTypes = types.filter(([t]) => t.toLowerCase().includes(typeSearch.toLowerCase()))
  const filteredComplainantAffiliations = complainantAffiliations.filter(([a]) => a.toLowerCase().includes(complainantAffiliationSearch.toLowerCase()))
  const filteredAccusedAffiliations = accusedAffiliations.filter(([a]) => a.toLowerCase().includes(accusedAffiliationSearch.toLowerCase()))
  const filteredDecisions = decisions.filter(([d]) => d.toLowerCase().includes(decisionSearch.toLowerCase()))

  // Toggles for Local State
  const toggleYear = (year: number) => {
    setLocalYears(prev => prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year])
  }

  const toggleState = (state: string) => {
    setLocalStates(prev => prev.includes(state) ? prev.filter((s) => s !== state) : [...prev, state])
  }

  const toggleType = (type: string) => {
    setLocalTypes(prev => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type])
  }

  const toggleAffiliation = (aff: string) => {
    setLocalAffiliations(prev => prev.includes(aff) ? prev.filter((a) => a !== aff) : [...prev, aff])
  }

  const toggleDecision = (dec: string) => {
    setLocalDecisions(prev => prev.includes(dec) ? prev.filter((d) => d !== dec) : [...prev, dec])
  }

  const handleYearRangeChange = (min: number | "", max: number | "") => {
    const allYears = years.map(([y]) => y)
    if (allYears.length === 0) return

    const minYear = Math.min(...allYears)
    const maxYear = Math.max(...allYears)

    // Treat empty as bounds
    const effectiveMin = min === "" ? minYear : min
    const effectiveMax = max === "" ? maxYear : max

    // Create range
    const newRange = allYears.filter((y) => y >= effectiveMin && y <= effectiveMax)
    setLocalYears(newRange)
  }

  // Apply Handler
  const handleApply = () => {
    onYearsChange(localYears)
    onStatesChange(localStates)
    onTypesChange(localTypes)
    onDirectionChange(localDirection)
    onAffiliationsChange(localAffiliations)
    onDecisionsChange(localDecisions)
  }

  const totalActiveFilters =
    localYears.length +
    localStates.length +
    localTypes.length +
    (localDirection !== "all" ? 1 : 0) +
    localAffiliations.length +
    localDecisions.length

  // FIX: Clone arrays before sorting to avoid mutation bugs causing missed updates
  const hasChanges =
    JSON.stringify([...localYears].sort()) !== JSON.stringify([...selectedYears].sort()) ||
    JSON.stringify([...localStates].sort()) !== JSON.stringify([...selectedStates].sort()) ||
    JSON.stringify([...localTypes].sort()) !== JSON.stringify([...selectedTypes].sort()) ||
    localDirection !== selectedDirection ||
    JSON.stringify([...localAffiliations].sort()) !== JSON.stringify([...selectedAffiliations].sort()) ||
    JSON.stringify([...localDecisions].sort()) !== JSON.stringify([...selectedDecisions].sort())


  // Derived min/max for Year Inputs
  const inputMinYear = localYears.length > 0 ? Math.min(...localYears) : (years.length > 0 ? Math.min(...years.map(y => y[0])) : "")
  const inputMaxYear = localYears.length > 0 ? Math.max(...localYears) : (years.length > 0 ? Math.max(...years.map(y => y[0])) : "")


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
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleApply()
                  }}
                  disabled={!hasChanges}
                  size="sm"
                  className="h-7 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Apply
                </Button>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>
            </div>
          </CollapsibleTrigger>

          {/* Active Filters Display */}
          {totalActiveFilters > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pb-3 border-b border-border">
              {localDirection !== "all" && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <ArrowLeftRight className="h-3 w-3" />
                  {localDirection === "by_press" ? "By Press" : "Against Press"}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      setLocalDirection("all")
                    }}
                  />
                </Badge>
              )}
              {/* Years badge */}
              {localYears.length > 0 && (() => {
                const min = Math.min(...localYears)
                const max = Math.max(...localYears)
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
                      onClick={(e) => {
                        e.stopPropagation()
                        setLocalYears([])
                      }}
                      aria-label="Clear year range"
                    />
                  </Badge>
                )
              })()}

              {localStates.map((state) => (
                <Badge
                  key={state}
                  variant="secondary"
                  className="text-xs gap-1 bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  <MapPin className="h-3 w-3" />
                  {state}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleState(state)
                    }}
                  />
                </Badge>
              ))}
              {localTypes.map((type) => (
                <Badge
                  key={type}
                  variant="secondary"
                  className="text-xs gap-1 bg-purple-50 text-purple-700 border-purple-200"
                >
                  <FileText className="h-3 w-3" />
                  {type}
                  <X className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" onClick={(e) => {
                    e.stopPropagation()
                    toggleType(type)
                  }} />
                </Badge>
              ))}
              {localAffiliations.map((aff) => (
                <Badge
                  key={aff}
                  variant="secondary"
                  className="text-xs gap-1 bg-amber-50 text-amber-700 border-amber-200"
                >
                  <Users className="h-3 w-3" />
                  {aff}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleAffiliation(aff)
                    }}
                  />
                </Badge>
              ))}
              {localDecisions.map((dec) => (
                <Badge key={dec} variant="secondary" className="text-xs gap-1 bg-red-50 text-red-700 border-red-200">
                  <Scale className="h-3 w-3" />
                  {dec}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleDecision(dec)
                    }}
                  />
                </Badge>
              ))}
            </div>
          )}

          <CollapsibleContent>
            {/* Filter Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mt-4">
              {/* Direction Filter - Reduced width */}
              <div className="space-y-2 col-span-1">
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
                      variant={localDirection === dir.value ? "default" : "outline"}
                      onClick={() => setLocalDirection(dir.value as any)}
                      className={`text-xs h-8 justify-start ${localDirection === dir.value ? "" : "text-muted-foreground"
                        }`}
                    >
                      {dir.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Years Filter (Input Range) - Reduced width */}
              <div className="space-y-2 col-span-1">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  Years
                </div>

                {(() => {
                  return (
                    <div className="px-1 flex flex-col gap-2">
                      <Input
                        type="number"
                        placeholder="From"
                        className="h-8 text-xs"
                        value={inputMinYear}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : ""
                          handleYearRangeChange(val, inputMaxYear)
                        }}
                      />
                      <div className="text-center text-muted-foreground text-[10px]">to</div>
                      <Input
                        type="number"
                        placeholder="To"
                        className="h-8 text-xs"
                        value={inputMaxYear}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : ""
                          handleYearRangeChange(inputMinYear, val)
                        }}
                      />
                    </div>
                  )
                })()}
              </div>


              {/* States Filter */}
              <div className="space-y-2 col-span-1">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  States
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
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
                          checked={localStates.includes(state)}
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
              <div className="space-y-2 col-span-1">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <FileText className="h-3.5 w-3.5 text-purple-600" />
                  Complaint Type
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
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
                          checked={localTypes.includes(type)}
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

              {/* Complainant Affiliations Filter */}
              <div className="space-y-2 col-span-1">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Users className="h-3.5 w-3.5 text-amber-600" />
                  Complainant Aff.
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={complainantAffiliationSearch}
                    onChange={(e) => setComplainantAffiliationSearch(e.target.value)}
                    className="h-8 text-xs pl-7"
                  />
                </div>
                <ScrollArea className="h-24">
                  <div className="space-y-1">
                    {filteredComplainantAffiliations.map(([aff, count]) => (
                      <label
                        key={aff}
                        className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      >
                        <Checkbox
                          checked={localAffiliations.includes(aff)}
                          onCheckedChange={() => toggleAffiliation(aff)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="flex-1 truncate">{aff}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Accused Affiliations Filter */}
              <div className="space-y-2 col-span-1">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Users className="h-3.5 w-3.5 text-red-600" />
                  Accused Aff.
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={accusedAffiliationSearch}
                    onChange={(e) => setAccusedAffiliationSearch(e.target.value)}
                    className="h-8 text-xs pl-7"
                  />
                </div>
                <ScrollArea className="h-24">
                  <div className="space-y-1">
                    {filteredAccusedAffiliations.map(([aff, count]) => (
                      <label
                        key={aff}
                        className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      >
                        <Checkbox
                          checked={localAffiliations.includes(aff)}
                          onCheckedChange={() => toggleAffiliation(aff)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="flex-1 truncate">{aff}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>


              {/* Decisions Filter (Hierarchical) */}
              <div className="space-y-2 col-span-1">
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
                            checked={localDecisions.includes(dec)}
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
