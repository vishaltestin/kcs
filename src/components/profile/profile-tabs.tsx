"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  ArrowRight,
  Building2,
  ChevronRight,
  ExternalLink,
  FileText,
  LogOut,
  MapPin,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ProfileForm } from "./profile-form";
import { CompanyForm } from "./company-form";
import { AddressForm } from "./address-form";
import { PasswordForm } from "./password-form";
import { formatDate, formatCurrency, initials } from "@/lib/utils";
import { useLogout } from "@/components/auth/logout-button";

type ProfileUser = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  gstNo: string | null;
  panNo: string | null;
  billingAddress: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPincode: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPincode: string | null;
  createdAt: Date;
};

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: string;
  invoiceNumber: string | null;
  hasGst: boolean;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  expectedAt: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-brand-amber/15 text-[#7a5200] ring-brand-amber/30",
  CONFIRMED: "bg-brand-blue/10 text-[#1d5fa3] ring-brand-blue/30",
  SHIPPED: "bg-violet-50 text-violet-800 ring-violet-200",
  DELIVERED: "bg-success/10 text-success ring-success/25",
  CANCELLED: "bg-primary/[0.08] text-primary ring-primary/20",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const NAV = [
  { value: "account", label: "Account", icon: User },
  { value: "orders", label: "My Orders", icon: ShoppingBag },
  { value: "company", label: "Company", icon: Building2 },
  { value: "address", label: "Addresses", icon: MapPin },
  { value: "security", label: "Security", icon: Shield },
] as const;

export function ProfileTabs({ user, orders }: { user: ProfileUser; orders: OrderSummary[] }) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const logout = useLogout();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab = NAV.some((n) => n.value === requestedTab) ? (requestedTab as string) : "account";

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await logout("/");
  };

  const totalSpent = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.total, 0);

  const openOrders = orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED").length;

  return (
    <div className="space-y-8">
      {/* Account header — editorial masthead with folio stats */}
      <section className="flex flex-col gap-6 border-b border-foreground/[0.12] pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-5">
          <span className="display relative grid size-16 shrink-0 place-items-center rounded-full bg-brand-ink text-[1.5rem] text-white sm:size-20 sm:text-[1.75rem]">
            {initials(`${user.firstName} ${user.lastName}`)}
            <span className="absolute -right-0.5 -bottom-0.5 grid size-6 place-items-center rounded-full bg-brand-amber text-[#3d2a00] ring-2 ring-background">
              <Sparkles className="size-3" aria-hidden />
            </span>
          </span>
          <div>
            <span className="kicker text-primary">My account</span>
            <h1 className="display mt-1.5 text-[1.9rem] sm:text-[2.4rem]">
              {user.firstName} {user.lastName}
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {user.email} · Member since {formatDate(user.createdAt)}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-foreground/[0.12] lg:min-w-[24rem]">
          {[
            { label: "Orders", value: String(orders.length) },
            { label: "In progress", value: String(openOrders) },
            { label: "Spent", value: formatCurrency(totalSpent) },
          ].map((stat) => (
            <div key={stat.label} className="min-w-0 px-4 first:pl-0 last:pr-0">
              <dt className="truncate text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</dt>
              <dd className="numeral mt-1 text-[1.35rem] leading-none sm:text-[1.6rem]">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Tabs defaultValue={initialTab} className="w-full">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Side nav (desktop) / scrollable (mobile) */}
          <TabsList className="no-scrollbar flex !h-auto w-full shrink-0 flex-row items-stretch justify-start gap-0 overflow-x-auto rounded-none border-b border-foreground/[0.12] bg-transparent p-0 group-data-horizontal/tabs:!h-auto lg:sticky lg:top-24 lg:w-60 lg:flex-col lg:overflow-visible lg:border-0">
            {NAV.map(({ value, label, icon: Icon }, index) => (
              <TabsTrigger
                key={value}
                value={value}
                className={cn(
                  "group/tab relative !h-auto shrink-0 flex-none justify-start gap-3 rounded-none border-0 bg-transparent px-3 py-3 text-[13.5px] font-semibold text-muted-foreground shadow-none transition-colors first:pl-0",
                  "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary after:opacity-0 after:transition-opacity",
                  "hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:after:opacity-100",
                  "lg:w-full lg:border-b lg:border-foreground/[0.08] lg:px-1 lg:py-3.5 lg:first:pl-1 lg:after:inset-y-0 lg:after:inset-x-auto lg:after:-left-4 lg:after:h-auto lg:after:w-0.5"
                )}
              >
                <span className="numeral hidden w-6 text-[11px] text-muted-foreground/70 group-data-[state=active]/tab:text-primary lg:inline">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Icon className="size-4 lg:hidden" aria-hidden />
                <span className="whitespace-nowrap">{label}</span>
                {value === "orders" && orders.length > 0 && (
                  <span className="numeral ml-auto hidden text-[12px] text-muted-foreground lg:inline">{orders.length}</span>
                )}
              </TabsTrigger>
            ))}
            <Button
              variant="ghost"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="!h-auto shrink-0 flex-none justify-start gap-3 rounded-none px-3 py-3 text-[13.5px] font-semibold text-muted-foreground hover:bg-transparent hover:text-primary lg:mt-2 lg:w-full lg:px-1 lg:py-3.5"
            >
              <span className="hidden w-6 lg:inline" aria-hidden />
              <LogOut className="size-4" aria-hidden />
              {isSigningOut ? "Signing out…" : "Sign out"}
            </Button>
          </TabsList>

          <div className="min-w-0 flex-1 space-y-6">
            <TabsContent value="account" className="mt-0">
              <ProfileForm user={user} />
            </TabsContent>

            <TabsContent value="orders" className="mt-0">
              <section>
                <header className="flex flex-wrap items-end justify-between gap-3 border-b border-foreground/[0.12] pb-4">
                  <div>
                    <h2 className="display flex items-center gap-2 text-[1.5rem]">
                      My orders <ShoppingBag className="size-4 text-foreground/40" />
                    </h2>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {orders.length === 0
                        ? "Nothing placed yet"
                        : `${orders.length} order${orders.length === 1 ? "" : "s"} · ${openOrders} in progress`}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/product">
                      Shop again <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </header>

                {orders.length === 0 ? (
                  <div className="mt-6 border border-dashed border-foreground/20 px-6 py-12 text-center">
                    <Package className="mx-auto size-7 text-primary" aria-hidden />
                    <p className="display mt-4 text-[1.2rem]">No orders yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your placed orders will appear here with live status.
                    </p>
                    <Button asChild className="mt-5">
                      <Link href="/product">
                        Browse Products <ArrowRight aria-hidden />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-foreground/[0.08]">
                    {orders.map((order, index) => (
                      <li key={order.id} className="group/order">
                        <Link
                          href={`/order-success/${order.orderNumber}`}
                          className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 pb-2 transition-colors"
                        >
                          <span className="numeral w-8 shrink-0 text-[12px] text-muted-foreground/70 transition-colors group-hover/order:text-primary">
                            {String(orders.length - index).padStart(2, "0")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-mono text-[13.5px] font-bold tracking-tight transition-colors group-hover/order:text-primary">{order.orderNumber}</p>
                            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                              {formatDate(order.createdAt)} · {order.itemCount} item
                              {order.itemCount === 1 ? "" : "s"}
                              {order.invoiceNumber ? ` · Inv ${order.invoiceNumber}` : ""}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[11px] font-bold ring-1",
                              STATUS_STYLES[order.status] ?? "bg-muted text-muted-foreground ring-border"
                            )}
                          >
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                          <p className="numeral min-w-[6rem] text-right text-[1.05rem]">{formatCurrency(order.total)}</p>
                          <ChevronRight
                            className="size-4 text-muted-foreground/50 transition-transform group-hover/order:translate-x-0.5 group-hover/order:text-primary"
                            aria-hidden
                          />
                        </Link>
                        {/* Secondary row: tracking + invoice shortcuts */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pb-3.5 pl-[3.25rem] text-[12px]">
                          {order.courierName ? (
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                              <Truck className="size-3.5 text-primary" aria-hidden />
                              {order.courierName}
                              {order.trackingNumber && (
                                <span className="font-mono font-semibold text-foreground">{order.trackingNumber}</span>
                              )}
                              {order.expectedAt && order.status === "SHIPPED" && <span>· ETA {formatDate(order.expectedAt)}</span>}
                            </span>
                          ) : order.status !== "CANCELLED" && order.status !== "DELIVERED" ? (
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                              <Truck className="size-3.5" aria-hidden /> Tracking appears once dispatched
                            </span>
                          ) : null}
                          {order.trackingUrl && (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                            >
                              Track <ExternalLink className="size-3" aria-hidden />
                            </a>
                          )}
                          {order.status !== "CANCELLED" && (
                            <a
                              href={`/api/orders/${order.orderNumber}/invoice`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary"
                            >
                              <FileText className="size-3.5" aria-hidden /> {order.hasGst ? "Tax invoice" : "Invoice"} PDF
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </TabsContent>

            <TabsContent value="company" className="mt-0">
              <CompanyForm user={user} />
            </TabsContent>

            <TabsContent value="address" className="mt-0">
              <AddressForm user={user} />
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <PasswordForm />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
