import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/categories/category-form";
import { getAdminCategories } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "New Category" };

export default async function NewCategoryPage() {
  const rows = await getAdminCategories();
  const parents = rows.map((c) => ({ id: c.id, title: c.title }));

  return (
    <div>
      <PageHeader
        title="New Category"
        description="Create a catalogue category or theme."
      />
      <CategoryForm mode="create" parents={parents} />
    </div>
  );
}
