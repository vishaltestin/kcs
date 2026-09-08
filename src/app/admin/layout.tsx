import type { Metadata } from "next";
import { cookies } from "next/headers";

import { requireAdmin } from "@/lib/auth/guards";
import { AdminAppSidebar } from "@/components/admin/app-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: {
    default: "Admin — KCS G-Mart",
    template: "%s | KCS G-Mart Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireAdmin();

  // Sidebar collapse state is persisted in a cookie by SidebarProvider.
  const sidebarState = (await cookies()).get("sidebar_state")?.value;
  const defaultOpen = sidebarState !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminAppSidebar />
      <SidebarInset>
        <AdminHeader userName={`${user.firstName} ${user.lastName}`} userEmail={user.email} />
        <div className="flex-1 bg-surface/60 p-4 md:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
