"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { MoreHorizontal, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  deleteUserAction,
  toggleUserVerifiedAction,
  updateUserRoleAction,
} from "@/actions/admin/engagements";
import { initials } from "@/lib/utils";

export interface AdminUserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string | null;
  role: "CUSTOMER" | "ADMIN";
  isVerified: boolean;
  orderCount: number;
  createdAt: Date;
}

const columnHelper = createColumnHelper<DataTableFeatures, AdminUserRow>();

export function UsersTable({ users, currentUserId }: { users: AdminUserRow[]; currentUserId: string }) {
  const columns = [
    columnHelper.accessor("firstName", {
      id: "user",
      meta: { label: "User" },
      header: ({ column }) => <SortButton column={column} label="User" />,
      cell: ({ row }) => {
        const user = row.original;
        const fullName = `${user.firstName} ${user.lastName}`;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {initials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium">{fullName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor((row) => row.companyName ?? "", {
      id: "company",
      meta: { label: "Company" },
      header: ({ column }) => <SortButton column={column} label="Company" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.companyName ?? "—"}</span>
      ),
    }),
    columnHelper.accessor("role", {
      meta: { label: "Role" },
      header: ({ column }) => <SortButton column={column} label="Role" />,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={row.original.role === "ADMIN" ? "bg-primary/10 text-primary font-semibold" : ""}
        >
          {row.original.role}
        </Badge>
      ),
      filterFn: "equalsString",
    }),
    columnHelper.accessor("isVerified", {
      meta: { label: "Verified" },
      header: ({ column }) => <SortButton column={column} label="Verified" />,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={
            row.original.isVerified ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
          }
        >
          {row.original.isVerified ? "Verified" : "Pending"}
        </Badge>
      ),
      filterFn: "equalsString",
    }),
    columnHelper.accessor("orderCount", {
      meta: { label: "Orders" },
      header: ({ column }) => <SortButton column={column} label="Orders" />,
      cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.orderCount}</span>,
    }),
    columnHelper.accessor("createdAt", {
      meta: { label: "Joined" },
      header: ({ column }) => <SortButton column={column} label="Joined" />,
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
        const user = row.original;
        const isSelf = user.id === currentUserId;
        const run = (promise: Promise<{ ok: boolean; message?: string }>) =>
          void promise.then((result) =>
            result.ok ? toast.success(result.message) : toast.error(result.message)
          );

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Actions for ${user.firstName} ${user.lastName}`}
              >
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>User</DropdownMenuLabel>
                <DropdownMenuItem
                  disabled={isSelf}
                  onClick={() => run(updateUserRoleAction(user.id, user.role === "ADMIN" ? "CUSTOMER" : "ADMIN"))}
                >
                  {user.role === "ADMIN" ? (
                    <>
                      <ShieldOff aria-hidden /> Demote to customer
                    </>
                  ) : (
                    <>
                      <ShieldCheck aria-hidden /> Promote to admin
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => run(toggleUserVerifiedAction(user.id, !user.isVerified))}>
                  {user.isVerified ? "Mark unverified" : "Mark verified"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {isSelf ? (
                  <DropdownMenuItem disabled>
                    <Trash2 aria-hidden /> You cannot delete yourself
                  </DropdownMenuItem>
                ) : (
                  <ConfirmMenuItem
                    label="Delete user"
                    title={`Delete ${user.firstName} ${user.lastName}?`}
                    description="The user account will be permanently removed. Their orders are kept for records."
                    onConfirm={() => deleteUserAction(user.id)}
                  />
                )}
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
      data={users}
      getRowId={(user) => user.id}
      globalFilter={(user, query) =>
        [user.firstName, user.lastName, user.email, user.companyName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      }
      searchPlaceholder="Search users…"
      filters={[
        {
          columnId: "role",
          title: "Role",
          options: [
            { label: "Admin", value: "ADMIN" },
            { label: "Customer", value: "CUSTOMER" },
          ],
        },
        {
          columnId: "isVerified",
          title: "Verified",
          options: [
            { label: "Verified", value: "true" },
            { label: "Pending", value: "false" },
          ],
        },
      ]}
      initialSorting={[{ id: "createdAt", desc: true }]}
      initialPageSize={20}
      emptyTitle="No users found"
      emptyDescription="Try a different search or filter."
    />
  );
}
