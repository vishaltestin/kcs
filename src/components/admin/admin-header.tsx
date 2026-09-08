"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Store } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLogout } from "@/components/auth/logout-button";
import { initials } from "@/lib/utils";

const LABELS: Record<string, string> = {
  admin: "Admin",
  products: "Products",
  categories: "Categories",
  brands: "Brands",
  orders: "Orders",
  enquiries: "Bulk Enquiries",
  meetings: "Meeting Bookings",
  blogs: "Blog Posts",
  messages: "Contact Messages",
  users: "Users",
  subscribers: "Subscribers",
  reviews: "Reviews",
  new: "New",
  edit: "Edit",
};

export function AdminHeader({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname();
  const logout = useLogout();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-foreground/[0.06] bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:px-6">
      <SidebarTrigger className="-ml-1 rounded-lg" aria-label="Toggle sidebar" />
      <Separator orientation="vertical" className="!h-4" />

      <div className="hidden sm:block min-w-0">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin">Admin</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {segments.slice(1).map((segment, index) => {
              const isLast = index === segments.length - 2;
              const label = LABELS[segment] ?? segment;
              return (
                <Fragment key={`${segment}-${index}`}>
                  {/* Separator must be a sibling of BreadcrumbItem — both render
                      <li>, so nesting one in the other breaks hydration. */}
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={`/${segments.slice(0, index + 2).join("/")}`}>{label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
          <Link href="/" target="_blank">
            <Store aria-hidden /> View Store
          </Link>
        </Button>

        <div className="flex items-center gap-2.5 rounded-full py-1 pr-1 pl-1 md:bg-surface md:pr-4 md:ring-1 md:ring-foreground/[0.06]">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-[11px] font-extrabold text-primary-foreground">
              {initials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-[13px] font-bold leading-none">{userName}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => void logout("/")}
          aria-label="Sign out"
          className="rounded-full text-muted-foreground hover:bg-primary/[0.08] hover:text-primary"
        >
          <LogOut className="size-4" aria-hidden />
        </Button>
      </div>
    </header>
  );
}
