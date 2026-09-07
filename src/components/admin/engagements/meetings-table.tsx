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
import { deleteBookingAction, updateBookingStatusAction } from "@/actions/admin/engagements";

export interface AdminBookingRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  date: Date;
  timeSlot: string;
  notes: string | null;
  status: string;
  createdAt: Date;
}

const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;

const columnHelper = createColumnHelper<DataTableFeatures, AdminBookingRow>();

export function MeetingsTable({ bookings }: { bookings: AdminBookingRow[] }) {
  const columns = [
    columnHelper.accessor("name", {
      meta: { label: "Booked by" },
      header: ({ column }) => <SortButton column={column} label="Booked by" />,
      cell: ({ row }) => {
        const booking = row.original;
        return (
          <div className="min-w-0">
            <p className="text-sm font-medium">{booking.name}</p>
            <p className="text-xs text-muted-foreground">{booking.email}</p>
            {booking.company && (
              <p className="text-xs text-muted-foreground">{booking.company}</p>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("date", {
      meta: { label: "Slot" },
      header: ({ column }) => <SortButton column={column} label="Slot" />,
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p className="text-sm">
            {new Date(row.original.date).toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-xs text-muted-foreground">{row.original.timeSlot}</p>
        </div>
      ),
    }),
    columnHelper.accessor("notes", {
      meta: { label: "Notes" },
      header: () => <span className="text-sm font-semibold text-muted-foreground">Notes</span>,
      cell: ({ row }) => (
        <p className="max-w-sm line-clamp-2 text-sm text-muted-foreground">
          {row.original.notes ?? "—"}
        </p>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor("status", {
      meta: { label: "Status" },
      header: ({ column }) => <SortButton column={column} label="Status" />,
      cell: ({ row }) => (
        <ActionSelect
          value={row.original.status}
          options={BOOKING_STATUSES}
          ariaLabel={`Status for booking by ${row.original.name}`}
          on_change={(status) => updateBookingStatusAction(row.original.id, status)}
        />
      ),
      filterFn: "equalsString",
    }),
    columnHelper.accessor("createdAt", {
      meta: { label: "Requested" },
      header: ({ column }) => <SortButton column={column} label="Requested" />,
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
        const booking = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for booking by ${booking.name}`}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <ConfirmMenuItem
                  label="Delete"
                  title={`Delete booking by ${booking.name}?`}
                  description="The meeting booking will be permanently removed."
                  onConfirm={() => deleteBookingAction(booking.id)}
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
      data={bookings}
      getRowId={(booking) => String(booking.id)}
      globalFilter={(booking, query) =>
        [booking.name, booking.email, booking.company, booking.notes]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      }
      searchPlaceholder="Search bookings…"
      filters={[
        {
          columnId: "status",
          title: "Status",
          options: BOOKING_STATUSES.map((status) => ({ label: status, value: status })),
        },
      ]}
      initialSorting={[{ id: "date", desc: false }]}
      initialPageSize={20}
      emptyTitle="No bookings found"
      emptyDescription="Meeting requests from the storefront will appear here."
    />
  );
}
