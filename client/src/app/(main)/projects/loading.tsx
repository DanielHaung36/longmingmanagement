import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { TableSkeleton } from "@/components/ui/skeleton-loaders"

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={10} columns={6} />
        </CardContent>
      </Card>
    </div>
  )
}
