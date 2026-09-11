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
  Truck,
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
      { title: "Shipping & Tax", href: "/admin/shipping", icon: Truck },
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
            <SidebarMenuButton size="lg" asChild tooltip="KCS G-Mart Admin" className="rounded-xl">
              <Link href="/admin" aria-label="KCS G-Mart Admin Console">
                <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-foreground/[0.08]">
                  <Logo size={28} withLink={false} />
                </span>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-extrabold tracking-tight">KCS G-Mart</span>
                  <span className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Admin console
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                      className="rounded-lg font-medium data-[active=true]:bg-primary/[0.08] data-[active=true]:font-bold data-[active=true]:text-primary"
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
            <SidebarMenuButton
              asChild
              tooltip="Open storefront"
              className="rounded-lg bg-brand-charcoal text-white hover:bg-brand-ink hover:text-white"
            >
              <Link href="/" target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden />
                <span className="font-semibold">View Storefront</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
