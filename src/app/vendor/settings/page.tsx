import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/ui";
import { VendorSettingsForm } from "@/components/vendor/settings-form";
import { requireVendor } from "@/lib/auth/guards";
import { getVendorProfile } from "@/lib/queries/vendor";

export const metadata: Metadata = { title: "Settings" };

export default async function VendorSettingsPage() {
  const { vendor } = await requireVendor();
  const profile = await getVendorProfile(vendor.id);
  if (!profile) notFound();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Your seller profile, contact details and compliance information."
      />
      <VendorSettingsForm vendor={profile} />
    </div>
  );
}
