import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ShieldOff } from "lucide-react";

import { requireVendor } from "@/lib/auth/guards";
import { VendorSidebar } from "@/components/vendor/vendor-sidebar";
import { VendorHeader } from "@/components/vendor/vendor-header";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: {
    default: "Seller Console — KCS G-Mart",
    template: "%s | KCS G-Mart Seller Console",
  },
  robots: { index: false, follow: false },
};

export default async function VendorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, vendor } = await requireVendor();

  // A suspended vendor can sign in but sees nothing but this notice — their
  // products are already hidden from the storefront and their actions throw.
  if (vendor.status !== "ACTIVE") {
    return (
      <div className="grid min-h-dvh place-items-center bg-surface/60 p-6">
        <div className="w-full max-w-md rounded-2xl bg-background p-8 text-center shadow-sm ring-1 ring-foreground/[0.06]">
          <span className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ShieldOff className="size-7" aria-hidden />
          </span>
          <h1 className="text-xl font-extrabold tracking-tight">Seller account suspended</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your seller account for <strong className="text-foreground">{vendor.name}</strong> is
            currently suspended, so the console is unavailable. Please contact the KCS G-Mart
            marketplace team to resolve this.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/">Back to storefront</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sidebarState = (await cookies()).get("sidebar_state")?.value;
  const defaultOpen = sidebarState !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <VendorSidebar vendorName={vendor.name} />
      <SidebarInset className="min-w-0">
        <VendorHeader userName={`${user.firstName} ${user.lastName}`} userEmail={user.email} />
        <div className="flex-1 bg-surface/60 p-4 md:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
