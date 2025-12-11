export interface PCIComplaint {
    id: string
    complainant: string
    against: string
    complaint: string
    complaintType: string
    decision: string
    date: string
    year: number
    state: string
    reportName: string
    locationsMApped: string
    complainantNameResolved: string
    accusedNameResolved: string
    complainantAffiliation: string // c_aff_resolved
    accusedAffiliation: string // a_aff_resolved
    complaintDirection: "by_press" | "against_press"
    gender: "male" | "female" | "organization" | "unknown"

    // Normalized fields
    complaintTypeNormalized: string
    decisionParent: string
    decisionSpecific: string
    complainantCategory: string
    complainantOccupation: string
    accusedCategory: string
    accusedOccupation: string
}
