import { SkeletonPageHeader, SkeletonTable } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader />
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonTable rows={3} cols={3} />
        <SkeletonTable rows={3} cols={3} />
      </div>
    </div>
  );
}
