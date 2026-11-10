import { SkeletonPageHeader, SkeletonStats, SkeletonTable } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader />
      <SkeletonStats count={4} />
      <div className="mt-6">
        <SkeletonTable rows={5} cols={6} />
      </div>
    </div>
  );
}
