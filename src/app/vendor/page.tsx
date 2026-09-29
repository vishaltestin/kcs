import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Boxes, IndianRupee, Package, PackageX } from "lucide-react";

import { PageHeader, StatCard, StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/admin/ui";
import { requireVendor } from "@/lib/auth/guards";
import { getVendorDashboard } from "@/lib/queries/vendor";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function VendorDashboardPage() {
  const { vendor } = await requireVendor();
  const stats = await getVendorDashboard(vendor.id);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${vendor.name}`}
        description="Your catalogue, orders and fulfilment at a glance."
        actions={
          <Button asChild>
            <Link href="/vendor/products/new">
              <Package aria-hidden /> Add product
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatCurrency(stats.revenue)}
          hint={`${formatCurrency(stats.monthlyRevenue)} in the last 30 days`}
          icon={IndianRupee}
          tone="primary"
        />
        <StatCard
          label="Orders to fulfil"
          value={String(stats.pendingSubOrders)}
          hint={`${stats.subOrderCount} sub-orders all time`}
          icon={Boxes}
          tone={stats.pendingSubOrders > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Products"
          value={String(stats.productCount)}
          hint={`${stats.activeProductCount} live on the storefront`}
          icon={Package}
        />
        <StatCard
          label="Low stock"
          value={String(stats.lowStock)}
          hint="Active products at ≤ 25 pcs"
          icon={PackageX}
          tone={stats.lowStock > 0 ? "warning" : "default"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel
          title="Recent orders"
          description="Your latest sub-orders, newest first."
          icon={Boxes}
          className="lg:col-span-2"
          bodyClassName="p-0"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/vendor/orders">
                All orders <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        >
          {stats.recentSubOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              No orders yet — they&apos;ll appear here the moment a customer checks out with your products.
            </p>
          ) : (
            <ul className="divide-y">
              {stats.recentSubOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <Link
                      href={`/vendor/orders/${order.id}`}
                      className="font-mono text-sm font-semibold text-primary hover:underline"
                    >
                      {order.subOrderNumber ?? order.orderNumber}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(order.createdAt)} · {order.items.length} line
                      {order.items.length === 1 ? "" : "s"} · {order.customerName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums">{formatCurrency(order.total)}</span>
                    <StatusBadge status={order.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Storefront" icon={Package}>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Your products are sold on the KCS G-Mart marketplace under{" "}
              <strong className="text-foreground">{vendor.name}</strong>.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/sellers/${vendor.slug}`} target="_blank" rel="noreferrer">
                View your seller page
              </Link>
            </Button>
            {stats.lowStock > 0 && (
              <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {stats.lowStock} product{stats.lowStock === 1 ? " is" : "s are"} running low on stock —
                restock soon to avoid missed sales.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
