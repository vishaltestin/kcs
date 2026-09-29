"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Package } from "lucide-react";

import { createColumnHelper } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/ui";
import { DataTable, type DataTableFeatures } from "@/components/data-table/data-table";
import { SortButton } from "@/components/data-table/sort-button";
import { formatCurrency } from "@/lib/utils";

export interface VendorOrderRow {
  id: string;
  subOrderNumber: string | null;
  orderNumber: string;
  parentOrderNumber: string | null;
  customerName: string;
  customerCity: string;
  itemCount: number;
  total: number;
  status: string;
  createdAt: Date;
  firstItemImage: string | null;
}

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

const columnHelper = createColumnHelper<DataTableFeatures, VendorOrderRow>();

export function VendorOrdersTable({ orders }: { orders: VendorOrderRow[] }) {
  const columns = [
    columnHelper.accessor((row) => row.subOrderNumber ?? row.orderNumber, {
      id: "subOrderNumber",
      meta: { label: "Sub-order" },
      header: ({ column }) => <SortButton column={column} label="Sub-order" />,
      cell: ({ row }) => (
        <div className="min-w-0">
          <Link
            href={`/vendor/orders/${row.original.id}`}
            className="font-mono text-sm font-semibold text-primary hover:underline"
          >
            {row.original.subOrderNumber ?? row.original.orderNumber}
          </Link>
          {row.original.parentOrderNumber && (
            <p className="text-[11px] text-muted-foreground">
              from {row.original.parentOrderNumber}
            </p>
          )}
        </div>
      ),
    }),
    columnHelper.accessor("customerName", {
      meta: { label: "Customer" },
      header: ({ column }) => <SortButton column={column} label="Customer" />,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{row.original.customerName}</p>
          <p className="text-xs text-muted-foreground">{row.original.customerCity}</p>
        </div>
      ),
    }),
    columnHelper.accessor("itemCount", {
      meta: { label: "Items" },
      header: ({ column }) => <SortButton column={column} label="Items" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.firstItemImage ? (
            <span className="relative size-8 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-foreground/5">
              <Image src={row.original.firstItemImage} alt="" fill sizes="32px" className="object-cover" />
            </span>
          ) : (
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
              <Package className="size-3.5" aria-hidden />
            </span>
          )}
          <span className="text-sm tabular-nums">{row.original.itemCount} pcs</span>
        </div>
      ),
    }),
    columnHelper.accessor("createdAt", {
      meta: { label: "Placed" },
      header: ({ column }) => <SortButton column={column} label="Placed" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
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
        <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
          {formatCurrency(row.original.total)}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      meta: { label: "Status" },
      header: ({ column }) => <SortButton column={column} label="Status" />,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      filterFn: "equalsString",
    }),
    columnHelper.display({
      id: "actions",
      meta: { label: "Actions" },
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" asChild aria-label="View order">
          <Link href={`/vendor/orders/${row.original.id}`}>
            <ExternalLink aria-hidden />
          </Link>
        </Button>
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
        [order.subOrderNumber, order.orderNumber, order.customerName, order.status]
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
      emptyTitle="No orders here yet"
      emptyDescription="When customers order your products, the sub-orders land here for fulfilment."
    />
  );
}
