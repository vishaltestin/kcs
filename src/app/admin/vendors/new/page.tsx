import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/admin/ui";
import { VendorForm } from "@/components/admin/vendors/vendor-form";

export const metadata: Metadata = { title: "New Vendor" };

export default async function NewVendorPage() {
  return (
    <div>
      <Link
        href="/admin/vendors"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> All vendors
      </Link>
      <PageHeader
        title="New Vendor"
        description="Onboard a seller: vendor profile plus their login for the seller console."
      />
      <VendorForm mode="create" />
    </div>
  );
}
