"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw, Info } from "lucide-react"
import { useIndiaGeoJSON } from "@/lib/use-india-geojson"
import { MapSkeleton } from "./map-skeleton"
import { geoMercator, geoPath } from "d3-geo"

interface IndiaMapProps {
  stateData: { state: string; count: number; byPress?: number; againstPress?: number }[]
  onStateClick: (state: string) => void
  selectedState: string | null
  direction: "all" | "by" | "against"
}

export function IndiaMap({ stateData, onStateClick, selectedState, direction }: IndiaMapProps) {
  const { data: geoData, loading, error } = useIndiaGeoJSON()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; state: string; data: any } | null>(null)

  // Setup projection
  const projection = useMemo(() => {
    return geoMercator()
      .center([82, 23]) // Center of India
      .scale(1000) // Initial scale
      .translate([350, 350]) // Center in 700x700 viewBox
  }, [])

  const pathGenerator = useMemo(() => {
    return geoPath().projection(projection)
  }, [projection])

  // Get max count for color scaling
  const maxCount = Math.max(...stateData.map((s) => s.count), 1)

  // Get state data by name (fuzzy matching could be added here)
  const getStateData = useCallback(
    (stateName: string) => {
      if (!stateName) return undefined
      return stateData.find((s) =>
        s.state.toLowerCase() === stateName.toLowerCase() ||
        s.state.toLowerCase().includes(stateName.toLowerCase()) ||
        stateName.toLowerCase().includes(s.state.toLowerCase())
      )
    },
    [stateData],
  )

  // Color scale based on complaint count
  const getStateColor = useCallback(
    (stateName: string) => {
      const data = getStateData(stateName)
      if (!data) return "rgb(241, 245, 249)" // slate-100

      const intensity = data.count / maxCount
      // Blue gradient for light mode
      const r = Math.round(219 - intensity * 180)
      const g = Math.round(234 - intensity * 130)
      const b = Math.round(254 - intensity * 50)
      return `rgb(${r}, ${g}, ${b})`
    },
    [getStateData, maxCount],
  )

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((prev) => Math.min(Math.max(prev * delta, 0.5), 8))
  }, [])

  // Handle pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setIsPanning(true)
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      }
    },
    [pan],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
      }

      // Update tooltip position
      if (hoveredState && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setTooltip((prev) => (prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : null))
      }
    },
    [isPanning, panStart, hoveredState],
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Handle state hover
  const handleStateHover = useCallback(
    (stateName: string, e: React.MouseEvent) => {
      setHoveredState(stateName)
      const data = getStateData(stateName)
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setTooltip({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          state: stateName,
          data: data || { count: 0 },
        })
      }
    },
    [getStateData],
  )

  const handleStateLeave = useCallback(() => {
    setHoveredState(null)
    setTooltip(null)
  }, [])

  // Attach wheel event
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false })
      return () => container.removeEventListener("wheel", handleWheel)
    }
  }, [handleWheel])

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  if (loading) return <MapSkeleton />

  if (error) {
    return (
      <Card className="bg-card border-border h-[500px] flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Failed to load map data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </Card>
    )
  }

  const directionLabel =
    direction === "by" ? "Threats to Press" : direction === "against" ? "Against Press" : "All Complaints"

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-foreground">India Complaints Map</CardTitle>
            <CardDescription className="text-muted-foreground">
              Click on a state to filter data. Showing: {directionLabel}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => setZoom((z) => Math.min(z * 1.2, 8))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => setZoom((z) => Math.max(z / 1.2, 0.5))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={resetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Badge variant="secondary" className="text-xs">
              {Math.round(zoom * 100)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="relative w-full h-[500px] bg-secondary/30 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 700 700"
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center",
              transition: isPanning ? "none" : "transform 0.1s ease-out",
            }}
          >
            {/* Map outline */}
            <rect x="0" y="0" width="700" height="700" fill="transparent" />

            {/* States from GeoJSON */}
            {geoData?.map((feature, index) => {
              // Try to find name in properties
              const name = feature.properties.st_nm || feature.properties.name || feature.properties.NAME_1 || "Unknown"
              const path = pathGenerator(feature)

              if (!path) return null

              const isHovered = hoveredState === name
              const isSelected = selectedState === name
              const stateInfo = getStateData(name)
              const centroid = projection(feature.geometry.coordinates ?
                // Simple centroid approx if needed, but d3.geoCentroid is better if imported
                // For now, let's skip labels or use a simplified approach if needed
                [0, 0] : [0, 0]
              )

              return (
                <g key={`${name}-${index}`}>
                  <path
                    d={path}
                    fill={getStateColor(name)}
                    stroke={isSelected ? "rgb(37, 99, 235)" : isHovered ? "rgb(59, 130, 246)" : "rgb(148, 163, 184)"}
                    strokeWidth={isSelected ? 1.5 / zoom : isHovered ? 1 / zoom : 0.5 / zoom}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={(e) => handleStateHover(name, e)}
                    onMouseLeave={handleStateLeave}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStateClick(name)
                    }}
                    style={{
                      filter: isHovered || isSelected ? "brightness(0.95)" : "none",
                      vectorEffect: "non-scaling-stroke"
                    }}
                  />
                </g>
              )
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute pointer-events-none z-50 bg-card border border-border rounded-lg shadow-lg p-3 min-w-[180px]"
              style={{
                left: tooltip.x + 15,
                top: tooltip.y + 15,
                transform: tooltip.x > 400 ? "translateX(-110%)" : "none",
              }}
            >
              <p className="font-semibold text-foreground text-sm">{tooltip.state}</p>
              <div className="mt-2 space-y-1 text-xs">
                <p className="text-muted-foreground">
                  Total: <span className="text-foreground font-medium">{tooltip.data.count || 0}</span>
                </p>
                {tooltip.data.byPress !== undefined && (
                  <p className="text-blue-600">
                    By Press: <span className="font-medium">{tooltip.data.byPress}</span>
                  </p>
                )}
                {tooltip.data.againstPress !== undefined && (
                  <p className="text-amber-600">
                    Against Press: <span className="font-medium">{tooltip.data.againstPress}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur border border-border rounded-lg p-3 shadow-sm">
            <p className="text-xs font-medium text-foreground mb-2">Complaint Density</p>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ background: "rgb(241, 245, 249)" }} />
              <div className="w-4 h-4 rounded" style={{ background: "rgb(191, 219, 254)" }} />
              <div className="w-4 h-4 rounded" style={{ background: "rgb(147, 197, 253)" }} />
              <div className="w-4 h-4 rounded" style={{ background: "rgb(96, 165, 250)" }} />
              <div className="w-4 h-4 rounded" style={{ background: "rgb(59, 130, 246)" }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-muted-foreground bg-card/80 backdrop-blur px-2 py-1 rounded">
            <Info className="h-3 w-3" />
            Scroll to zoom, drag to pan
          </div>
        </div>

        {/* Selected State Info */}
        {selectedState && (
          <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{selectedState} selected</p>
                <p className="text-sm text-muted-foreground">{getStateData(selectedState)?.count || 0} complaints</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onStateClick("")}>
                Clear selection
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
