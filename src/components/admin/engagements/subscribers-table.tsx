"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { Copy, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableFeatures } from "@/components/data-table/data-table";
import { SortButton } from "@/components/data-table/sort-button";
import { ConfirmMenuItem } from "@/components/data-table/row-actions";
import { deleteSubscriberAction } from "@/actions/admin/engagements";

export interface AdminSubscriberRow {
  id: number;
  email: string;
  createdAt: Date;
}

const columnHelper = createColumnHelper<DataTableFeatures, AdminSubscriberRow>();

export function SubscribersTable({ subscribers }: { subscribers: AdminSubscriberRow[] }) {
  const columns = [
    columnHelper.accessor("email", {
      meta: { label: "Email" },
      header: ({ column }) => <SortButton column={column} label="Email" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{row.original.email}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Copy ${row.original.email}`}
            onClick={() => {
              void navigator.clipboard.writeText(row.original.email);
              toast.success("Email copied to clipboard");
            }}
          >
            <Copy aria-hidden />
          </Button>
        </div>
      ),
    }),
    columnHelper.accessor("createdAt", {
      meta: { label: "Subscribed" },
      header: ({ column }) => <SortButton column={column} label="Subscribed" />,
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
    columnHelper.display({
      id: "actions",
      meta: { label: "Actions" },
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const subscriber = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${subscriber.email}`}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <ConfirmMenuItem
                  label="Remove"
                  title={`Remove ${subscriber.email}?`}
                  description="The subscriber will be removed from the newsletter list."
                  confirmLabel="Remove"
                  onConfirm={() => deleteSubscriberAction(subscriber.id)}
                />
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
  ];

  return (
    <DataTable
      columns={columns}
      data={subscribers}
      getRowId={(subscriber) => String(subscriber.id)}
      globalFilter={(subscriber, query) => subscriber.email.toLowerCase().includes(query)}
      searchPlaceholder="Search subscribers…"
      initialSorting={[{ id: "createdAt", desc: true }]}
      initialPageSize={20}
      emptyTitle="No subscribers found"
      emptyDescription="Newsletter signups from the storefront will appear here."
    />
  );
}
