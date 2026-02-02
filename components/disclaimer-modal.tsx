"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DisclaimerModalProps {
    isOpen: boolean
    onClose: () => void
}

export function DisclaimerModal({ isOpen, onClose }: DisclaimerModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 transition-all duration-300">
            <div className="w-full max-w-lg overflow-hidden rounded-xl border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-300 ring-1 ring-border">
                {/* Header Section */}
                <div className="bg-amber-500/10 border-b border-amber-500/20 p-6 flex flex-col items-center text-center">
                    <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-amber-500/20">
                        <AlertTriangle className="h-7 w-7" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Data Integrity Disclaimer</h2>
                    <div className="mt-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                        Beta Version 1.0
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-6 space-y-4 text-muted-foreground leading-relaxed">
                    <p className="text-base">
                        The data presented in this dashboard has been programmatically extracted from the
                        <span className="font-semibold text-foreground"> Press Council of India Annual Reports (1990-2023)</span>.
                    </p>

                    <div className="rounded-lg bg-secondary/50 p-4 border border-border">
                        <h3 className="text-sm font-semibold text-foreground mb-1">Potential Inaccuracies</h3>
                        <p className="text-sm">
                            Due to the complexities of OCR and historical document formats, you may encounter
                            <span className="font-medium text-amber-600 dark:text-amber-500"> data errors, spelling inconsistencies, or incomplete records</span>.
                            Our team is actively validating and refining this dataset.
                        </p>
                    </div>

                    <p className="text-sm italic text-center text-muted-foreground/80">
                        "By proceeding, you acknowledge that this is a beta release intended for analytical review."
                    </p>
                </div>

                {/* Footer Section */}
                <div className="bg-muted/30 p-6 pt-0 flex justify-center">
                    <Button
                        onClick={onClose}
                        size="lg"
                        className="w-full sm:w-auto font-medium shadow-md hover:shadow-lg transition-all"
                    >
                        Acknowledge & Continue
                    </Button>
                </div>
            </div>
        </div>
    )
}
