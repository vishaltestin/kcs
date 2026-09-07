import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/ui";
import { EnquiriesTable, type AdminEnquiryRow } from "@/components/admin/engagements/enquiries-table";
import { getAdminEnquiries } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Bulk Enquiries" };

export default async function AdminEnquiriesPage() {
  const enquiries = await getAdminEnquiries();

  const rows: AdminEnquiryRow[] = enquiries.map((enquiry) => ({
    id: enquiry.id,
    name: enquiry.name,
    email: enquiry.email,
    phone: enquiry.phone,
    companyName: enquiry.companyName,
    productName: enquiry.productName,
    quantity: enquiry.quantity,
    message: enquiry.message,
    status: enquiry.status,
    createdAt: enquiry.createdAt,
  }));

  return (
    <div>
      <PageHeader
        title="Bulk Enquiries"
        description={`${rows.length} enquir${rows.length === 1 ? "y" : "ies"} from the storefront`}
      />
      <EnquiriesTable enquiries={rows} />
    </div>
  );
}
