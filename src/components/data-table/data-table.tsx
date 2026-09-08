"use client";

import * as React from "react";

import {
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDownIcon, ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon, CircleAlertIcon, SearchIcon, Settings2Icon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dataTableFeatures, type DataTableFeatures } from "@/components/data-table/features";
import { FacetedFilter, type FacetedFilterOption } from "@/components/data-table/faceted-filter";

export type { DataTableFeatures };

export interface DataTableFacetedFilter {
  columnId: string;
  title: string;
  options: FacetedFilterOption[];
}

export interface DataTableProps<TData extends RowData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TanStack column defs are heterogeneous by design
  columns: ColumnDef<DataTableFeatures, TData, any>[];
  data: TData[];
  /** Global search predicate over the whole row. */
  globalFilter?: (row: TData, query: string) => boolean;
  searchPlaceholder?: string;
  filters?: DataTableFacetedFilter[];
  /** Extra controls on the right side of the toolbar (e.g. an "Add" button). */
  toolbarActions?: React.ReactNode;
  /** Enable row selection checkboxes + bulk action bar. */
  enableSelection?: boolean;
  renderBulkActions?: (rows: TData[], clear: () => void) => React.ReactNode;
  getRowId?: (row: TData) => string;
  initialSorting?: SortingState;
  initialPageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  globalFilter,
  searchPlaceholder,
  filters = [],
  toolbarActions,
  enableSelection = false,
  renderBulkActions,
  getRowId,
  initialSorting = [],
  initialPageSize = 10,
  emptyTitle = "No results",
  emptyDescription = "Try adjusting your search or filters.",
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilterValue, setGlobalFilterValue] = React.useState("");
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    getRowId,
    enableRowSelection: enableSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    globalFilterFn: globalFilter
      ? (row, _columnId, filterValue) =>
          globalFilter(row.original, String(filterValue ?? "").toLowerCase())
      : undefined,
    state: {
      sorting,
      columnFilters,
      globalFilter: globalFilterValue,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  const selectedRows = enableSelection ? table.getSelectedRowModel().rows.map((r) => r.original) : [];
  const isFiltered = Boolean(globalFilterValue) || columnFilters.length > 0;

  const columnVisibilityOptions = table
    .getAllColumns()
    .filter((column) => column.getCanHide());

  return (
    <div className="w-full space-y-4">
      {/* Toolbar / bulk-action bar */}
      <div className="flex flex-wrap items-center gap-2">
          {selectedRows.length > 0 && renderBulkActions ? (
            <>
              <p className="text-sm font-medium text-muted-foreground">
                {selectedRows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
              </p>
              {renderBulkActions(selectedRows, () => setRowSelection({}))}
              <Button
                variant="ghost"
                size="icon-sm"
                className="ml-auto"
                onClick={() => setRowSelection({})}
                aria-label="Clear selection"
              >
                <XIcon className="size-4" aria-hidden />
              </Button>
            </>
          ) : (
            <>
              {globalFilter && (
                <div className="relative w-full max-w-64">
                  <SearchIcon
                    className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    value={globalFilterValue}
                    onChange={(e) => setGlobalFilterValue(e.target.value)}
                    placeholder={searchPlaceholder ?? "Search…"}
                    className="h-8 pl-8"
                    aria-label={searchPlaceholder ?? "Search"}
                  />
                </div>
              )}
              {filters.map((filter) => {
                const column = table.getColumn(filter.columnId);
                if (!column) return null;
                const selected = (column.getFilterValue() as string[] | undefined) ?? [];
                return (
                  <FacetedFilter
                    key={filter.columnId}
                    title={filter.title}
                    options={filter.options}
                    selected={selected}
                    onChange={(values) => column.setFilterValue(values.length ? values : undefined)}
                  />
                );
              })}
              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground"
                  onClick={() => {
                    setGlobalFilterValue("");
                    table.resetColumnFilters();
                  }}
                >
                  Reset
                  <XIcon className="size-3.5" aria-hidden />
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2">
                {toolbarActions}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Settings2Icon className="size-3.5" aria-hidden />
                      View
                      <ChevronDownIcon className="size-3.5" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                      {columnVisibilityOptions.map((column) => {
                        const meta = column.columnDef.meta as { label?: string } | undefined;
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          >
                            {meta?.label ?? column.id}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07]">
        <div className="overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-surface/70 hover:bg-surface/70">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-11 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground first:pl-5 last:pr-5">
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="group/row"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 first:pl-5 last:pr-5">
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48">
                    <div className="flex flex-col items-center justify-center gap-1 text-center">
                      <span className="mb-2 grid size-12 place-items-center rounded-2xl bg-primary/[0.08] text-primary">
                        <CircleAlertIcon className="size-5" aria-hidden />
                      </span>
                      <p className="font-bold">{emptyTitle}</p>
                      <p className="text-sm text-muted-foreground">{emptyDescription}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} row(s) total
        </p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium whitespace-nowrap">Rows per page</p>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="h-8 w-[4.5rem]" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex w-[6.25rem] items-center justify-center text-sm font-medium">
              Page {pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                className="size-8"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label="First page"
              >
                <ChevronFirstIcon className="size-4" aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="size-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Previous page"
              >
                <ChevronLeftIcon className="size-4" aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="size-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Next page"
              >
                <ChevronRightIcon className="size-4" aria-hidden />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="size-8"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                aria-label="Last page"
              >
                <ChevronLastIcon className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
