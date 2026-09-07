import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/ui";
import { BrandsTable, type AdminBrandRow } from "@/components/admin/brands/brands-table";
import { getAdminBrands } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Brands" };

export default async function AdminBrandsPage() {
  const rows = await getAdminBrands();

  const brands: AdminBrandRow[] = rows.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo: b.logo,
    sortOrder: b.sortOrder,
    productCount: b._count.products,
  }));

  return (
    <div>
      <PageHeader
        title="Brands"
        description={`${brands.length} brands featured across the catalogue`}
        actions={
          <Button asChild>
            <Link href="/admin/brands/new">
              <Plus aria-hidden /> Add Brand
            </Link>
          </Button>
        }
      />
      <BrandsTable brands={brands} />
    </div>
  );
}
