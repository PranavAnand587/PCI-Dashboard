import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function MapSkeleton() {
    return (
        <Card className="bg-card border-border h-full">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg text-foreground">India Complaints Map</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Loading map data...
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative w-full h-[500px] bg-secondary/30 rounded-lg flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading India Map...</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
