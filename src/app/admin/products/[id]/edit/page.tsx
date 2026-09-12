import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenText } from "lucide-react";

import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/products/product-form";
import { getAdminBrands, getAdminCategories, getAdminProductForEdit } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Edit Product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, brands, categoryRows] = await Promise.all([
    getAdminProductForEdit(id),
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
        description="Update product details, pricing tiers and visibility."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/guides/product">
              <BookOpenText aria-hidden /> Product guide
            </Link>
          </Button>
        }
      />
      <ProductForm mode="edit" product={product} brands={brandOptions} categories={categories} />
    </div>
  );
}
