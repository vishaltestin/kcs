import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shadcn-based loading skeletons for the storefront. Each one mirrors its
 * page's layout (same containers, grids and spacing) so the swap from
 * skeleton → content doesn't reflow the page. Used by route `loading.tsx`
 * files, `Suspense` fallbacks and client-side hydration gates.
 */

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

/** Section header (kicker + title + "view all" link) used by home rails. */
function RailHeaderSkeleton() {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-52" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

function ProductRailSkeleton() {
  return (
    <section className="container">
      <RailHeaderSkeleton />
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

/** Home: trusted strip + banner mosaic + product rails + promo band. */
export function HomeSkeleton() {
  return (
    <div className="mt-5 flex flex-col gap-20 pb-20" aria-busy="true" aria-label="Loading home page">
      <Skeleton className="h-12 w-full rounded-none" />
      <div className="container">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Skeleton className="col-span-2 aspect-[16/9] rounded-xl lg:row-span-2 lg:aspect-auto lg:min-h-80" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      </div>
      <ProductRailSkeleton />
      <ProductRailSkeleton />
      <div className="container">
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/** Category detail: dark hero banner + sub-category chips + product grid. */
export function CategorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading category">
      <div className="container pt-6 md:pt-8">
        <Skeleton className="mb-5 h-4 w-56" />
        <Skeleton className="h-60 w-full rounded-2xl md:h-72" />
      </div>
      <div className="container py-8 md:py-10">
        <div className="mb-8 flex gap-6 overflow-hidden border-b border-foreground/[0.12]">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-28 shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Category index: header + grouped category rows. */
export function CategoryIndexSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading categories">
      <div className="container pt-6 md:pt-8">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-2 h-10 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </div>
      <div className="container py-10 md:py-12">
        {Array.from({ length: 3 }).map((_, group) => (
          <div
            key={group}
            className="grid gap-6 border-t border-foreground/[0.12] py-8 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] md:gap-10"
          >
            <div className="space-y-3">
              <Skeleton className="aspect-[16/10] w-full rounded-xl" />
              <Skeleton className="h-6 w-2/3" />
            </div>
            <ul className="grid content-start gap-x-8 gap-y-3 self-start sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-4 w-full" />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlogCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[16/10] w-full rounded-xl" />
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

/** Blog index: header + featured article + card grid + CTA band. */
export function BlogGridSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading blog">
      <div className="container pt-8 md:pt-12">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-2 h-12 w-80 max-w-full" />
        <Skeleton className="mt-3 h-4 w-[28rem] max-w-full" />
      </div>
      <div className="container py-10 md:py-12">
        <div className="mb-14 grid gap-6 border-b border-foreground/[0.12] pb-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-12">
          <Skeleton className="aspect-[16/10] w-full rounded-xl" />
          <div className="content-center space-y-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <BlogCardSkeleton key={index} />
          ))}
        </div>
        <Skeleton className="mt-14 h-56 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/** Blog article: header + meta + prose/sidebar columns + related posts. */
export function BlogArticleSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading article">
      <div className="container pt-8 md:pt-12">
        <Skeleton className="h-4 w-64 max-w-full" />
        <div className="mt-8 grid gap-8 border-b border-foreground/[0.12] pb-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
          <div className="space-y-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-2/3" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <div className="grid grid-cols-2 items-center gap-4 self-end sm:grid-cols-3 lg:grid-cols-1">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      <div className="container py-10 md:py-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className={`h-4 ${index % 4 === 3 ? "w-5/6" : "w-full"}`} />
            ))}
            <Skeleton className="my-6 aspect-[16/9] w-full rounded-xl" />
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`b-${index}`} className={`h-4 ${index % 4 === 3 ? "w-2/3" : "w-full"}`} />
            ))}
          </div>
          <aside className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl border p-4">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="space-y-2.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </aside>
        </div>
        <div className="mt-16">
          <Skeleton className="h-8 w-64" />
          <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <BlogCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Sellers index: header + seller cards. */
