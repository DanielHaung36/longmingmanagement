import { ProjectDetailSkeleton } from "@/components/ui/skeleton-loaders"

export default function Loading() {
  return (
    <div className="animate-fade-in">
      <ProjectDetailSkeleton />
    </div>
  )
}
