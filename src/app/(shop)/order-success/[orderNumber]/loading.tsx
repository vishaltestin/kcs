import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level loading UI for the order confirmation page.
 *
 * Without this file, navigating here from checkout falls back to the shop
 * layout's generic loading.tsx (a full-page skeleton). This keeps the
 * transition lightweight and shaped like the confirmation page itself.
 */
export default function OrderSuccessLoading() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12" aria-busy aria-label="Loading order confirmation">
      <div className="mb-10 flex flex-col items-center text-center">
        <Skeleton className="mb-5 size-20 rounded-full" />
        <Skeleton className="mb-3 h-9 w-72 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded" />
      </div>
      <div className="rounded-2xl bg-card p-6 ring-1 ring-foreground/[0.07]">
        <Skeleton className="mb-5 h-5 w-40 rounded" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
              <Skeleton className="h-4 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
