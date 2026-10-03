import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/ui";
import { VendorsTable, type AdminVendorRow } from "@/components/admin/vendors/vendors-table";
import { getAdminVendors } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Vendors" };

export default async function AdminVendorsPage() {
  const vendors = await getAdminVendors();

  const rows: AdminVendorRow[] = vendors.map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    email: v.email,
    phone: v.phone,
    gstin: v.gstin,
    stateCode: v.stateCode,
    logo: v.logo,
    status: v.status,
    isDefault: v.isDefault,
    productCount: v._count.products,
    subOrderCount: v._count.subOrders,
    loginEmail: v.users[0]?.email ?? null,
    plainPassword: v.users[0]?.plainPassword ?? null,
  }));

  const activeCount = rows.filter((v) => v.status === "ACTIVE").length;

  return (
    <div>
      <PageHeader
        title="Vendors"
        description={`${rows.length} vendor${rows.length === 1 ? "" : "s"} · ${activeCount} active — products and fulfilment are split per vendor`}
        actions={
          <Button asChild>
            <Link href="/admin/vendors/new">
              <Plus aria-hidden /> Add Vendor
            </Link>
          </Button>
        }
      />
      <VendorsTable vendors={rows} />
    </div>
  );
}
