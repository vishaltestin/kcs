import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/products/product-form";
import { getAdminBrands, getAdminCategories } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "New Product" };

export default async function NewProductPage() {
  const [brands, categoryRows] = await Promise.all([getAdminBrands(), getAdminCategories()]);

  const categories = categoryRows.map((c) => ({
    id: c.id,
    title: c.title,
    parentId: c.parentId,
  }));
  const brandOptions = brands.map((b) => ({ id: b.id, name: b.name }));

  return (
    <div>
      <PageHeader
        title="New Product"
        description="Add a product with bulk pricing tiers, specifications and gallery images."
      />
      <ProductForm mode="create" brands={brandOptions} categories={categories} />
    </div>
  );
}
