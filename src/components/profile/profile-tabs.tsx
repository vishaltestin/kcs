"use client";

import { useState } from "react";
import Link from "next/link";

import {
  Building2,
  ChevronRight,
  LogOut,
  MapPin,
  Package,
  Shield,
  ShoppingBag,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
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

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await logout("/");
  };

  const totalSpent = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-8">
      {/* Profile hero */}
      <Card className="gap-0 overflow-hidden py-0">
        <div className="h-20 bg-gradient-to-r from-primary via-primary/80 to-primary/50" aria-hidden />
        <CardContent className="-mt-8 flex flex-col gap-5 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <span className="grid size-20 shrink-0 place-items-center rounded-2xl border-4 border-card bg-primary text-2xl font-bold text-primary-foreground shadow-lg">
              {initials(`${user.firstName} ${user.lastName}`)}
            </span>
            <div className="pb-1">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex gap-8 pb-1 sm:gap-10">
            <div>
              <p className="text-2xl font-bold tabular-nums">{orders.length}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalSpent)}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Spent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="account" className="w-full">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Side nav (desktop) / scrollable (mobile) */}
          <TabsList className="h-auto w-full shrink-0 flex-row gap-1 overflow-x-auto bg-transparent p-0 lg:w-60 lg:flex-col lg:gap-1.5 lg:overflow-visible">
            {NAV.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="w-full justify-start gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
              >
                <Icon className="size-4.5" aria-hidden />
                <span className="whitespace-nowrap">{label}</span>
                {value === "orders" && orders.length > 0 && (
                  <span className="ml-auto hidden rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary lg:inline">
                    {orders.length}
                  </span>
                )}
              </TabsTrigger>
            ))}
            <Button
              variant="ghost"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full justify-start gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive lg:mt-4"
            >
              <LogOut className="size-4.5" aria-hidden />
              {isSigningOut ? "Signing out…" : "Sign out"}
            </Button>
          </TabsList>

          <div className="min-w-0 flex-1 space-y-6">
            <TabsContent value="account" className="mt-0">
              <ProfileForm user={user} />
            </TabsContent>

            <TabsContent value="orders" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>My Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="rounded-xl border border-dashed py-12 text-center">
                      <Package className="mx-auto mb-3 size-10 text-muted-foreground/40" aria-hidden />
                      <p className="font-medium">No orders yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Your placed orders will appear here.
                      </p>
                      <Button asChild className="mt-5">
                        <Link href="/product">Browse Products</Link>
                      </Button>
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {orders.map((order) => (
                        <li key={order.id} className="group/order py-4 first:pt-0 last:pb-0">
                          <Link
                            href={`/order-success/${order.orderNumber}`}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg transition-colors"
                          >
                            <div>
                              <p className="font-semibold tracking-tight">{order.orderNumber}</p>
                              <p className="mt-0.5 text-sm text-muted-foreground">
                                {formatDate(order.createdAt)} · {order.itemCount} item
                                {order.itemCount === 1 ? "" : "s"}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[order.status] ?? "bg-muted text-muted-foreground"}`}
                              >
                                {order.status}
                              </span>
                              <p className="font-bold tabular-nums">{formatCurrency(order.total)}</p>
                              <ChevronRight
                                className="size-4 text-muted-foreground/50 transition-transform group-hover/order:translate-x-0.5"
                                aria-hidden
                              />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
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
