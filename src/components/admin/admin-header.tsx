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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-ml-1" aria-label="Toggle sidebar" />
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

      <div className="flex items-center gap-3 ml-auto">
        <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
          <Link href="/" target="_blank">
            <Store aria-hidden /> View Store
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-semibold leading-none">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => void logout("/")}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </header>
  );
}
