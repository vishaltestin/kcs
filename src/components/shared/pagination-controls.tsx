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

  return (
    <nav className="flex justify-center items-center gap-1 mt-8" aria-label="Pagination">
      {prev ? (
        <Link
          href={buildHref(prev)}
          className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-md border opacity-40" aria-hidden>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {pages.map((p, index) =>
        p === "…" ? (
          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "flex h-9 min-w-9 px-2 items-center justify-center rounded-md border text-sm",
              p === page ? "bg-primary text-primary-foreground border-primary font-semibold" : "hover:bg-muted"
            )}
          >
            {p}
          </Link>
        )
      )}

      {next ? (
        <Link
          href={buildHref(next)}
          className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-md border opacity-40" aria-hidden>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
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
