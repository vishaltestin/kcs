"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ExternalLink, LayoutDashboard, Package, Settings } from "lucide-react";

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
    items: [{ title: "Dashboard", href: "/vendor", icon: LayoutDashboard }],
  },
  {
    label: "Store",
    items: [
      { title: "Products", href: "/vendor/products", icon: Package },
      { title: "Orders", href: "/vendor/orders", icon: Boxes },
    ],
  },
  {
    label: "Account",
    items: [{ title: "Settings", href: "/vendor/settings", icon: Settings }],
  },
];

export function VendorSidebar({ vendorName }: { vendorName: string }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/vendor" ? pathname === "/vendor" : pathname.startsWith(href);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="KCS G-Mart Seller Console" className="rounded-xl">
              <Link href="/vendor" aria-label="KCS G-Mart Seller Console">
                <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-foreground/[0.08]">
                  <Logo size={28} withLink={false} />
                </span>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-extrabold tracking-tight">{vendorName}</span>
                  <span className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Seller console
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
