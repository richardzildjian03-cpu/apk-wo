import { SkeletonPageHeader, SkeletonTable } from "@/components/ui";

export default function Loading() {
  return (
    <div>
      <SkeletonPageHeader />
      <SkeletonTable rows={8} cols={5} />
    </div>
  );
}
