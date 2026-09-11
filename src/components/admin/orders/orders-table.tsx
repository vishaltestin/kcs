"use client";

import Link from "next/link";

import { createColumnHelper } from "@tanstack/react-table";
import { ExternalLink, FileText, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ActionSelect } from "@/components/admin/action-select";
import { DataTable, type DataTableFeatures } from "@/components/data-table/data-table";
import { SortButton } from "@/components/data-table/sort-button";
import { updateOrderStatusAction } from "@/actions/admin/engagements";
import { formatCurrency } from "@/lib/utils";

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  status: string;
  createdAt: Date;
  invoiceNumber: string | null;
  hasGst: boolean;
  courierName: string | null;
  trackingNumber: string | null;
}

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

const columnHelper = createColumnHelper<DataTableFeatures, AdminOrderRow>();

export function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const columns = [
    columnHelper.accessor("orderNumber", {
      meta: { label: "Order" },
      header: ({ column }) => <SortButton column={column} label="Order" />,
      cell: ({ row }) => (
        <Link
          href={`/admin/orders/${row.original.id}`}
          className="font-semibold text-primary hover:underline"
        >
          {row.original.orderNumber}
        </Link>
      ),
    }),
    columnHelper.accessor("customerName", {
      meta: { label: "Customer" },
      header: ({ column }) => <SortButton column={column} label="Customer" />,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-sm font-medium">{row.original.customerName}</p>
          <p className="text-xs text-muted-foreground">{row.original.customerEmail}</p>
        </div>
      ),
    }),
    columnHelper.accessor("itemCount", {
      meta: { label: "Items" },
      header: ({ column }) => <SortButton column={column} label="Items" />,
      cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.itemCount}</span>,
    }),
    columnHelper.accessor("createdAt", {
      meta: { label: "Placed" },
      header: ({ column }) => <SortButton column={column} label="Placed" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    }),
    columnHelper.accessor("total", {
      meta: { label: "Total" },
      header: ({ column }) => <SortButton column={column} label="Total" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-semibold">{formatCurrency(row.original.total)}</span>
      ),
    }),
    columnHelper.accessor("courierName", {
      meta: { label: "Shipment" },
      header: "Shipment",
      cell: ({ row }) => {
        const o = row.original;
        if (o.courierName) {
          return (
            <div className="min-w-0 text-xs">
              <p className="flex items-center gap-1.5 font-medium">
                <Truck className="size-3.5 text-primary" aria-hidden /> {o.courierName}
              </p>
              {o.trackingNumber && <p className="font-mono text-muted-foreground">{o.trackingNumber}</p>}
            </div>
          );
        }
        if (o.status === "SHIPPED" || o.status === "CONFIRMED") {
          return (
            <Link
              href={`/admin/orders/${o.id}#shipment`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Truck className="size-3.5" aria-hidden /> Add courier
            </Link>
          );
        }
        return <span className="text-xs text-muted-foreground">—</span>;
      },
      enableSorting: false,
    }),
    columnHelper.accessor("status", {
      meta: { label: "Status" },
      header: ({ column }) => <SortButton column={column} label="Status" />,
      cell: ({ row }) => (
        <ActionSelect
          value={row.original.status}
          options={ORDER_STATUSES}
          ariaLabel={`Status for ${row.original.orderNumber}`}
          on_change={(status) => updateOrderStatusAction(row.original.id, status)}
        />
      ),
      filterFn: "equalsString",
    }),
    columnHelper.display({
      id: "actions",
      meta: { label: "Actions" },
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-0.5">
          {row.original.status !== "CANCELLED" && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label={`${row.original.hasGst ? "Tax invoice" : "Invoice"} for ${row.original.orderNumber}`}
            >
              <a href={`/api/orders/${row.original.orderNumber}/invoice`} target="_blank" rel="noopener noreferrer">
                <FileText aria-hidden />
              </a>
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild aria-label="View order">
            <Link href={`/admin/orders/${row.original.id}`}>
              <ExternalLink aria-hidden />
            </Link>
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    }),
  ];

  return (
    <DataTable
      columns={columns}
      data={orders}
      getRowId={(order) => order.id}
      globalFilter={(order, query) =>
        [order.orderNumber, order.customerName, order.customerEmail, order.status, order.invoiceNumber, order.trackingNumber, order.courierName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      }
      searchPlaceholder="Search orders…"
      filters={[
        {
          columnId: "status",
          title: "Status",
          options: ORDER_STATUSES.map((status) => ({ label: status, value: status })),
        },
      ]}
      initialSorting={[{ id: "createdAt", desc: true }]}
      initialPageSize={20}
      emptyTitle="No orders found"
      emptyDescription="Try a different search or status filter."
    />
  );
}
