"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  ArrowRight,
  Building2,
  ChevronRight,
  LogOut,
  MapPin,
  Package,
  Shield,
  ShoppingBag,
  Sparkles,
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
      {/* Profile hero — charcoal band with dot-grid, avatar + stats */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-charcoal text-white">
        <div aria-hidden className="dot-grid absolute inset-0 opacity-40" />
        <div aria-hidden className="absolute -top-24 -right-16 size-72 rounded-full bg-primary/40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-brand-amber/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 px-6 py-7 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <div className="flex items-center gap-4">
            <span className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-primary text-2xl font-extrabold text-primary-foreground shadow-[0_16px_32px_-14px_oklch(0.545_0.206_25.5/0.9)] ring-4 ring-white/10 sm:size-20">
              {initials(`${user.firstName} ${user.lastName}`)}
              <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full bg-brand-amber text-[#3d2a00] ring-2 ring-brand-charcoal">
                <Sparkles className="size-3" aria-hidden />
              </span>
            </span>
            <div>
              <p className="eyebrow text-brand-amber">My account</p>
              <h1 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-[13px] text-white/70">
                {user.email} · Member since {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 sm:min-w-[24rem]">
            {[
              { label: "Orders", value: String(orders.length) },
              { label: "In progress", value: String(openOrders) },
              { label: "Spent", value: formatCurrency(totalSpent) },
            ].map((stat) => (
              <div key={stat.label} className="min-w-0 bg-brand-charcoal/60 px-3 py-3 backdrop-blur-sm sm:px-4">
                <dt className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-white/55 sm:text-[10.5px] sm:tracking-[0.16em]">{stat.label}</dt>
                <dd className="mt-0.5 text-[15px] font-extrabold tabular-nums tracking-tight sm:text-lg">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Tabs defaultValue={initialTab} className="w-full">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Side nav (desktop) / scrollable (mobile) */}
          <TabsList className="no-scrollbar flex !h-auto w-full shrink-0 flex-row items-stretch justify-start gap-1.5 overflow-x-auto rounded-none bg-transparent p-0 group-data-horizontal/tabs:!h-auto lg:sticky lg:top-24 lg:w-64 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:bg-card lg:p-2 lg:ring-1 lg:ring-foreground/[0.07]">
            {NAV.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className={cn(
                  "group/tab !h-auto shrink-0 flex-none justify-start gap-2.5 rounded-full border border-border bg-card px-4 py-2 text-[13.5px] font-semibold text-muted-foreground shadow-none transition-colors",
                  "data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background",
                  "lg:w-full lg:rounded-xl lg:border-transparent lg:bg-transparent lg:px-3.5 lg:py-2.5",
                  "lg:hover:bg-surface lg:hover:text-foreground",
                  "lg:data-[state=active]:border-transparent lg:data-[state=active]:bg-primary/[0.08] lg:data-[state=active]:text-primary"
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="whitespace-nowrap">{label}</span>
                {value === "orders" && orders.length > 0 && (
                  <span className="ml-auto hidden rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] font-bold tabular-nums group-data-[state=active]/tab:bg-primary group-data-[state=active]/tab:text-primary-foreground lg:inline">
                    {orders.length}
                  </span>
                )}
              </TabsTrigger>
            ))}
            <div className="hidden lg:my-2 lg:block lg:h-px lg:bg-border" aria-hidden />
            <Button
              variant="ghost"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="!h-auto shrink-0 flex-none justify-start gap-2.5 rounded-full border border-border bg-card px-4 py-2 text-[13.5px] font-semibold text-muted-foreground hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary lg:w-full lg:rounded-xl lg:border-transparent lg:bg-transparent lg:px-3.5 lg:py-2.5"
            >
              <LogOut className="size-4" aria-hidden />
              {isSigningOut ? "Signing out…" : "Sign out"}
            </Button>
          </TabsList>

          <div className="min-w-0 flex-1 space-y-6">
            <TabsContent value="account" className="mt-0">
              <ProfileForm user={user} />
            </TabsContent>

            <TabsContent value="orders" className="mt-0">
              <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07]">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary/[0.08] text-primary">
                      <ShoppingBag className="size-[18px]" />
                    </span>
                    <div>
                      <h2 className="text-[15px] font-bold tracking-tight">My orders</h2>
                      <p className="text-[12.5px] text-muted-foreground">
                        {orders.length === 0
                          ? "Nothing placed yet"
                          : `${orders.length} order${orders.length === 1 ? "" : "s"} · ${openOrders} in progress`}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/product">
                      Shop again <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </header>

                {orders.length === 0 ? (
                  <div className="m-5 rounded-xl border border-dashed px-6 py-12 text-center sm:m-6">
                    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/[0.08] text-primary">
                      <Package className="size-6" aria-hidden />
                    </span>
                    <p className="mt-4 font-bold">No orders yet</p>
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
                  <ul className="divide-y">
                    {orders.map((order) => (
                      <li key={order.id} className="group/order">
                        <Link
                          href={`/order-success/${order.orderNumber}`}
                          className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 transition-colors hover:bg-surface/70 sm:px-6"
                        >
                          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-muted-foreground ring-1 ring-foreground/[0.06] transition-colors group-hover/order:bg-primary/[0.08] group-hover/order:text-primary">
                            <Package className="size-5" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-mono text-[13.5px] font-bold tracking-tight">{order.orderNumber}</p>
                            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                              {formatDate(order.createdAt)} · {order.itemCount} item
                              {order.itemCount === 1 ? "" : "s"}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[11px] font-bold ring-1",
                              STATUS_STYLES[order.status] ?? "bg-muted text-muted-foreground ring-border"
                            )}
                          >
                            {STATUS_LABELS[order.status] ?? order.status}
                          </span>
                          <p className="min-w-[6rem] text-right text-[15px] font-extrabold tabular-nums tracking-tight">
                            {formatCurrency(order.total)}
                          </p>
                          <ChevronRight
                            className="size-4 text-muted-foreground/50 transition-transform group-hover/order:translate-x-0.5 group-hover/order:text-primary"
                            aria-hidden
                          />
                        </Link>
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
