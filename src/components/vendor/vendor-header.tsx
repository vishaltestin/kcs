"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLogout } from "@/components/auth/logout-button";
import { initials } from "@/lib/utils";

const LABELS: Record<string, string> = {
  vendor: "Dashboard",
  products: "Products",
  orders: "Orders",
  settings: "Settings",
  new: "New",
  edit: "Edit",
};

export function VendorHeader({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname();
  const logout = useLogout();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-foreground/[0.06] bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:px-6">
      <SidebarTrigger className="-ml-1 rounded-lg" aria-label="Toggle sidebar" />
      <Separator orientation="vertical" className="!h-4" />

      <div className="hidden min-w-0 sm:block">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/vendor">Seller Console</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {segments.slice(1).map((segment, index) => {
              const isLast = index === segments.length - 2;
              const label = LABELS[segment] ?? segment;
              const isRecordId = !LABELS[segment] && /^[a-z0-9]{20,}$/i.test(segment);
              return (
                <Fragment key={`${segment}-${index}`}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast || isRecordId ? (
                      <BreadcrumbPage className="capitalize">{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={`/${segments.slice(0, index + 2).join("/")}`} className="capitalize">
                          {label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2.5 md:flex">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="truncate text-[11px] text-muted-foreground">{userEmail}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => void logout("/")} aria-label="Sign out">
          <LogOut aria-hidden />
        </Button>
      </div>
    </header>
  );
}
