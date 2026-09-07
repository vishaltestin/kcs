import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/ui";
import { ProductsTable } from "@/components/admin/products/products-table";
import { getAdminProducts, getAdminBrands } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const [{ products }, brands] = await Promise.all([
    getAdminProducts({ perPage: 500 }),
    getAdminBrands(),
  ]);

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${products.length} product${products.length === 1 ? "" : "s"} in your catalogue`}
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus aria-hidden /> Add Product
            </Link>
          </Button>
        }
      />
      <ProductsTable
        products={products}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