export function SellersGridSkeleton() {
  return (
    <div className="container py-10 md:py-14" aria-busy="true" aria-label="Loading sellers">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-2 h-10 w-64 max-w-full" />
      <Skeleton className="mt-3 h-4 w-[26rem] max-w-full" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex gap-4 rounded-xl border p-5">
            <Skeleton className="size-14 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
              <div className="flex gap-4 pt-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Seller storefront: header + stats + product grid. */
export function SellerDetailSkeleton() {
  return (
    <div className="container py-10 md:py-14" aria-busy="true" aria-label="Loading seller">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Skeleton className="size-20 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-4 w-[30rem] max-w-full" />
        </div>
      </div>
      <div className="mt-6 flex gap-8 border-y border-foreground/[0.12] py-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

/** Cart: header + line items + order summary. Doubles as the hydration gate. */
export function CartSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading cart">
      <div className="container py-8 md:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-foreground/[0.12] pb-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
          <ul className="divide-y divide-foreground/[0.08]">
            {Array.from({ length: 3 }).map((_, index) => (
              <li key={index} className="flex gap-4 py-5">
                <Skeleton className="size-20 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-10 w-32 rounded-lg" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="ml-auto size-9 rounded-lg" />
                </div>
              </li>
            ))}
          </ul>
          <aside className="rounded-xl bg-surface p-5">
            <Skeleton className="h-6 w-36" />
            <div className="mt-4 space-y-2.5 border-t border-foreground/[0.08] pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-7 w-full" />
            </div>
            <Skeleton className="mt-4 h-12 w-full rounded-lg" />
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Wishlist: header + saved-items grid. Doubles as the hydration gate. */
export function WishlistSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading wishlist">
      <div className="container pt-8 md:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-foreground/[0.12] pb-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="container py-8 md:py-10">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="aspect-square w-full rounded-xl" />
              <div className="space-y-2.5 pt-3.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-6 w-20" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-8 flex-1 rounded-lg" />
                  <Skeleton className="size-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Checkout: progress header + form sections + order summary. */
export function CheckoutSkeleton() {
  return (
    <div className="container py-8 md:py-10" aria-busy="true" aria-label="Loading checkout">
      <div className="mb-10 flex flex-col gap-5 border-b border-foreground/[0.12] pb-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-11 w-56" />
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <Skeleton className="mx-1 h-px w-8" />}
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <div className="space-y-10">
          {Array.from({ length: 4 }).map((_, section) => (
            <div key={section} className="border-t border-foreground/[0.12] pt-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-6 w-48" />
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:pl-9 md:grid-cols-2">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg md:col-span-2" />
              </div>
            </div>
          ))}
        </div>
        <aside className="rounded-xl bg-surface p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="mt-4 space-y-3 border-t border-foreground/[0.08] pt-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-12 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-4 h-12 w-full rounded-lg" />
        </aside>
      </div>
    </div>
  );
}

/** Centered status page (payment-failed): icon + heading + recap + actions. */
export function CenteredStatusSkeleton() {
  return (
    <div className="container max-w-2xl py-12 md:py-16" aria-busy="true" aria-label="Loading order status">
      <div className="flex flex-col items-center text-center">
        <Skeleton className="mb-6 size-16 rounded-full" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-3 h-10 w-80 max-w-full" />
        <Skeleton className="mt-3 h-4 w-[26rem] max-w-full" />
      </div>
      <div className="mt-10 space-y-2.5 rounded-xl bg-surface px-5 py-5 md:px-6">
        <div className="flex items-baseline justify-between gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-3 w-64" />
        <div className="space-y-2 border-t border-foreground/[0.08] pt-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Skeleton className="h-12 w-52 rounded-lg" />
        <Skeleton className="h-12 w-40 rounded-lg" />
      </div>
    </div>
  );
}

export { ProductCardSkeleton };
