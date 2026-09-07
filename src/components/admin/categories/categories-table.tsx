"use client";

import Image from "next/image";
import Link from "next/link";

import { createColumnHelper } from "@tanstack/react-table";
import { ExternalLink, MoreHorizontal, Pencil } from "lucide-react";

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
import { deleteCategoryAction } from "@/actions/admin/categories";

export interface AdminCategoryRow {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  parentId: number | null;
  isSpecial: boolean;
  sortOrder: number;
  productCount: number;
  childCount: number;
}

const columnHelper = createColumnHelper<DataTableFeatures, AdminCategoryRow>();

export function CategoriesTable({
  categories,
}: {
  categories: AdminCategoryRow[];
}) {
  const columns = [
    columnHelper.accessor("title", {
      meta: { label: "Category" },
      header: ({ column }) => <SortButton column={column} label="Category" />,
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center gap-3">
            {c.image ? (
              <div className="relative hidden h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted sm:block">
                <Image src={c.image} alt="" fill className="object-cover" sizes="40px" />
              </div>
            ) : (
              <div className="hidden h-10 w-10 shrink-0 rounded-md bg-muted sm:block" />
            )}
            <div className="min-w-0">
              <Link
                href={`/category/${c.slug}`}
                target="_blank"
                className="font-medium hover:text-primary"
              >
                {c.parentId !== null && (
                  <span className="text-muted-foreground">
                    {categories.find((p) => p.id === c.parentId)?.title} ›{" "}
                  </span>
                )}
                {c.title}
              </Link>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("productCount", {
      meta: { label: "Products" },
      header: ({ column }) => <SortButton column={column} label="Products" />,
      cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.productCount}</span>,
    }),
    columnHelper.accessor("childCount", {
      meta: { label: "Sub-categories" },
      header: ({ column }) => <SortButton column={column} label="Sub-categories" />,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{row.original.childCount}</span>
      ),
    }),
    columnHelper.accessor("sortOrder", {
      meta: { label: "Sort" },
      header: ({ column }) => <SortButton column={column} label="Sort" />,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.original.sortOrder}
        </span>
      ),
    }),
    columnHelper.accessor("isSpecial", {
      meta: { label: "Type" },
      header: ({ column }) => <SortButton column={column} label="Type" />,
      cell: ({ row }) => (
        <Badge variant={row.original.isSpecial ? "default" : "secondary"}>
          {row.original.isSpecial ? "Special" : "Standard"}
        </Badge>
      ),
      filterFn: "equalsString",
    }),
    columnHelper.display({
      id: "actions",
      meta: { label: "Actions" },
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const category = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${category.title}`}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Category</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/categories/${category.id}/edit`}>
                    <Pencil aria-hidden /> Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/category/${category.slug}`} target="_blank">
                    <ExternalLink aria-hidden /> View on store
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <ConfirmMenuItem
                  label="Delete"
                  title={`Delete ${category.title}?`}
                  description="Products in this category will keep their other category assignments."
                  onConfirm={() => deleteCategoryAction(category.id)}
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
      data={categories}
      getRowId={(category) => String(category.id)}
      globalFilter={(category, query) =>
        [category.title, category.slug]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      }
      searchPlaceholder="Search categories…"
      filters={[
        {
          columnId: "isSpecial",
          title: "Type",
          options: [
            { label: "Special", value: "true" },
            { label: "Standard", value: "false" },
          ],
        },
      ]}
      initialSorting={[{ id: "title", desc: false }]}
      initialPageSize={20}
      emptyTitle="No categories found"
      emptyDescription="Try a different search or create a new category."
    />
  );
}
