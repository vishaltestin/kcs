"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ActionSelect } from "@/components/admin/action-select";
import { DataTable, type DataTableFeatures } from "@/components/data-table/data-table";
import { SortButton } from "@/components/data-table/sort-button";
import { ConfirmMenuItem } from "@/components/data-table/row-actions";
import { deleteEnquiryAction, updateEnquiryStatusAction } from "@/actions/admin/engagements";

export interface AdminEnquiryRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  companyName: string | null;
  productName: string | null;
  quantity: number | null;
  message: string;
  status: string;
  createdAt: Date;
}

const ENQUIRY_STATUSES = ["NEW", "CONTACTED", "CLOSED"] as const;

const columnHelper = createColumnHelper<DataTableFeatures, AdminEnquiryRow>();

export function EnquiriesTable({ enquiries }: { enquiries: AdminEnquiryRow[] }) {
  const columns = [
    columnHelper.accessor("name", {
      meta: { label: "Enquiry" },
      header: ({ column }) => <SortButton column={column} label="Enquiry" />,
      cell: ({ row }) => {
        const enquiry = row.original;
        return (
          <div className="min-w-0">
            <p className="text-sm font-medium">{enquiry.name}</p>
            <p className="text-xs text-muted-foreground">{enquiry.email}</p>
            {enquiry.companyName && (
              <p className="text-xs text-muted-foreground">{enquiry.companyName}</p>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor((row) => row.productName ?? "", {
      id: "product",
      meta: { label: "Product" },
      header: ({ column }) => <SortButton column={column} label="Product" />,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-sm">{row.original.productName ?? "General enquiry"}</p>
          {row.original.quantity && (
            <p className="text-xs text-muted-foreground">{row.original.quantity} units</p>
          )}
        </div>
      ),
    }),
    columnHelper.accessor("message", {
      meta: { label: "Message" },
      header: () => <span className="text-sm font-semibold text-muted-foreground">Message</span>,
      cell: ({ row }) => (
        <p className="max-w-sm line-clamp-2 text-sm text-muted-foreground">
          {row.original.message}
        </p>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor("createdAt", {
      meta: { label: "Received" },
      header: ({ column }) => <SortButton column={column} label="Received" />,
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
    columnHelper.accessor("status", {
      meta: { label: "Status" },
      header: ({ column }) => <SortButton column={column} label="Status" />,
      cell: ({ row }) => (
        <ActionSelect
          value={row.original.status}
          options={ENQUIRY_STATUSES}
          ariaLabel={`Status for enquiry from ${row.original.name}`}
          on_change={(status) => updateEnquiryStatusAction(row.original.id, status)}
        />
      ),
      filterFn: "equalsString",
    }),
    columnHelper.display({
      id: "actions",
      meta: { label: "Actions" },
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const enquiry = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for enquiry from ${enquiry.name}`}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <ConfirmMenuItem
                  label="Delete"
                  title={`Delete enquiry from ${enquiry.name}?`}
                  description="The enquiry will be permanently removed."
                  onConfirm={() => deleteEnquiryAction(enquiry.id)}
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
      data={enquiries}
      getRowId={(enquiry) => String(enquiry.id)}
      globalFilter={(enquiry, query) =>
        [enquiry.name, enquiry.email, enquiry.companyName, enquiry.productName, enquiry.message]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      }
      searchPlaceholder="Search enquiries…"
      filters={[
        {
          columnId: "status",
          title: "Status",
          options: ENQUIRY_STATUSES.map((status) => ({ label: status, value: status })),
        },
      ]}
      initialSorting={[{ id: "createdAt", desc: true }]}
      initialPageSize={20}
      emptyTitle="No enquiries found"
      emptyDescription="Bulk enquiries from the storefront will appear here."
    />
  );
}
