"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Sortable column header — wraps the label with a button that toggles
 * asc/desc sorting (third click clears the sort).
 */
export function SortButton({
  column,
  label,
  className,
}: {
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (desc?: boolean) => void;
    getCanSort: () => boolean;
  };
  label: string;
  className?: string;
}) {
  const sorted = column.getIsSorted();

  if (!column.getCanSort()) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-2 h-7 font-semibold text-muted-foreground hover:text-foreground", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
      aria-label={`Sort by ${label}`}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5 text-primary" aria-hidden />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5 text-primary" aria-hidden />
      ) : (
        <ArrowUpDown className="size-3.5 opacity-50" aria-hidden />
      )}
    </Button>
  );
}
