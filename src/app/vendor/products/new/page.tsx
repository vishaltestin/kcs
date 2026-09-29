import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/products/product-form";
import {
  vendorCreateProductAction,
  vendorUpdateProductAction,
} from "@/actions/vendor/products";
import { requireVendor } from "@/lib/auth/guards";
import { getAdminBrands, getAdminCategories } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "New Product" };

export default async function NewVendorProductPage() {
  await requireVendor();

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
        description="Add a product to your catalogue — pricing tiers, variants and gallery included."
      />
      <ProductForm
        mode="create"
        brands={brandOptions}
        categories={categories}
        context="vendor"
        createAction={vendorCreateProductAction}
        updateAction={vendorUpdateProductAction}
        backHref="/vendor/products"
      />
    </div>
  );
}
