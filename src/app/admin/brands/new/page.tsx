import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/ui";
import { BrandForm } from "@/components/admin/brands/brand-form";

export const metadata: Metadata = { title: "New Brand" };

export default async function NewBrandPage() {
  return (
    <div>
      <PageHeader title="New Brand" description="Add a brand to the catalogue." />
      <BrandForm mode="create" />
    </div>
  );
}
