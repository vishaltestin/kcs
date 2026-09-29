import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/admin/ui";
import { VendorForm } from "@/components/admin/vendors/vendor-form";
import { getAdminVendorForEdit } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Edit Vendor" };

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await getAdminVendorForEdit(id);
  if (!vendor) notFound();

  return (
    <div>
      <Link
        href="/admin/vendors"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> All vendors
      </Link>
      <PageHeader
        title={`Edit: ${vendor.name}`}
        description="Update vendor profile, GST details and status."
      />
      <VendorForm mode="edit" vendor={vendor} />
    </div>
  );
}
