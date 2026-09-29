import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ChevronRight, Store } from "lucide-react";

import { getActiveVendors } from "@/lib/queries/catalog";
import { SITE } from "@/lib/constants";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = {
  title: "Our Sellers",
  description: `Meet the verified sellers on the ${SITE.name} marketplace — curated corporate gifting suppliers from across India.`,
};

export default async function SellersPage() {
  const vendors = await getActiveVendors();

  return (
    <div className="container py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <ChevronRight className="size-3" aria-hidden />
        <span className="font-medium text-foreground">Sellers</span>
      </nav>

      <div className="mt-5 max-w-2xl">
        <span className="kicker text-primary">The marketplace</span>
        <h1 className="display mt-1.5 text-[2.25rem] md:text-[2.9rem]">Our Sellers</h1>
        <p className="mt-3 text-muted-foreground">
          Every product on {SITE.name} is sold and fulfilled by a verified seller. Browse their
          storefronts, compare catalogues and order with confidence — one checkout, even when your
          gifts come from multiple sellers.
        </p>
      </div>

      {vendors.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No sellers yet"
          description="Seller storefronts will appear here once they go live."
        />
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/sellers/${vendor.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl bg-card p-6 ring-1 ring-foreground/[0.07] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-20px_rgb(17_24_39/0.25)]"
            >
              <div className="flex items-center gap-4">
                {vendor.logo ? (
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-foreground/[0.08]">
                    <Image src={vendor.logo} alt="" fill sizes="56px" className="object-contain p-1.5" />
                  </span>
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Store className="size-6" aria-hidden />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[17px] font-extrabold tracking-tight">
                    <span className="truncate">{vendor.name}</span>
                    <BadgeCheck className="size-4 shrink-0 text-primary" aria-hidden />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {vendor.city ? `${vendor.city}${vendor.state ? `, ${vendor.state}` : ""}` : "Verified seller"}
                    {" · "}
                    {vendor._count.products} product{vendor._count.products === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              {vendor.description && (
                <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{vendor.description}</p>
              )}
              <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-primary">
                Visit storefront
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
