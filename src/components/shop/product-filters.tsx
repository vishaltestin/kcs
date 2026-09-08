"use client";

import { useCallback, useMemo, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, ChevronUp, SlidersHorizontal, Tag, X } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PRICE_FILTER_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CategoryNode } from "@/types";

type BrandOption = { id: number; name: string };

/**
 * URL-driven filter sidebar. All state lives in searchParams so listings are
 * server-rendered, shareable and crawlable.
 *
 * Desktop: sticky sidebar. Mobile: a "Filters" button that opens the same
 * controls in a sheet.
 */
export function ProductFilters({
  categories,
  brands,
}: {
  categories: CategoryNode[];
  brands: BrandOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const multi = useCallback(
    (key: string) => (searchParams.get(key)?.split(",").filter(Boolean) ?? []),
    [searchParams]
  );

  const selectedCategories = multi("cats");
  const selectedBrands = multi("brands");
  const selectedPrices = multi("price");
  const search = searchParams.get("q") ?? "";

  const setParam = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length > 0) {
        params.set(key, values.join(","));
      } else {
        params.delete(key);
      }
      params.delete("page"); // reset pagination when filters change
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const toggle = (key: "cats" | "brands" | "price", current: string[], value: string) =>
    setParam(key, current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);

  const activeCount = selectedCategories.length + selectedBrands.length + selectedPrices.length;
  const hasActiveFilters = activeCount > 0 || Boolean(search);

  const clearAll = () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    router.push(`${pathname}${params.size > 0 ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  // Human-readable chips for active filters
  const chips = useMemo(() => {
    const flat = new Map<string, string>();
    for (const c of categories) {
      flat.set(String(c.id), c.title);
      for (const ch of c.children) flat.set(String(ch.id), ch.title);
    }
    const brandMap = new Map(brands.map((b) => [String(b.id), b.name]));
    return [
      ...selectedCategories.map((id) => ({ key: "cats" as const, value: id, label: flat.get(id) ?? id })),
      ...selectedBrands.map((id) => ({ key: "brands" as const, value: id, label: brandMap.get(id) ?? id })),
      ...selectedPrices.map((p) => ({ key: "price" as const, value: p, label: p.replace(/Rs\. ?/g, "₹") })),
    ];
  }, [categories, brands, selectedCategories, selectedBrands, selectedPrices]);

  const panel = (
    <FilterPanel
      categories={categories}
      brands={brands}
      selectedCategories={selectedCategories}
      selectedBrands={selectedBrands}
      selectedPrices={selectedPrices}
      onToggleCategory={(id) => toggle("cats", selectedCategories, String(id))}
      onToggleBrand={(id) => toggle("brands", selectedBrands, String(id))}
      onTogglePrice={(label) => toggle("price", selectedPrices, label)}
    />
  );

  return (
    <>
      {/* Mobile trigger + chips */}
      <div className="md:hidden">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-10 rounded-lg">
                <SlidersHorizontal aria-hidden /> Filters
                {activeCount > 0 && (
                  <span className="ml-1 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {activeCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[88vw] max-w-sm flex-col gap-0 p-0">
              <SheetHeader className="border-b px-5 py-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <SlidersHorizontal className="size-4 text-primary" aria-hidden /> Filters
                </SheetTitle>
                <SheetDescription className="sr-only">Refine the product list</SheetDescription>
              </SheetHeader>
              <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-2">{panel}</div>
              {hasActiveFilters && (
                <div className="border-t p-4">
                  <Button variant="outline" className="w-full" onClick={clearAll}>
                    <X aria-hidden /> Clear all filters
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
          {hasActiveFilters && (
            <button onClick={clearAll} className="text-xs font-semibold text-primary hover:underline">
              Clear all
            </button>
          )}
        </div>
        {chips.length > 0 && <ActiveChips chips={chips} onRemove={(c) => toggle(c.key, multi(c.key), c.value)} className="mt-3" />}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-full shrink-0 md:block md:w-64 lg:w-72">
        <div className="sticky top-20 space-y-4">
          <div className="rounded-2xl bg-card ring-1 ring-foreground/[0.07]">
            <div className="flex items-center justify-between border-b px-5 py-3.5">
              <h2 className="flex items-center gap-2 text-sm font-extrabold tracking-tight">
                <SlidersHorizontal className="size-4 text-primary" aria-hidden /> Filters
                {activeCount > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {activeCount}
                  </span>
                )}
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
                >
                  <X className="size-3.5" aria-hidden /> Clear
                </button>
              )}
            </div>
            {chips.length > 0 && (
              <ActiveChips
                chips={chips}
                onRemove={(c) => toggle(c.key, multi(c.key), c.value)}
                className="border-b px-5 py-3"
              />
            )}
            <div className="px-5 py-1">{panel}</div>
          </div>

          {/* Quick category links */}
          <div className="rounded-2xl bg-brand-charcoal p-5 text-white">
            <p className="eyebrow text-brand-amber">Need it branded?</p>
            <p className="mt-2 text-sm font-semibold leading-snug">
              Logo print, engraving and custom packaging on every product.
            </p>
            <Button asChild variant="glass" size="sm" className="mt-4 w-full">
              <Link href="/contact-us">Talk to a gifting manager</Link>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function ActiveChips({
  chips,
  onRemove,
  className,
}: {
  chips: { key: "cats" | "brands" | "price"; value: string; label: string }[];
  onRemove: (chip: { key: "cats" | "brands" | "price"; value: string }) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.value}`}
          onClick={() => onRemove(chip)}
          className="group/chip inline-flex items-center gap-1 rounded-full bg-primary/[0.08] py-1 pr-1.5 pl-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          aria-label={`Remove filter ${chip.label}`}
        >
          {chip.label}
          <span className="grid size-4 place-items-center rounded-full bg-primary/10 group-hover/chip:bg-white/20">
            <X className="size-2.5" aria-hidden />
          </span>
        </button>
      ))}
    </div>
  );
}

