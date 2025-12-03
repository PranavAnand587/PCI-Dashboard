const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export type TableType = "against" | "by"

export interface Complaint {
  Complainant: string
  Against: string
  Complaint: string
  ComplaintType: string
  Decision: string
  Date: string
  State: string
  ReportName: string
  Locations_Mapped: string
  c_name_resolved: string
  a_name_resolved: string
  c_aff_resolved: string
  a_aff_resolved: string
  Press: string
}

export interface ComplaintStats {
  total_complaints: number
  yearly_distribution: { year: string; count: number }[]
}

export interface StateCount {
  state: string
  count: number
}

export interface MediaCount {
  press: string
  count: number
}

export interface MediaTrend {
  year: string
  count: number
}

export interface WordCloudItem {
  text: string
  value: number
}

export interface NetworkData {
  nodes: { id: string }[]
  links: { source: string; target: string; type: string }[]
}

export interface FiltersResponse {
  years: number[]
  states: string[]
  complaint_types: string[]
  affiliations: string[]
  decisions: string[]
}

// API Functions
export async function getFilters(): Promise<FiltersResponse> {
  const res = await fetch(`${API_BASE_URL}/complaints/filters`)
  if (!res.ok) throw new Error("Failed to fetch filters")
  return res.json()
}
export async function getComplaintsList(params: {
  table: TableType
  state?: string
  start_year?: number
  end_year?: number
}): Promise<{ data: Complaint[] }> {
  const searchParams = new URLSearchParams()
  searchParams.set("table", params.table)
  if (params.state) searchParams.set("state", params.state)
  if (params.start_year) searchParams.set("start_year", params.start_year.toString())
  if (params.end_year) searchParams.set("end_year", params.end_year.toString())

  const res = await fetch(`${API_BASE_URL}/complaints/list?${searchParams}`)
  if (!res.ok) throw new Error("Failed to fetch complaints")
  return res.json()
}

export async function getComplaintsStats(params: {
  table: TableType
  start_year?: number
  end_year?: number
}): Promise<ComplaintStats> {
  const searchParams = new URLSearchParams()
  searchParams.set("table", params.table)
  if (params.start_year) searchParams.set("start_year", params.start_year.toString())
  if (params.end_year) searchParams.set("end_year", params.end_year.toString())

  const res = await fetch(`${API_BASE_URL}/complaints/stats?${searchParams}`)
  if (!res.ok) throw new Error("Failed to fetch stats")
  return res.json()
}

export async function getLocationStates(params: {
  table: TableType
  start_year?: number
  end_year?: number
}): Promise<StateCount[]> {
  const searchParams = new URLSearchParams()
  searchParams.set("table", params.table)
  if (params.start_year) searchParams.set("start_year", params.start_year.toString())
  if (params.end_year) searchParams.set("end_year", params.end_year.toString())

  const res = await fetch(`${API_BASE_URL}/locations/states?${searchParams}`)
  if (!res.ok) throw new Error("Failed to fetch location states")
  return res.json()
}

export async function getTopMedia(params: { table: TableType; top_k?: number }): Promise<MediaCount[]> {
  const searchParams = new URLSearchParams()
  searchParams.set("table", params.table)
  if (params.top_k) searchParams.set("top_k", params.top_k.toString())

  const res = await fetch(`${API_BASE_URL}/media/top?${searchParams}`)
  if (!res.ok) throw new Error("Failed to fetch top media")
  return res.json()
}

export async function getMediaTrends(params: { table: TableType; press_name: string }): Promise<MediaTrend[]> {
  const searchParams = new URLSearchParams()
  searchParams.set("table", params.table)
  searchParams.set("press_name", params.press_name)

  const res = await fetch(`${API_BASE_URL}/media/trends?${searchParams}`)
  if (!res.ok) throw new Error("Failed to fetch media trends")
  return res.json()
}

export async function getWordCloud(params: {
  table: TableType
  column: string
  start_year?: number
  end_year?: number
  limit?: number
}): Promise<WordCloudItem[]> {
  const searchParams = new URLSearchParams()
  searchParams.set("table", params.table)
  searchParams.set("column", params.column)
  if (params.start_year) searchParams.set("start_year", params.start_year.toString())
  if (params.end_year) searchParams.set("end_year", params.end_year.toString())
  if (params.limit) searchParams.set("limit", params.limit.toString())

  const res = await fetch(`${API_BASE_URL}/visualizations/wordcloud?${searchParams}`)
  if (!res.ok) throw new Error("Failed to fetch word cloud")
  return res.json()
}

export async function getNetworkData(params: { table: TableType; limit?: number }): Promise<NetworkData> {
  const searchParams = new URLSearchParams()
  searchParams.set("table", params.table)
  if (params.limit) searchParams.set("limit", params.limit.toString())

  const res = await fetch(`${API_BASE_URL}/visualizations/network?${searchParams}`)
  if (!res.ok) throw new Error("Failed to fetch network data")
  return res.json()
}
