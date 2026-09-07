"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Boxes,
  CalendarClock,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  Mail,
  MessageSquareText,
  Package,
  Star,
  Tags,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/shared/logo";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [
      { title: "Products", href: "/admin/products", icon: Package },
      { title: "Categories", href: "/admin/categories", icon: FolderTree },
      { title: "Brands", href: "/admin/brands", icon: Tags },
      { title: "Reviews", href: "/admin/reviews", icon: Star },
    ],
  },
  {
    label: "Sales",
    items: [
      { title: "Orders", href: "/admin/orders", icon: Boxes },
      { title: "Bulk Enquiries", href: "/admin/enquiries", icon: Mail },
      { title: "Meeting Bookings", href: "/admin/meetings", icon: CalendarClock },
    ],
  },
  {
    label: "Content & People",
    items: [
      { title: "Blog Posts", href: "/admin/blogs", icon: BookOpen },
      { title: "Contact Messages", href: "/admin/messages", icon: MessageSquareText },
      { title: "Users", href: "/admin/users", icon: Users },
      { title: "Subscribers", href: "/admin/subscribers", icon: Mail },
    ],
  },
];

export function AdminAppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="KCS G-Mart Admin">
              <Link href="/admin" aria-label="KCS G-Mart Admin Console">
                <Logo size={32} withLink={false} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold">KCS G-Mart</span>
                  <span className="truncate text-xs text-muted-foreground">Admin Console</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon aria-hidden />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Open storefront">
              <Link href="/" target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden />
                <span>View Storefront</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
