import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/products/product-form";
import {
  vendorCreateProductAction,
  vendorUpdateProductAction,
} from "@/actions/vendor/products";
import { requireVendor } from "@/lib/auth/guards";
import { getAdminBrands, getAdminCategories } from "@/lib/queries/admin";
import { getVendorProductForEdit } from "@/lib/queries/vendor";

export const metadata: Metadata = { title: "Edit Product" };

export default async function EditVendorProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { vendor } = await requireVendor();

  const [product, brands, categoryRows] = await Promise.all([
    getVendorProductForEdit(vendor.id, id),
    getAdminBrands(),
    getAdminCategories(),
  ]);
  if (!product) notFound();

  const categories = categoryRows.map((c) => ({
    id: c.id,
    title: c.title,
    parentId: c.parentId,
  }));
  const brandOptions = brands.map((b) => ({ id: b.id, name: b.name }));

  return (
    <div>
      <PageHeader
        title={`Edit: ${product.name}`}
        description="Update your product's details, pricing tiers and visibility."
      />
      <ProductForm
        mode="edit"
        product={product}
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
