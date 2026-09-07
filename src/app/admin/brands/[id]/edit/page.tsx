import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/ui";
import { BrandForm } from "@/components/admin/brands/brand-form";
import { getAdminBrandForEdit } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Edit Brand" };

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brandId = Number(id);
  if (!Number.isInteger(brandId)) notFound();

  const brand = await getAdminBrandForEdit(brandId);
  if (!brand) notFound();

  return (
    <div>
      <PageHeader title={`Edit: ${brand.name}`} description="Update brand details." />
      <BrandForm mode="edit" brand={brand} />
    </div>
  );
}
