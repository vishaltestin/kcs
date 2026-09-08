"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS } from "@/lib/constants";

export function SortSelect({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="product-sort" className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
        <ArrowUpDown className="size-3.5" aria-hidden /> Sort by
      </label>
      <Select
        value={current}
        onValueChange={(value) => {
          const params = new URLSearchParams(searchParams.toString());
          if (value === "newest") {
            params.delete("sort");
          } else {
            params.set("sort", value);
          }
          params.delete("page");
          const qs = params.toString();
          router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
        }}
      >
        <SelectTrigger
          id="product-sort"
          className="h-10 w-[190px] rounded-lg bg-card font-medium shadow-none ring-1 ring-foreground/[0.07] data-[size=default]:h-10"
          aria-label="Sort products"
        >
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className="rounded-lg">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
