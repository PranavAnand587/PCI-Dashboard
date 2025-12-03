"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileJson, FileSpreadsheet, Map } from "lucide-react"
import type { PCIComplaint } from "@/lib/types"

interface ExportPanelProps {
  data: PCIComplaint[]
}

export function ExportPanel({ data }: ExportPanelProps) {
  const handleExportJSON = () => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    downloadFile(blob, "pci-complaints-data.json")
  }

  const handleExportGeoJSON = () => {
    // State coordinates for India
    const stateCoords: Record<string, [number, number]> = {
      Maharashtra: [19.7515, 75.7139],
      Karnataka: [15.3173, 75.7139],
      "Tamil Nadu": [11.1271, 78.6569],
      "Uttar Pradesh": [26.8467, 80.9462],
      "West Bengal": [22.9868, 87.855],
      Delhi: [28.7041, 77.1025],
      Gujarat: [22.2587, 71.1924],
      Rajasthan: [27.0238, 74.2179],
      Bihar: [25.0961, 85.3131],
      Punjab: [31.1471, 75.3412],
      Haryana: [29.0588, 76.0856],
      Telangana: [18.1124, 79.0193],
      "Madhya Pradesh": [22.9734, 78.6569],
      Kerala: [10.8505, 76.2711],
      Odisha: [20.9517, 85.0985],
      "Andhra Pradesh": [15.9129, 79.74],
      Jharkhand: [23.6102, 85.2799],
      Assam: [26.2006, 92.9376],
      Chhattisgarh: [21.2787, 81.8661],
      Uttarakhand: [30.0668, 79.0193],
    }

    const features = data.map((item) => {
      const coords = stateCoords[item.state] || [20.5937, 78.9629]
      return {
        type: "Feature",
        properties: {
          id: item.id,
          state: item.state,
          complaintType: item.complaintType,
          decision: item.decision,
          year: item.year,
          complainant: item.complainant,
          against: item.against,
          direction: item.complaintDirection,
          complainantAffiliation: item.complainantAffiliation,
          accusedAffiliation: item.accusedAffiliation,
        },
        geometry: {
          type: "Point",
          coordinates: [coords[1], coords[0]], // GeoJSON uses [lng, lat]
        },
      }
    })

    const geojson = {
      type: "FeatureCollection",
      features,
    }

    const json = JSON.stringify(geojson, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    downloadFile(blob, "pci-complaints-geo.geojson")
  }

  const handleExportCSV = () => {
    if (data.length === 0) return

    const headers = [
      "id",
      "year",
      "date",
      "state",
      "complaintType",
      "decision",
      "complainant",
      "against",
      "complaintDirection",
      "complainantAffiliation",
      "accusedAffiliation",
      "gender",
    ]

    const csv = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = (row as any)[header]
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    downloadFile(blob, "pci-complaints-data.csv")
  }

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export ({data.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="h-4 w-4 mr-2 text-amber-600" />
          Export JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportGeoJSON}>
          <Map className="h-4 w-4 mr-2 text-blue-600" />
          Export GeoJSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
          Export CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
