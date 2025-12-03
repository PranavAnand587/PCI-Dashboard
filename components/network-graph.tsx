"use client"

import type React from "react"

import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ZoomIn, ZoomOut, RotateCcw, Play, Pause, X } from "lucide-react"
import type { PCIComplaint } from "@/lib/types"

interface NetworkGraphProps {
  data: PCIComplaint[]
}

interface GraphNode {
  id: string
  label: string
  type: "media" | "state" | "affiliation"
  x: number
  y: number
  vx: number
  vy: number
  count: number
  color: string
  radius: number
}

interface GraphEdge {
  source: string
  target: string
  weight: number
}

export function NetworkGraph({ data }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Map<string, GraphNode>>(new Map())
  const edgesRef = useRef<GraphEdge[]>([])
  const animationRef = useRef<number | null>(null)

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isRunning, setIsRunning] = useState(true)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<"media-state" | "affiliation-state" | "media-affiliation">("media-state")
  const [repulsion, setRepulsion] = useState(50)
  const [linkStrength, setLinkStrength] = useState(30)

  const [dragging, setDragging] = useState<GraphNode | null>(null)
  const [panning, setPanning] = useState(false)
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 })

  // Build graph data based on view mode
  const buildGraph = useCallback(() => {
    const nodes = new Map<string, GraphNode>()
    const edgeMap = new Map<string, number>()

    const addNode = (id: string, type: GraphNode["type"], label: string) => {
      if (!nodes.has(id)) {
        const colors = {
          media: "#d97706",
          state: "#2563eb",
          affiliation: "#16a34a",
        }
        nodes.set(id, {
          id,
          label,
          type,
          x: Math.random() * 700 + 100,
          y: Math.random() * 500 + 75,
          vx: 0,
          vy: 0,
          count: 0,
          color: colors[type],
          radius: 8,
        })
      }
      const node = nodes.get(id)!
      node.count++
      node.radius = Math.min(25, 8 + node.count * 0.5)
    }

    const addEdge = (source: string, target: string) => {
      const key = [source, target].sort().join("||")
      edgeMap.set(key, (edgeMap.get(key) || 0) + 1)
    }

    data.forEach((d) => {
      if (viewMode === "media-state") {
        if (d.against) addNode(`media:${d.against}`, "media", d.against)
        addNode(`state:${d.state}`, "state", d.state)
        if (d.against) addEdge(`media:${d.against}`, `state:${d.state}`)
      } else if (viewMode === "affiliation-state") {
        addNode(`aff:${d.accusedAffiliation}`, "affiliation", d.accusedAffiliation)
        addNode(`state:${d.state}`, "state", d.state)
        addEdge(`aff:${d.accusedAffiliation}`, `state:${d.state}`)
      } else {
        if (d.against) addNode(`media:${d.against}`, "media", d.against)
        addNode(`aff:${d.accusedAffiliation}`, "affiliation", d.accusedAffiliation)
        if (d.against) addEdge(`media:${d.against}`, `aff:${d.accusedAffiliation}`)
      }
    })

    // Limit nodes for performance
    const sortedNodes = Array.from(nodes.entries()).sort((a, b) => b[1].count - a[1].count)
    const limitedNodes = new Map(sortedNodes.slice(0, 80))

    const edges: GraphEdge[] = []
    edgeMap.forEach((weight, key) => {
      const [source, target] = key.split("||")
      if (limitedNodes.has(source) && limitedNodes.has(target)) {
        edges.push({ source, target, weight })
      }
    })

    nodesRef.current = limitedNodes
    edgesRef.current = edges
  }, [data, viewMode])

  useEffect(() => {
    buildGraph()
  }, [buildGraph])

  // Physics simulation
  const simulate = useCallback(() => {
    const nodes = nodesRef.current
    const edges = edgesRef.current
    const width = 900
    const height = 650

    // Apply forces
    nodes.forEach((node) => {
      // Repulsion from other nodes
      nodes.forEach((other) => {
        if (node.id === other.id) return
        const dx = node.x - other.x
        const dy = node.y - other.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (repulsion * 100) / (dist * dist)
        node.vx += (dx / dist) * force * 0.01
        node.vy += (dy / dist) * force * 0.01
      })

      // Center gravity
      node.vx += (width / 2 - node.x) * 0.001
      node.vy += (height / 2 - node.y) * 0.001
    })

    // Link attraction
    edges.forEach((edge) => {
      const source = nodes.get(edge.source)
      const target = nodes.get(edge.target)
      if (!source || !target) return

      const dx = target.x - source.x
      const dy = target.y - source.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const force = (dist - 100) * (linkStrength / 1000)

      source.vx += (dx / dist) * force
      source.vy += (dy / dist) * force
      target.vx -= (dx / dist) * force
      target.vy -= (dy / dist) * force
    })

    // Apply velocity with damping
    nodes.forEach((node) => {
      if (dragging?.id === node.id) return
      node.vx *= 0.85
      node.vy *= 0.85
      node.x += node.vx
      node.y += node.vy

      // Bounds
      node.x = Math.max(50, Math.min(width - 50, node.x))
      node.y = Math.max(50, Math.min(height - 50, node.y))
    })
  }, [repulsion, linkStrength, dragging])

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    const nodes = nodesRef.current
    const edges = edgesRef.current

    // Draw edges
    edges.forEach((edge) => {
      const source = nodes.get(edge.source)
      const target = nodes.get(edge.target)
      if (!source || !target) return

      const isHighlighted = highlightedEdges.has(`${edge.source}||${edge.target}`)
      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      ctx.strokeStyle = isHighlighted ? "#2563eb" : "#cbd5e1"
      ctx.lineWidth = isHighlighted ? 2 : Math.min(3, 0.5 + edge.weight * 0.2)
      ctx.globalAlpha = isHighlighted ? 1 : 0.4
      ctx.stroke()
      ctx.globalAlpha = 1
    })

    // Draw nodes
    nodes.forEach((node) => {
      const isSelected = selectedNode?.id === node.id

      // Shadow for selected
      if (isSelected) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2)
        ctx.fillStyle = node.color + "40"
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
      ctx.fillStyle = node.color
      ctx.fill()
      ctx.strokeStyle = isSelected ? "#0f172a" : "#ffffff"
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.stroke()

      // Label for larger nodes or selected
      if (node.radius > 12 || isSelected) {
        ctx.font = "10px system-ui"
        ctx.fillStyle = "#1e293b"
        ctx.textAlign = "center"
        ctx.fillText(node.label.slice(0, 15), node.x, node.y + node.radius + 12)
      }
    })

    ctx.restore()

    if (isRunning) {
      simulate()
    }
    animationRef.current = requestAnimationFrame(render)
  }, [zoom, pan, isRunning, simulate, selectedNode, highlightedEdges])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [render])

  // Mouse handlers
  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    }
  }

  const findNodeAt = (x: number, y: number) => {
    for (const node of nodesRef.current.values()) {
      const dx = node.x - x
      const dy = node.y - y
      if (dx * dx + dy * dy < node.radius * node.radius) {
        return node
      }
    }
    return null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e)
    const node = findNodeAt(pos.x, pos.y)

    if (e.button === 2 || (e.button === 0 && !node)) {
      setPanning(true)
      setLastMouse({ x: e.clientX, y: e.clientY })
    } else if (node) {
      setDragging(node)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (panning) {
      setPan({
        x: pan.x + (e.clientX - lastMouse.x),
        y: pan.y + (e.clientY - lastMouse.y),
      })
      setLastMouse({ x: e.clientX, y: e.clientY })
    } else if (dragging) {
      const pos = getMousePos(e)
      dragging.x = pos.x
      dragging.y = pos.y
      dragging.vx = 0
      dragging.vy = 0
    }
  }

  const handleMouseUp = () => {
    setDragging(null)
    setPanning(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (panning || dragging) return
    const pos = getMousePos(e)
    const node = findNodeAt(pos.x, pos.y)

    if (node) {
      setSelectedNode(node)
      const highlighted = new Set<string>()
      edgesRef.current.forEach((edge) => {
        if (edge.source === node.id || edge.target === node.id) {
          highlighted.add(`${edge.source}||${edge.target}`)
        }
      })
      setHighlightedEdges(highlighted)
    } else {
      setSelectedNode(null)
      setHighlightedEdges(new Set())
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(Math.min(3, Math.max(0.3, zoom * delta)))
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const connectedNodes = useMemo(() => {
    if (!selectedNode) return []
    return edgesRef.current
      .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
      .map((e) => ({
        node: nodesRef.current.get(e.source === selectedNode.id ? e.target : e.source),
        weight: e.weight,
      }))
      .sort((a, b) => b.weight - a.weight)
  }, [selectedNode])

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base text-foreground">Network Analysis</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Drag nodes, scroll to zoom, right-click to pan
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="media-state">Media - State</SelectItem>
                <SelectItem value="affiliation-state">Affiliation - State</SelectItem>
                <SelectItem value="media-affiliation">Media - Affiliation</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant={isRunning ? "default" : "outline"}
              onClick={() => setIsRunning(!isRunning)}
              className="h-8 w-8 p-0"
            >
              {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <canvas
              ref={canvasRef}
              width={900}
              height={650}
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleClick}
              onWheel={handleWheel}
              onContextMenu={(e) => e.preventDefault()}
              className="border border-border rounded-lg w-full bg-secondary/30 cursor-crosshair"
            />

            {/* Controls */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7"
                onClick={() => setZoom(Math.min(3, zoom * 1.3))}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7"
                onClick={() => setZoom(Math.max(0.3, zoom * 0.7))}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="secondary" className="h-7 w-7" onClick={resetView}>
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="absolute top-3 right-3 bg-card/90 px-2 py-1 rounded text-xs text-foreground border border-border">
              {(zoom * 100).toFixed(0)}%
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-card/90 p-2 rounded text-xs space-y-1 border border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-600" />
                <span className="text-foreground">Media</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-foreground">State</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-600" />
                <span className="text-foreground">Affiliation</span>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-56 space-y-4">
            {/* Physics Controls */}
            <div className="bg-secondary/50 rounded-lg p-3 space-y-3">
              <h4 className="text-xs font-medium text-foreground">Physics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Repulsion</span>
                  <span>{repulsion}</span>
                </div>
                <Slider value={[repulsion]} onValueChange={(v) => setRepulsion(v[0])} min={10} max={100} step={5} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Link Strength</span>
                  <span>{linkStrength}</span>
                </div>
                <Slider
                  value={[linkStrength]}
                  onValueChange={(v) => setLinkStrength(v[0])}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
            </div>

            {/* Selected Node Info */}
            {selectedNode && (
              <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-foreground">Selected Node</h4>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5"
                    onClick={() => {
                      setSelectedNode(null)
                      setHighlightedEdges(new Set())
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{selectedNode.label}</p>
                  <Badge
                    className="text-xs"
                    style={{ backgroundColor: selectedNode.color + "20", color: selectedNode.color }}
                  >
                    {selectedNode.type}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{selectedNode.count} complaints</p>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Connected to:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {connectedNodes.slice(0, 8).map(({ node, weight }) => (
                      <div key={node?.id} className="flex justify-between text-xs">
                        <span className="text-foreground truncate flex-1">{node?.label}</span>
                        <Badge variant="outline" className="text-xs ml-2">
                          {weight}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
              <h4 className="text-xs font-medium text-foreground">Graph Stats</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Nodes</p>
                  <p className="text-foreground font-medium">{nodesRef.current.size}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Edges</p>
                  <p className="text-foreground font-medium">{edgesRef.current.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
