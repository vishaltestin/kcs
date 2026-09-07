import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOrdersLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading orders">
      <Skeleton className="h-9 w-40" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}
