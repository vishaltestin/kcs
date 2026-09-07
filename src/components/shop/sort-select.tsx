"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
      <label htmlFor="product-sort" className="text-sm text-muted-foreground whitespace-nowrap">
        Sort by
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
        <SelectTrigger id="product-sort" className="w-[180px]" aria-label="Sort products">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
