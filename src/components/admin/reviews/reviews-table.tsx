"use client";

import Link from "next/link";

import { createColumnHelper } from "@tanstack/react-table";
import { CheckCircle2, MoreHorizontal, RotateCcw, Star, Trash2 } from "lucide-react";
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
import { ConfirmButton, ConfirmMenuItem } from "@/components/data-table/row-actions";
import { approveReviewAction, deleteReviewAction } from "@/actions/admin/engagements";

export interface AdminReviewRow {
  id: number;
  product: { name: string; slug: string };
  authorName: string;
  rating: number;
  title: string | null;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
}

const columnHelper = createColumnHelper<DataTableFeatures, AdminReviewRow>();

export function ReviewsTable({ reviews }: { reviews: AdminReviewRow[] }) {
  const columns = [
    columnHelper.accessor((row) => row.product.name, {
      id: "product",
      meta: { label: "Product" },
      header: ({ column }) => <SortButton column={column} label="Product" />,
      cell: ({ row }) => (
        <Link
          href={`/product/${row.original.product.slug}`}
          target="_blank"
          className="line-clamp-2 text-sm font-medium hover:text-primary"
        >
          {row.original.product.name}
        </Link>
      ),
    }),
    columnHelper.accessor("authorName", {
      meta: { label: "Reviewer" },
      header: ({ column }) => <SortButton column={column} label="Reviewer" />,
      cell: ({ row }) => {
        const review = row.original;
        return (
          <div className="min-w-0">
            <p className="text-sm font-medium">{review.authorName}</p>
            {review.title && (
              <p className="text-xs text-muted-foreground line-clamp-1">{review.title}</p>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("rating", {
      meta: { label: "Rating" },
      header: ({ column }) => <SortButton column={column} label="Rating" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5" aria-label={`${row.original.rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={
                i < row.original.rating
                  ? "size-3.5 fill-amber-400 text-amber-400"
                  : "size-3.5 text-muted-foreground/40"
              }
              aria-hidden
            />
          ))}
        </div>
      ),
    }),
    columnHelper.accessor("comment", {
      meta: { label: "Review" },
      header: () => <span className="text-sm font-semibold text-muted-foreground">Review</span>,
      cell: ({ row }) => (
        <p className="max-w-md line-clamp-2 text-sm text-muted-foreground">
          {row.original.comment}
        </p>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor("isApproved", {
      meta: { label: "Status" },
      header: ({ column }) => <SortButton column={column} label="Status" />,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={row.original.isApproved ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}
        >
          {row.original.isApproved ? "Approved" : "Pending"}
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
        const review = row.original;
        const run = (promise: Promise<{ ok: boolean; message?: string }>) =>
          void promise.then((result) =>
            result.ok ? toast.success(result.message) : toast.error(result.message)
          );

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for review by ${review.authorName}`}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                {review.isApproved ? (
                  <DropdownMenuItem onClick={() => run(approveReviewAction(review.id, false))}>
                    <RotateCcw aria-hidden /> Unpublish
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => run(approveReviewAction(review.id, true))}>
                    <CheckCircle2 aria-hidden /> Approve
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <ConfirmMenuItem
                  label="Delete review"
                  title={`Delete review by ${review.authorName}?`}
                  description="The review will be permanently removed from the product page."
                  onConfirm={() => deleteReviewAction(review.id)}
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
      data={reviews}
      getRowId={(review) => String(review.id)}
      enableSelection
      globalFilter={(review, query) =>
        [review.product.name, review.authorName, review.title, review.comment]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      }
      searchPlaceholder="Search reviews…"
      filters={[
        {
          columnId: "isApproved",
          title: "Status",
          options: [
            { label: "Pending", value: "false" },
            { label: "Approved", value: "true" },
          ],
        },
      ]}
      initialSorting={[{ id: "isApproved", desc: false }]}
      initialPageSize={20}
      emptyTitle="No reviews found"
      emptyDescription="Reviews awaiting moderation will appear here."
      renderBulkActions={(rows, clear) => (
        <ConfirmButton
          label={`Approve ${rows.length} selected`}
          title={`Approve ${rows.length} review${rows.length === 1 ? "" : "s"}?`}
          description="The selected reviews will become publicly visible on their product pages."
          confirmLabel="Approve all"
          destructive={false}
          onConfirm={async () => {
            let approved = 0;
            for (const row of rows) {
              const result = await approveReviewAction(row.id, true);
              if (result.ok) approved += 1;
            }
            clear();
            return {
              ok: true,
              message: `${approved} review${approved === 1 ? "" : "s"} approved.`,
            };
          }}
        />
      )}
    />
  );
}
