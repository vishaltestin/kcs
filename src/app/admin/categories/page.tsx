import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/ui";
import { CategoriesTable, type AdminCategoryRow } from "@/components/admin/categories/categories-table";
import { getAdminCategories } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const rows = await getAdminCategories();

  const categories: AdminCategoryRow[] = rows.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    image: c.image,
    parentId: c.parentId,
    isSpecial: c.isSpecial,
    sortOrder: c.sortOrder,
    productCount: c._count.products,
    childCount: c._count.children,
  }));

  return (
    <div>
      <PageHeader
        title="Categories"
        description={`${categories.length} categories organise the storefront catalogue`}
        actions={
          <Button asChild>
            <Link href="/admin/categories/new">
              <Plus aria-hidden /> Add Category
            </Link>
          </Button>
        }
      />
      <CategoriesTable categories={categories} />
    </div>
  );
}
