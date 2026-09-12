import { Skeleton } from "@/components/ui/skeleton";

function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="space-y-2.5 pt-3.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="container py-8 md:py-10" aria-busy="true" aria-label="Loading products">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>
      <div className="flex flex-col gap-8 md:flex-row md:gap-10">
        <div className="hidden w-full space-y-6 md:block md:w-1/4">
          {Array.from({ length: 3 }).map((_, group) => (
            <div key={group} className="space-y-3 border-t border-foreground/[0.12] pt-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>
          ))}
        </div>
        <div className="w-full md:w-3/4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container py-8 md:py-12" aria-busy="true" aria-label="Loading product">
      <Skeleton className="mb-6 h-4 w-72" />
      <div className="grid gap-10 md:grid-cols-2 md:gap-12">
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export { ProductCardSkeleton };
