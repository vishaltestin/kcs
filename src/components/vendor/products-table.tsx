"use client";

import Image from "next/image";
import Link from "next/link";

import { createColumnHelper } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Package, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  vendorDeleteProductAction,
  vendorToggleProductActiveAction,
} from "@/actions/vendor/products";
import { formatCurrency } from "@/lib/utils";

export interface VendorProductRow {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number | null;
  stock: number;
  isActive: boolean;
  pricingMode: string;
  updatedAt: Date;
}

const columnHelper = createColumnHelper<DataTableFeatures, VendorProductRow>();

export function VendorProductsTable({ products }: { products: VendorProductRow[] }) {
  const toggleActive = async (product: VendorProductRow) => {
    const result = await vendorToggleProductActiveAction(product.id, !product.isActive);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  };

  const columns = [
    columnHelper.accessor("name", {
      meta: { label: "Product" },
      header: ({ column }) => <SortButton column={column} label="Product" />,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center gap-3">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/5">
              {product.image ? (
                <Image src={product.image} alt="" fill sizes="40px" className="object-cover" />
              ) : (
                <span className="grid size-full place-items-center text-muted-foreground">
                  <Package className="size-4" aria-hidden />
                </span>
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {product.pricingMode === "ENQUIRY"
                  ? "Enquiry only"
                  : product.pricingMode === "SINGLE"
                    ? "Single price"
                    : "Bulk tiers"}
              </p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor((row) => row.price ?? -1, {
      id: "price",
      meta: { label: "Base price" },
      header: ({ column }) => <SortButton column={column} label="Base price" />,
      cell: ({ row }) => (
        <span className="text-sm font-semibold tabular-nums">
          {row.original.price === null ? "—" : formatCurrency(row.original.price)}
        </span>
      ),
    }),
    columnHelper.accessor("stock", {
      meta: { label: "Stock" },
      header: ({ column }) => <SortButton column={column} label="Stock" />,
      cell: ({ row }) => {
        const stock = row.original.stock;
        return (
          <Badge
            variant="secondary"
            className={
              stock === 0
                ? "bg-foreground/[0.06] text-muted-foreground"
                : stock <= 25
                  ? "bg-amber-100 text-amber-800 font-semibold"
                  : ""
            }
          >
            {stock === 0 ? "Made to order" : `${stock} pcs`}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("isActive", {
      meta: { label: "Status" },
      header: ({ column }) => <SortButton column={column} label="Status" />,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={
            row.original.isActive
              ? "bg-green-100 text-green-800 font-semibold"
              : "bg-foreground/[0.06] text-muted-foreground"
          }
        >
          {row.original.isActive ? "Live" : "Hidden"}
        </Badge>
      ),
      filterFn: "equalsString",
    }),
    columnHelper.accessor("updatedAt", {
      meta: { label: "Updated" },
      header: ({ column }) => <SortButton column={column} label="Updated" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
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
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{product.name}</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/vendor/products/${product.id}/edit`}>
                    <Pencil aria-hidden /> Edit product
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/product/${product.slug}`} target="_blank">
                    <Eye aria-hidden /> View on storefront
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleActive(product)}>
                  {product.isActive ? "Unpublish" : "Publish"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <ConfirmMenuItem
                label="Delete product"
                title={`Delete ${product.name}?`}
                description="Products with order history can't be deleted — unpublish instead."
                onConfirm={() => vendorDeleteProductAction(product.id)}
              />
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
      globalFilter={(product, query) =>
        [product.name, product.slug]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      }
      searchPlaceholder="Search your products…"
      filters={[
        {
          columnId: "isActive",
          title: "Status",
          options: [
            { label: "Live", value: "true" },
            { label: "Hidden", value: "false" },
          ],
        },
      ]}
      initialSorting={[{ id: "updatedAt", desc: true }]}
      initialPageSize={20}
      emptyTitle="No products yet"
      emptyDescription="Add your first product — it goes live on the marketplace once published."
    />
  );
}
