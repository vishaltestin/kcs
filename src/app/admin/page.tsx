import Link from "next/link";
import {
  AlertCircle,
  IndianRupee,
  Package,
  ReceiptText,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader, StatCard, StatusBadge } from "@/components/admin/ui";
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

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A snapshot of your store — sales, catalogue and leads."
        actions={
          <Button asChild variant="outline">
            <Link href="/" target="_blank">
              View Store
            </Link>
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 xl:grid-cols-4">
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
      <div className="grid grid-cols-1 gap-4 mb-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesTrendChart data={salesTrend} />
        </div>
        <OrdersStatusChart data={ordersByStatus} />
      </div>

      {/* Catalogue + growth */}
      <div className="grid grid-cols-1 gap-4 mb-6 lg:grid-cols-2 xl:grid-cols-3">
        <TopProductsChart data={topProducts} />
        <CategoryProductsChart data={categoryDistribution} />
        <UserGrowthChart data={userGrowth} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Recent orders */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/orders">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No orders yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {order.items.length} item{order.items.length === 1 ? "" : "s"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(order.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Attention + enquiries + low stock */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" aria-hidden /> Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attention.length === 0 ? (
                <p className="text-sm text-muted-foreground">All caught up. Great job! 🎉</p>
              ) : (
                <ul className="space-y-2">
                  {attention.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-sm text-muted-foreground hover:text-primary flex items-start gap-2"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Latest Enquiries</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/enquiries">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentEnquiries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No enquiries yet.</p>
              ) : (
                <ul className="space-y-3">
                  {recentEnquiries.map((enquiry) => (
                    <li key={enquiry.id} className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{enquiry.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {enquiry.productName ?? "General enquiry"}
                          {enquiry.quantity ? ` · ${enquiry.quantity} units` : ""}
                        </p>
                      </div>
                      <StatusBadge status={enquiry.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {lowStock.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" aria-hidden /> Low Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {lowStock.map((product) => (
                    <li key={product.id} className="flex items-center justify-between gap-2">
                      <Link
                        href={`/product/${product.slug}`}
                        className="text-sm hover:text-primary truncate"
                      >
                        {product.name}
                      </Link>
                      <Badge
                        variant="secondary"
                        className={product.stock < 50 ? "bg-red-100 text-red-800" : ""}
                      >
                        {product.stock} left
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
