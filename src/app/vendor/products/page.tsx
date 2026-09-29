import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/ui";
import { VendorProductsTable, type VendorProductRow } from "@/components/vendor/products-table";
import { requireVendor } from "@/lib/auth/guards";
import { getVendorProducts } from "@/lib/queries/vendor";

export const metadata: Metadata = { title: "Products" };

export default async function VendorProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { vendor } = await requireVendor();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const { products, total, totalPages } = await getVendorProducts({
    vendorId: vendor.id,
    search: params.search ?? "",
    page,
    perPage: 20,
  });

  const rows: VendorProductRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.image,
    // Denormalised first tier — enquiry-only products have no public price.
    price: p.pricingMode === "ENQUIRY" || p.basePrice <= 0 ? null : p.basePrice,
    stock: p.stock,
    isActive: p.isActive,
    pricingMode: p.pricingMode,
    updatedAt: p.updatedAt,
  }));

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"} in your catalogue`}
        actions={
          <Button asChild>
            <Link href="/vendor/products/new">
              <Plus aria-hidden /> Add product
            </Link>
          </Button>
        }
      />
      <VendorProductsTable products={rows} />
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/vendor/products?page=${p}`}
              className={
                p === page
                  ? "rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                  : "rounded-lg bg-card px-3 py-1.5 text-sm ring-1 ring-foreground/[0.08] hover:bg-surface"
              }
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
