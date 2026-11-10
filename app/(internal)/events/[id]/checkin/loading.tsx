import { SkeletonPageHeader, SkeletonStats, SkeletonTable } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader />
      <SkeletonStats count={4} />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SkeletonTable rows={4} cols={2} />
        <SkeletonTable rows={5} cols={3} />
      </div>
    </div>
  );
}