function FilterPanel({
  categories,
  brands,
  selectedCategories,
  selectedBrands,
  selectedPrices,
  onToggleCategory,
  onToggleBrand,
  onTogglePrice,
}: {
  categories: CategoryNode[];
  brands: BrandOption[];
  selectedCategories: string[];
  selectedBrands: string[];
  selectedPrices: string[];
  onToggleCategory: (id: number) => void;
  onToggleBrand: (id: number) => void;
  onTogglePrice: (label: string) => void;
}) {
  const [showAllBrands, setShowAllBrands] = useState(false);
  const visibleBrands = showAllBrands ? brands : brands.slice(0, 8);

  return (
    <Accordion type="multiple" defaultValue={["categories", "price", "brands"]} className="w-full">
      <AccordionItem value="categories">
        <AccordionTrigger className="py-3.5 text-[13px] font-bold tracking-tight hover:no-underline">
          Categories
        </AccordionTrigger>
        <AccordionContent className="pb-3">
          {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
          <div className="space-y-1">
            {categories.map((category) => (
              <div key={category.id}>
                <FilterRow
                  id={`cat-${category.id}`}
                  label={category.title}
                  checked={selectedCategories.includes(String(category.id))}
                  onChange={() => onToggleCategory(category.id)}
                  strong
                />
                {category.children.length > 0 && (
                  <div className="ml-3 border-l border-border/80 pl-3">
                    {category.children.map((child) => (
                      <FilterRow
                        key={child.id}
                        id={`cat-${child.id}`}
                        label={child.title}
                        checked={selectedCategories.includes(String(child.id))}
                        onChange={() => onToggleCategory(child.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="price">
        <AccordionTrigger className="py-3.5 text-[13px] font-bold tracking-tight hover:no-underline">
          Price per piece
        </AccordionTrigger>
        <AccordionContent className="pb-3">
          <div className="grid grid-cols-2 gap-2">
            {PRICE_FILTER_OPTIONS.map((option) => {
              const active = selectedPrices.includes(option.label);
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => onTogglePrice(option.label)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-[12.5px] font-semibold transition-all",
                    active
                      ? "border-primary bg-primary/[0.06] text-primary"
                      : "border-border text-foreground/80 hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Tag className="size-3.5 opacity-70" aria-hidden />
                    {option.label.replace(/Rs\. ?/g, "₹")}
                  </span>
                  {active && <Check className="size-3.5" aria-hidden />}
                </button>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="brands" className="border-b-0">
        <AccordionTrigger className="py-3.5 text-[13px] font-bold tracking-tight hover:no-underline">
          Brand
        </AccordionTrigger>
        <AccordionContent className="pb-3">
          {brands.length === 0 && <p className="text-sm text-muted-foreground">No brands yet.</p>}
          <div className="space-y-0.5">
            {visibleBrands.map((brand) => (
              <FilterRow
                key={brand.id}
                id={`brand-${brand.id}`}
                label={brand.name}
                checked={selectedBrands.includes(String(brand.id))}
                onChange={() => onToggleBrand(brand.id)}
              />
            ))}
          </div>
          {brands.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllBrands((v) => !v)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              {showAllBrands ? (
                <>
                  Show less <ChevronUp className="size-3.5" aria-hidden />
                </>
              ) : (
                <>
                  Show all {brands.length} brands <ChevronDown className="size-3.5" aria-hidden />
                </>
              )}
            </button>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function FilterRow({
  id,
  label,
  checked,
  onChange,
  strong = false,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/70",
        checked && "bg-primary/[0.05]"
      )}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <Label
        htmlFor={id}
        className={cn(
          "flex-1 cursor-pointer leading-tight",
          strong ? "text-[13.5px] font-semibold text-foreground" : "text-[13px] font-medium text-foreground/75",
          checked && "text-primary"
        )}
      >
        {label}
      </Label>
    </div>
  );
}
