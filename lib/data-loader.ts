import type { PCIComplaint } from "./types"
import type { Complaint } from "./api"

const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const API_BASE_URL = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`

// Transform backend complaint data to dashboard format
function transformComplaint(complaint: Complaint, table: "against" | "by"): PCIComplaint {
    // Extract year from ReportName (e.g., "AnnualReport2023" -> 2023)
    const yearMatch = complaint.ReportName?.match(/(\d{4})/)
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear()

    // Determine complaint direction based on table
    const complaintDirection: "by_press" | "against_press" = table === "by" ? "by_press" : "against_press"

    // Generate a unique ID for the frontend since the backend doesn't provide one.
    // We use a combination of table, state, year, and a random string to ensure uniqueness.
    const id = `${table}-${complaint.State}-${year}-${Math.random().toString(36).substr(2, 9)}`

    return {
        id,
        complainant: complaint.Complainant || "Unknown",
        against: complaint.Against || "Unknown",
        complaint: complaint.Complaint || "",
        complaintType: complaint.ComplaintType || "Unknown",
        decision: complaint.Decision || "Pending",
        date: complaint.Date || "",
        year,
        state: complaint.State || "Unknown",
        reportName: complaint.ReportName || "",
        locationsMApped: complaint.Locations_Mapped || complaint.State || "",
        complainantNameResolved: complaint.c_name_resolved || complaint.Complainant || "",
        accusedNameResolved: complaint.a_name_resolved || complaint.Against || "",
        complainantAffiliation: complaint.c_aff_resolved || "Unknown",
        accusedAffiliation: complaint.a_aff_resolved || "Unknown",
        complaintDirection,
        gender: "unknown" as const, // We don't have this data, default to unknown

        // Map normalized fields
        complaintTypeNormalized: complaint.ComplaintType_Normalized || complaint.ComplaintType || "Unknown",
        decisionParent: complaint.Decision_Parent || "Pending",
        decisionSpecific: complaint.Decision_Specific || complaint.Decision || "Pending",
        complainantCategory: complaint.Complainant_Category || "Unknown",
        complainantOccupation: complaint.Complainant_Occupation || "Unknown",
        accusedCategory: complaint.Accused_Category || "Unknown",
        accusedOccupation: complaint.Accused_Occupation || "Unknown",
        level: complaint.level || "Unknown",
    }
}

// Fetch all complaints from both tables
export async function fetchAllComplaints(): Promise<PCIComplaint[]> {
    try {
        // Fetch both "by" and "against" complaints in parallel
        const [byResponse, againstResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/complaints/list?table=by`, { cache: 'no-store' }),
            fetch(`${API_BASE_URL}/complaints/list?table=against`, { cache: 'no-store' }),
        ])

        if (!byResponse.ok || !againstResponse.ok) {
            throw new Error("Failed to fetch complaints from API")
        }

        const byData: { data: Complaint[] } = await byResponse.json()
        const againstData: { data: Complaint[] } = await againstResponse.json()

        // Transform and combine both datasets
        const byComplaints = byData.data.map((c) => transformComplaint(c, "by"))
        const againstComplaints = againstData.data.map((c) => transformComplaint(c, "against"))

        const allComplaints = [...byComplaints, ...againstComplaints]

        // console.log(`Loaded ${allComplaints.length} complaints from API (${byComplaints.length} by press, ${againstComplaints.length} against press)`)

        return allComplaints
    } catch (error) {
        console.error("Error fetching complaints from API:", error)
        console.warn("Falling back to empty dataset. Make sure the FastAPI backend is running at", API_BASE_URL)
        return []
    }
}

// Fetch complaints with filters
export async function fetchFilteredComplaints(params: {
    table?: "by" | "against" | "both"
    state?: string
    start_year?: number
    end_year?: number
    complaint_type?: string
    decision_parent?: string
    decision?: string
    category?: string
}): Promise<PCIComplaint[]> {
    try {
        const table = params.table || "both"

        if (table === "both") {
            // Fetch from both tables (Note: filtering on both tables with specific params might need more logic if params differ, 
            // but for now we assume common params or handle it simply)
            // Actually, if filtering is applied, we should probably fetch individually with params
            if (params.state || params.start_year || params.end_year || params.complaint_type || params.decision_parent || params.decision || params.category) {
                const [byResponse, againstResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/complaints/list?table=by&` + new URLSearchParams(params as any).toString(), { cache: 'no-store' }),
                    fetch(`${API_BASE_URL}/complaints/list?table=against&` + new URLSearchParams(params as any).toString(), { cache: 'no-store' }),
                ])
                const byData = await byResponse.json()
                const againstData = await againstResponse.json()
                const byComplaints = byData.data.map((c: any) => transformComplaint(c, "by"))
                const againstComplaints = againstData.data.map((c: any) => transformComplaint(c, "against"))
                return [...byComplaints, ...againstComplaints]
            }
            return fetchAllComplaints()
        }

        // Fetch from single table
        const searchParams = new URLSearchParams()
        searchParams.set("table", table)
        if (params.state) searchParams.set("state", params.state)
        if (params.start_year) searchParams.set("start_year", params.start_year.toString())
        if (params.end_year) searchParams.set("end_year", params.end_year.toString())
        if (params.complaint_type) searchParams.set("complaint_type", params.complaint_type)
        if (params.decision_parent) searchParams.set("decision_parent", params.decision_parent)
        if (params.decision) searchParams.set("decision", params.decision)
        if (params.category) searchParams.set("category", params.category)

        const response = await fetch(`${API_BASE_URL}/complaints/list?${searchParams}`, { cache: 'no-store' })

        if (!response.ok) {
            throw new Error("Failed to fetch filtered complaints")
        }

        const data: { data: Complaint[] } = await response.json()
        return data.data.map((c) => transformComplaint(c, table))
    } catch (error) {
        console.error("Error fetching filtered complaints:", error)
        return []
    }
}
