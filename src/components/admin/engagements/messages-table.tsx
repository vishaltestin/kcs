"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { MailOpen, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableFeatures } from "@/components/data-table/data-table";
import { SortButton } from "@/components/data-table/sort-button";
import { ConfirmMenuItem } from "@/components/data-table/row-actions";
import { deleteMessageAction, markMessageReadAction } from "@/actions/admin/engagements";

export interface AdminMessageRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const columnHelper = createColumnHelper<DataTableFeatures, AdminMessageRow>();

export function MessagesTable({ messages }: { messages: AdminMessageRow[] }) {
  const columns = [
    columnHelper.accessor("name", {
      meta: { label: "From" },
      header: ({ column }) => <SortButton column={column} label="From" />,
      cell: ({ row }) => {
        const message = row.original;
        return (
          <div className="min-w-0">
            <p className="text-sm font-medium">{message.name}</p>
            <p className="text-xs text-muted-foreground">{message.email}</p>
          </div>
        );
      },
    }),
    columnHelper.accessor((row) => row.subject ?? "", {
      id: "subject",
      meta: { label: "Subject" },
      header: ({ column }) => <SortButton column={column} label="Subject" />,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.subject ?? "—"}</span>
      ),
    }),
    columnHelper.accessor("message", {
      meta: { label: "Message" },
      header: () => <span className="text-sm font-semibold text-muted-foreground">Message</span>,
      cell: ({ row }) => (
        <p className="max-w-md line-clamp-2 text-sm text-muted-foreground">
          {row.original.message}
        </p>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor("isRead", {
      meta: { label: "Status" },
      header: ({ column }) => <SortButton column={column} label="Status" />,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={row.original.isRead ? "bg-muted" : "bg-primary/10 text-primary"}
        >
          {row.original.isRead ? "Read" : "Unread"}
        </Badge>
      ),
      filterFn: "equalsString",
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
    columnHelper.display({
      id: "actions",
      meta: { label: "Actions" },
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const message = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for message from ${message.name}`}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Message</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    void markMessageReadAction(message.id, !message.isRead).then((result) =>
                      result.ok ? toast.success(result.message) : toast.error(result.message)
                    )
                  }
                >
                  <MailOpen aria-hidden /> {message.isRead ? "Mark unread" : "Mark read"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <ConfirmMenuItem
                  label="Delete message"
                  title={`Delete message from ${message.name}?`}
                  description="The message will be permanently removed."
                  onConfirm={() => deleteMessageAction(message.id)}
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
      data={messages}
      getRowId={(message) => String(message.id)}
      globalFilter={(message, query) =>
        [message.name, message.email, message.subject, message.message]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      }
      searchPlaceholder="Search messages…"
      filters={[
        {
          columnId: "isRead",
          title: "Status",
          options: [
            { label: "Unread", value: "false" },
            { label: "Read", value: "true" },
          ],
        },
      ]}
      initialSorting={[{ id: "createdAt", desc: true }]}
      initialPageSize={20}
      emptyTitle="No messages found"
      emptyDescription="Contact form submissions will appear here."
    />
  );
}
