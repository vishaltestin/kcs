import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  IndianRupee,
  Mail,
  Package,
  PackageSearch,
  ReceiptText,
  Store,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/admin/ui";
import {
  SalesTrendChart,
  OrdersStatusChart,
  TopProductsChart,
  CategoryProductsChart,
  UserGrowthChart,
} from "@/components/admin/dashboard/charts";
import {
  getDashboardStats,
  getLowStockProducts,
  getRecentEnquiries,
  getRecentOrders,
} from "@/lib/queries/admin";
import {
  getCategoryDistribution,
  getOrdersByStatus,
  getSalesTrend,
  getTopProducts,
  getUserGrowth,
} from "@/lib/queries/admin-stats";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [
    stats,
    recentOrders,
    recentEnquiries,
    lowStock,
    salesTrend,
    ordersByStatus,
    topProducts,
    categoryDistribution,
    userGrowth,
  ] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(6),
    getRecentEnquiries(5),
    getLowStockProducts(100, 5),
    getSalesTrend(30),
    getOrdersByStatus(),
    getTopProducts(8),
    getCategoryDistribution(6),
    getUserGrowth(6),
  ]);

  const attention = [
    stats.pendingOrderCount > 0 && {
      label: `${stats.pendingOrderCount} order(s) awaiting confirmation`,
      href: "/admin/orders?status=PENDING",
    },
    stats.newEnquiryCount > 0 && {
      label: `${stats.newEnquiryCount} new bulk enquir${stats.newEnquiryCount === 1 ? "y" : "ies"}`,
      href: "/admin/enquiries?status=NEW",
    },
    stats.pendingReviews > 0 && {
      label: `${stats.pendingReviews} review(s) pending moderation`,
      href: "/admin/reviews",
    },
    stats.unreadMessages > 0 && {
      label: `${stats.unreadMessages} unread contact message(s)`,
      href: "/admin/messages",
    },
    stats.pendingBookings > 0 && {
      label: `${stats.pendingBookings} meeting booking(s) to confirm`,
      href: "/admin/meetings",
    },
  ].filter(Boolean) as { label: string; href: string }[];

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div>
      <PageHeader
        eyebrow={today}
        title="Dashboard"
        description="A snapshot of your store — sales, catalogue and leads."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/" target="_blank">
                <Store aria-hidden /> View Store
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/products/new">
                <Package aria-hidden /> Add product
              </Link>
            </Button>
          </>
        }
      />

      {/* Attention strip */}
      {attention.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl bg-brand-charcoal px-4 py-3 text-white ring-1 ring-white/10">
          <span className="mr-1 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-brand-amber">
            <BellRing className="size-4" aria-hidden /> Needs attention
          </span>
          {attention.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12.5px] font-semibold transition-colors hover:bg-primary"
            >
              {item.label}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.revenue)}
          icon={IndianRupee}
          tone="primary"
          hint={`${formatCurrency(stats.monthlyRevenue)} in last 30 days`}
        />
        <StatCard
          label="Orders"
          value={stats.orderCount}
          icon={ReceiptText}
          hint={`${stats.pendingOrderCount} pending`}
          tone={stats.pendingOrderCount > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Active Products"
          value={stats.activeProductCount}
          icon={Package}
          hint={`${stats.productCount} total · ${stats.brandCount} brands`}
        />
        <StatCard
          label="Customers"
          value={stats.customerCount}
          icon={Users}
          hint={`${stats.subscriberCount} newsletter subscribers`}
        />
      </div>

      {/* Sales trend + orders pipeline */}
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesTrendChart data={salesTrend} />
        </div>
        <OrdersStatusChart data={ordersByStatus} />
      </div>

      {/* Catalogue + growth */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <TopProductsChart data={topProducts} />
        <CategoryProductsChart data={categoryDistribution} />
        <UserGrowthChart data={userGrowth} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Recent orders */}
        <Panel
          className="xl:col-span-2"
          icon={ReceiptText}
          title="Recent orders"
          description="Latest six orders across all statuses"
          bodyClassName="p-0"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/orders">
                View all <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        >
          {recentOrders.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/[0.08] text-primary">
                <PackageSearch className="size-5" aria-hidden />
              </span>
              <p className="mt-3 text-sm font-semibold">No orders yet</p>
              <p className="text-[12.5px] text-muted-foreground">New orders will show up here as they arrive.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow className="bg-surface/70 hover:bg-surface/70">
                    <TableHead className="pl-5 text-[11px] font-bold uppercase tracking-[0.12em]">Order</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-[0.12em]">Customer</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-[0.12em]">Date</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-[0.12em]">Status</TableHead>
                    <TableHead className="pr-5 text-right text-[11px] font-bold uppercase tracking-[0.12em]">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="group/row">
                      <TableCell className="pl-5">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-[13px] font-bold tracking-tight transition-colors group-hover/row:text-primary"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-[11.5px] text-muted-foreground">
                          {order.items.length} item{order.items.length === 1 ? "" : "s"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-[13px] font-semibold">{order.customerName}</p>
                        <p className="text-[11.5px] text-muted-foreground">{order.customerEmail}</p>
                      </TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="pr-5 text-right text-[13.5px] font-extrabold tabular-nums">
                        {formatCurrency(order.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Panel>

        {/* Enquiries + low stock */}
        <div className="space-y-4">
          <Panel
            icon={Mail}
            title="Latest enquiries"
            bodyClassName="p-0"
            actions={
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/enquiries">
                  View all <ArrowRight aria-hidden />
                </Link>
              </Button>
            }
          >
            {recentEnquiries.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No enquiries yet.</p>
            ) : (
              <ul className="divide-y">
                {recentEnquiries.map((enquiry) => (
                  <li key={enquiry.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold">{enquiry.name}</p>
                      <p className="truncate text-[11.5px] text-muted-foreground">
                        {enquiry.productName ?? "General enquiry"}
                        {enquiry.quantity ? ` · ${enquiry.quantity} units` : ""}
                      </p>
                    </div>
                    <StatusBadge status={enquiry.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            icon={lowStock.length > 0 ? AlertCircle : CheckCircle2}
            title="Stock watch"
            description={lowStock.length > 0 ? "Products under 100 units" : "All products comfortably stocked"}
            bodyClassName="p-0"
          >
            {lowStock.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">Nothing to restock right now.</p>
            ) : (
              <ul className="divide-y">
                {lowStock.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <Link
                      href={`/product/${product.slug}`}
                      className="truncate text-[13px] font-medium transition-colors hover:text-primary"
                    >
                      {product.name}
                    </Link>
                    <span
                      className={
                        product.stock < 50
                          ? "shrink-0 rounded-full bg-primary/[0.08] px-2.5 py-1 text-[11px] font-bold text-primary ring-1 ring-primary/20"
                          : "shrink-0 rounded-full bg-brand-amber/15 px-2.5 py-1 text-[11px] font-bold text-[#7a5200] ring-1 ring-brand-amber/30"
                      }
                    >
                      {product.stock} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
