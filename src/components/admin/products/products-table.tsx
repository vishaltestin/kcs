"use client";

import Image from "next/image";
import Link from "next/link";

import { createColumnHelper } from "@tanstack/react-table";
import { ExternalLink, MoreHorizontal, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  deleteProductAction,
  deleteProductsAction,
  toggleProductActiveAction,
} from "@/actions/admin/products";
import type { AdminProduct } from "@/lib/queries/admin";
import { formatCurrency } from "@/lib/utils";

const columnHelper = createColumnHelper<DataTableFeatures, AdminProduct>();

export function ProductsTable({
  products,
  brands,
}: {
  products: AdminProduct[];
  brands: { id: number; name: string }[];
}) {
  const columns = [
    columnHelper.display({
      id: "select",
      meta: { label: "Select" },
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }),
    columnHelper.accessor("name", {
      meta: { label: "Product" },
      header: ({ column }) => <SortButton column={column} label="Product" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="relative hidden h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted sm:block">
            <Image src={row.original.image} alt="" fill className="object-cover" sizes="44px" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/product/${row.original.slug}`}
              target="_blank"
              className="line-clamp-1 font-medium hover:text-primary"
            >
              {row.original.name}
            </Link>
            <p className="text-xs text-muted-foreground">{row.original.sku ?? "—"}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.brand?.name ?? "", {
      id: "brand",
      meta: { label: "Brand" },
      header: ({ column }) => <SortButton column={column} label="Brand" />,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.brand?.name ?? "—"}</span>
      ),
      filterFn: "equalsString",
    }),
    columnHelper.accessor(
      (row) => row.prices[0]?.price ?? Number.POSITIVE_INFINITY,
      {
        id: "price",
        meta: { label: "Price (from)" },
        header: ({ column }) => <SortButton column={column} label="Price (from)" />,
        cell: ({ row }) => {
          const lowest = row.original.prices[0];
          if (!lowest) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="whitespace-nowrap">
              <span className="font-semibold">{formatCurrency(lowest.price)}</span>
              <span className="text-xs text-muted-foreground"> @{lowest.minQuantity}+</span>
            </div>
          );
        },
      }
    ),
    columnHelper.accessor("stock", {
      meta: { label: "Stock" },
      header: ({ column }) => <SortButton column={column} label="Stock" />,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={row.original.stock < 50 ? "bg-red-100 text-red-800" : ""}
        >
          {row.original.stock}
        </Badge>
      ),
    }),
    columnHelper.accessor("isActive", {
      meta: { label: "Status" },
      header: ({ column }) => <SortButton column={column} label="Status" />,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={row.original.isActive ? "bg-green-100 text-green-800" : "bg-muted"}
        >
          {row.original.isActive ? "Active" : "Hidden"}
        </Badge>
      ),
      filterFn: "equalsString",
    }),
    columnHelper.display({
      id: "flags",
      meta: { label: "Badges" },
      header: () => <span className="text-sm font-semibold text-muted-foreground">Badges</span>,
      cell: ({ row }) => {
        const { isNew, isFeatured, isBestSeller } = row.original;
        if (!isNew && !isFeatured && !isBestSeller) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {isNew && <Badge variant="outline" className="text-[10px]">NEW</Badge>}
            {isFeatured && <Badge variant="outline" className="text-[10px]">FEATURED</Badge>}
            {isBestSeller && <Badge variant="outline" className="text-[10px]">BESTSELLER</Badge>}
          </div>
        );
      },
    }),
    columnHelper.accessor("updatedAt", {
      meta: { label: "Updated" },
      header: ({ column }) => <SortButton column={column} label="Updated" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {new Date(row.original.updatedAt).toLocaleDateString("en-IN", {
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
        const product = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${product.name}`}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Product</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/products/${product.id}/edit`}>
                    <Pencil aria-hidden /> Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/product/${product.slug}`} target="_blank">
                    <ExternalLink aria-hidden /> View on store
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    void toggleProductActiveAction(product.id, !product.isActive).then((result) =>
                      result.ok ? toast.success(result.message) : toast.error(result.message)
                    )
                  }
                >
                  {product.isActive ? "Unpublish" : "Publish"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <ConfirmMenuItem
                  label="Delete"
                  title={`Delete ${product.name}?`}
                  description="The product and its pricing, specs, images and reviews will be permanently removed."
                  onConfirm={() => deleteProductAction(product.id)}
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
      data={products}
      getRowId={(product) => product.id}
      enableSelection
      globalFilter={(product, query) =>
        [product.name, product.slug, product.sku, product.brand?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      }
      searchPlaceholder="Search products…"
      filters={[
        {
          columnId: "isActive",
          title: "Status",
          options: [
            { label: "Active", value: "true" },
            { label: "Hidden", value: "false" },
          ],
        },
        {
          columnId: "brand",
          title: "Brand",
          options: brands.map((brand) => ({ label: brand.name, value: brand.name })),
        },
      ]}
      initialSorting={[{ id: "updatedAt", desc: true }]}
      initialPageSize={20}
      emptyTitle="No products found"
      emptyDescription="Try a different search or create a new product."
      renderBulkActions={(rows, clear) => (
        <ConfirmButton
          label={`Delete ${rows.length} selected`}
          title={`Delete ${rows.length} product${rows.length === 1 ? "" : "s"}?`}
          description="The selected products and their pricing, specs, images and reviews will be permanently removed."
          confirmLabel="Delete all"
          onConfirm={async () => {
            const result = await deleteProductsAction(rows.map((r) => r.id));
            if (result.ok) clear();
            return result;
          }}
        />
      )}
    />
  );
}
