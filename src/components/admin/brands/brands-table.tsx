"use client";

import Image from "next/image";
import Link from "next/link";

import { createColumnHelper } from "@tanstack/react-table";
import { MoreHorizontal, Pencil } from "lucide-react";

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
import { deleteBrandAction } from "@/actions/admin/brands";

export interface AdminBrandRow {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  sortOrder: number;
  productCount: number;
}

const columnHelper = createColumnHelper<DataTableFeatures, AdminBrandRow>();

export function BrandsTable({ brands }: { brands: AdminBrandRow[] }) {
  const columns = [
    columnHelper.accessor("name", {
      meta: { label: "Brand" },
      header: ({ column }) => <SortButton column={column} label="Brand" />,
      cell: ({ row }) => {
        const brand = row.original;
        return (
          <div className="flex items-center gap-3">
            {brand.logo ? (
              <div className="relative hidden h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted sm:block">
                <Image src={brand.logo} alt="" fill className="object-contain p-1" sizes="40px" />
              </div>
            ) : (
              <div className="hidden h-10 w-10 shrink-0 rounded-md bg-muted sm:block" />
            )}
            <div className="min-w-0">
              <p className="font-medium">{brand.name}</p>
              <p className="text-xs text-muted-foreground">/{brand.slug}</p>
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
    columnHelper.accessor("sortOrder", {
      meta: { label: "Sort" },
      header: ({ column }) => <SortButton column={column} label="Sort" />,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">{row.original.sortOrder}</span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      meta: { label: "Actions" },
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const brand = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${brand.name}`}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Brand</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/brands/${brand.id}/edit`}>
                    <Pencil aria-hidden /> Edit
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <ConfirmMenuItem
                  label="Delete"
                  title={`Delete ${brand.name}?`}
                  description="Products assigned to this brand will lose their brand association."
                  onConfirm={() => deleteBrandAction(brand.id)}
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
      data={brands}
      getRowId={(brand) => String(brand.id)}
      globalFilter={(brand, query) =>
        [brand.name, brand.slug]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      }
      searchPlaceholder="Search brands…"
      initialSorting={[{ id: "name", desc: false }]}
      initialPageSize={20}
      emptyTitle="No brands found"
      emptyDescription="Try a different search or create a new brand."
    />
  );
}
