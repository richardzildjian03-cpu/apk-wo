import { SkeletonStats, SkeletonTable } from "@/components/ui";
import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-lg" />
        ))}
      </div>
      <SkeletonStats count={3} />
      <SkeletonTable rows={4} cols={3} />
    </div>
  );
}
