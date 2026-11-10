import { SkeletonPageHeader, SkeletonTable } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader />
      <SkeletonTable rows={7} cols={6} />
    </div>
  );
}
