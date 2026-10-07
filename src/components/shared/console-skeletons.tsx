import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeletons shared by the admin console and the vendor portal. Both
 * use the same chrome (PageHeader + stat cards + DataTable), so one set
 * covers both — used by their route `loading.tsx` files.
 */

function TableRowsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="grid min-w-[640px] grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 border-b bg-muted/40 px-4 py-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-12" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="grid min-w-[640px] grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 border-b px-4 py-3.5 last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <div className="flex gap-1.5">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Header + toolbar + data table — the shape of every console list page. */
export function ConsoleTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading records">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-10 w-64 max-w-full rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="ml-auto size-10 rounded-lg" />
      </div>
      <TableRowsSkeleton rows={rows} />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-1.5">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Header + stat cards + recent-records table — the console dashboards. */
export function ConsoleDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2.5 rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-40 max-w-full" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <TableRowsSkeleton rows={5} />
      </div>
    </div>
  );
}

/** Header + items panel + side panels — the admin order detail page. */
export function ConsoleDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading order details">
      <Skeleton className="h-8 w-32" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border">
            <div className="space-y-1.5 border-b p-5">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-48" />
            </div>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 border-b px-5 py-3.5 last:border-b-0">
                <Skeleton className="size-12 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
            <div className="grid gap-6 border-t bg-surface/70 px-5 py-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/5" />
              </div>
              <div className="space-y-2 md:justify-self-end md:min-w-60">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3 rounded-xl border p-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
          <div className="space-y-3 rounded-xl border p-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
