import { SkeletonPageHeader, SkeletonStats, SkeletonTable } from "@/components/ui";
import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader />
      <SkeletonStats count={4} />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-lg" />
        ))}
      </div>
      <div className="mt-4">
        <SkeletonTable rows={6} cols={5} />
      </div>
    </div>
  );
}
