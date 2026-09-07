import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/categories/category-form";
import { getAdminCategories, getAdminCategoryForEdit } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Edit Category" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categoryId = Number(id);
  if (!Number.isInteger(categoryId)) notFound();

  const [category, rows] = await Promise.all([
    getAdminCategoryForEdit(categoryId),
    getAdminCategories(),
  ]);
  if (!category) notFound();

  return (
    <div>
      <PageHeader
        title={`Edit: ${category.title}`}
        description="Update category details, nesting and visibility."
      />
      <CategoryForm
        mode="edit"
        category={category}
        parents={rows.map((c) => ({ id: c.id, title: c.title }))}
      />
    </div>
  );
}
