"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Label, Pie, PieChart, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type {
  CategoryStat,
  SalesTrendPoint,
  SignupPoint,
  TopProductStat,
} from "@/lib/queries/admin-stats";

/* -------------------------------------------------------------------------- */
/* Sales trend — revenue (area) + orders (bars), last N days                  */
/* -------------------------------------------------------------------------- */

const trendConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function SalesTrendChart({ data }: { data: SalesTrendPoint[] }) {
  const chartData = data.map((p) => ({
    ...p,
    label: new Date(`${p.date}T00:00:00Z`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }),
  }));

  return (
    <Card className="gap-4 rounded-2xl border-none py-5 shadow-none ring-1 ring-foreground/[0.07]">
      <CardHeader className="px-5">
        <CardTitle className="text-[15px] font-bold tracking-tight">Sales trend</CardTitle>
        <CardDescription className="text-[12.5px]">Revenue and order volume over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent className="px-5">
        <ChartContainer config={trendConfig} className="aspect-auto h-[280px] w-full">
          <ComposedChart accessibilityLayer data={chartData} margin={{ left: 4, right: 4 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.7} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={40}
            />
            <YAxis
              yAxisId="revenue"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={56}
              tickFormatter={(value: number) =>
                value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`
              }
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={28}
              allowDecimals={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) =>
                    String(payload?.[0]?.payload?.label ?? "")
                  }
                  formatter={(value, name) =>
                    name === "revenue"
                      ? formatCurrency(Number(value))
                      : `${value} order${Number(value) === 1 ? "" : "s"}`
                  }
                />
              }
            />
            <Area
              yAxisId="revenue"
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-revenue)"
              fill="url(#fillRevenue)"
              strokeWidth={2}
            />
            <Bar yAxisId="orders" dataKey="orders" fill="var(--color-orders)" radius={2} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Orders by status — donut                                                   */
/* -------------------------------------------------------------------------- */

const STATUS_COLORS: Record<string, string> = {
  PENDING: "var(--chart-2)",
  CONFIRMED: "var(--chart-3)",
  SHIPPED: "var(--chart-4)",
  DELIVERED: "var(--chart-5)",
  CANCELLED: "var(--chart-1)",
};

const statusConfig = {
  count: { label: "Orders" },
  ...Object.fromEntries(
    Object.keys(STATUS_COLORS).map((status) => [status, { label: status }])
  ),
} satisfies ChartConfig;

export function OrdersStatusChart({ data }: { data: { status: string; count: number }[] }) {
  const chartData = data.map((d) => ({
    ...d,
    fill: STATUS_COLORS[d.status] ?? "var(--chart-3)",
  }));
  const totalOrders = chartData.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="gap-4 rounded-2xl border-none py-5 shadow-none ring-1 ring-foreground/[0.07]">
      <CardHeader className="px-5">
        <CardTitle className="text-[15px] font-bold tracking-tight">Orders by status</CardTitle>
        <CardDescription className="text-[12.5px]">Current pipeline across all orders</CardDescription>
      </CardHeader>
      <CardContent className="px-5">
        {chartData.length === 0 ? (
          <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            No orders yet.
          </p>
        ) : (
          <div className="flex h-[220px] items-center gap-5">
            <ChartContainer config={statusConfig} className="aspect-square h-[184px] shrink-0">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={2}
                  cornerRadius={4}
                  strokeWidth={0}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                      const cx = Number(viewBox.cx);
                      const cy = Number(viewBox.cy);
                      return (
                        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={cx} y={cy - 6} className="fill-foreground text-2xl font-extrabold tracking-tight">
                            {totalOrders}
                          </tspan>
                          <tspan x={cx} y={cy + 13} className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-[0.14em]">
                            orders
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="min-w-0 flex-1 space-y-2.5">
              {chartData.map((entry) => (
                <li key={entry.status} className="flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: entry.fill }} />
                    <span className="truncate font-medium capitalize text-muted-foreground">
                      {entry.status.toLowerCase()}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{entry.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Top products — units sold                                                  */
/* -------------------------------------------------------------------------- */

const topProductsConfig = { units: { label: "Units sold" } } satisfies ChartConfig;

export function TopProductsChart({ data }: { data: TopProductStat[] }) {
  return (
    <Card className="gap-4 rounded-2xl border-none py-5 shadow-none ring-1 ring-foreground/[0.07]">
      <CardHeader className="px-5">
        <CardTitle className="text-[15px] font-bold tracking-tight">Best sellers</CardTitle>
        <CardDescription className="text-[12.5px]">Top products by units sold</CardDescription>
      </CardHeader>
      <CardContent className="px-5">
        {data.length === 0 ? (
          <p className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            No sales recorded yet.
          </p>
        ) : (
          <ChartContainer config={topProductsConfig} className="aspect-auto h-[240px] w-full">
            <BarChart
              accessibilityLayer
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 16 }}
            >
              <CartesianGrid horizontal={false} vertical={true} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={128}
                tickFormatter={(value: string) =>
                  value.length > 18 ? `${value.slice(0, 17)}…` : value
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => (
                      <div className="text-sm">
                        <span className="font-medium">{item?.payload?.name}</span>
                        <span className="text-muted-foreground"> — {value} units · </span>
                        <span className="text-muted-foreground">
                          {formatCurrency(item?.payload?.revenue)}
                        </span>
                      </div>
                    )}
                    hideLabel
                  />
                }
              />
              <Bar dataKey="units" fill="var(--chart-1)" radius={4} barSize={16} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Catalogue by category — vertical bars                                      */
/* -------------------------------------------------------------------------- */

const categoryConfig = { products: { label: "Products" } } satisfies ChartConfig;

export function CategoryProductsChart({ data }: { data: CategoryStat[] }) {
  return (
    <Card className="gap-4 rounded-2xl border-none py-5 shadow-none ring-1 ring-foreground/[0.07]">
      <CardHeader className="px-5">
        <CardTitle className="text-[15px] font-bold tracking-tight">Catalogue by category</CardTitle>
        <CardDescription className="text-[12.5px]">Products listed under each top-level category</CardDescription>
      </CardHeader>
      <CardContent className="px-5">
        <ChartContainer config={categoryConfig} className="aspect-auto h-[240px] w-full">
          <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="title"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              height={56}
              tickFormatter={(value: string) =>
                value.split(" ").map((w, i) => (i > 0 && i % 2 === 0 ? `\n${w}` : w)).join(" ")
              }
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="products" fill="var(--chart-3)" radius={6} barSize={32} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* User growth — signups per month                                            */
/* -------------------------------------------------------------------------- */

const usersConfig = { users: { label: "New users", color: "var(--chart-4)" } } satisfies ChartConfig;

export function UserGrowthChart({ data }: { data: SignupPoint[] }) {
  return (
    <Card className="gap-4 rounded-2xl border-none py-5 shadow-none ring-1 ring-foreground/[0.07]">
      <CardHeader className="px-5">
        <CardTitle className="text-[15px] font-bold tracking-tight">User growth</CardTitle>
        <CardDescription className="text-[12.5px]">New signups per month</CardDescription>
      </CardHeader>
      <CardContent className="px-5">
        <ChartContainer config={usersConfig} className="aspect-auto h-[220px] w-full">
          <AreaChart accessibilityLayer data={data} margin={{ left: 4, right: 4 }}>
            <defs>
              <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-users)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="var(--color-users)" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="users"
              type="monotone"
              stroke="var(--color-users)"
              fill="url(#fillUsers)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
