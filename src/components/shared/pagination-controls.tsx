"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Link-based pagination — keeps filters/search in the URL so every page is
 * server-rendered and shareable. Params (not functions) cross the RSC
 * boundary; the href is rebuilt client-side.
 */
export function PaginationControls({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (targetPage: number) => {
    const qs = new URLSearchParams(params);
    if (targetPage > 1) qs.set("page", String(targetPage));
    else qs.delete("page");
    const str = qs.toString();
    return str ? `${basePath}?${str}` : basePath;
  };

  const pages = getPageWindow(page, totalPages);
  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  const edge =
    "inline-flex h-10 items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-semibold transition-all";

  return (
    <nav className="mt-10 flex flex-col items-center gap-3" aria-label="Pagination">
      <div className="flex items-center gap-1.5">
        {prev ? (
          <Link href={buildHref(prev)} className={cn(edge, "hover:border-primary hover:text-primary")} aria-label="Previous page">
            <ChevronLeft className="size-4" aria-hidden /> <span className="hidden sm:inline">Prev</span>
          </Link>
        ) : (
          <span className={cn(edge, "cursor-not-allowed opacity-40")} aria-hidden>
            <ChevronLeft className="size-4" /> <span className="hidden sm:inline">Prev</span>
          </span>
        )}

        <div className="mx-1 flex items-center gap-1">
          {pages.map((p, index) =>
            p === "…" ? (
              <span key={`ellipsis-${index}`} className="grid size-10 place-items-center text-muted-foreground" aria-hidden>
                …
              </span>
            ) : (
              <Link
                key={p}
                href={buildHref(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "grid size-10 place-items-center rounded-full text-sm font-semibold transition-all tabular-nums",
                  p === page
                    ? "bg-primary text-primary-foreground shadow-[0_8px_18px_-8px_var(--primary)]"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                )}
              >
                {p}
              </Link>
            )
          )}
        </div>

        {next ? (
          <Link href={buildHref(next)} className={cn(edge, "hover:border-primary hover:text-primary")} aria-label="Next page">
            <span className="hidden sm:inline">Next</span> <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <span className={cn(edge, "cursor-not-allowed opacity-40")} aria-hidden>
            <span className="hidden sm:inline">Next</span> <ChevronRight className="size-4" />
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </p>
    </nav>
  );
}

function getPageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);

  return pages;
}
