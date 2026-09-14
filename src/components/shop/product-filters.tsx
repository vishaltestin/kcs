"use client";

import { useMemo, useState, useTransition } from "react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, ChevronDown, ChevronUp, SlidersHorizontal, Tag, X } from "lucide-react";

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
  const [, startTransition] = useTransition();

  type FilterKey = "cats" | "brands" | "price";

  /**
   * The URL is the source of truth (listings stay server-rendered and
   * shareable), but a tick only landed once the filtered page had been
   * re-rendered on the server — half a second or more of dead checkbox.
   *
   * So each click parks an *optimistic* value for its param and the control
   * reads from that immediately; the override is dropped the moment the URL
   * catches up with it (that check runs during render, which is React's
   * "adjust state when a value changes" pattern rather than an effect).
   * `startTransition` keeps the navigation from blocking the click at all.
   */
  type Override = { expected: string | null; values: string[] };
  const [overrides, setOverrides] = useState<Partial<Record<FilterKey, Override>>>({});

  const fromUrl = (key: FilterKey) => searchParams.get(key)?.split(",").filter(Boolean) ?? [];

  const stale = (Object.keys(overrides) as FilterKey[]).filter(
    (key) => (searchParams.get(key) ?? null) === overrides[key]?.expected
  );
  if (stale.length > 0) {
    const next = { ...overrides };
    for (const key of stale) delete next[key];
    setOverrides(next);
  }

  const selectedCategories = overrides.cats?.values ?? fromUrl("cats");
  const selectedBrands = overrides.brands?.values ?? fromUrl("brands");
  const selectedPrices = overrides.price?.values ?? fromUrl("price");
  const selected: Record<FilterKey, string[]> = {
    cats: selectedCategories,
    brands: selectedBrands,
    price: selectedPrices,
  };
  const search = searchParams.get("q") ?? "";

  const pushParams = (params: URLSearchParams) => {
    startTransition(() => {
      router.push(`${pathname}${params.size > 0 ? `?${params.toString()}` : ""}`, { scroll: false });
    });
  };

  const toggle = (key: FilterKey, current: string[], value: string) => {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    const params = new URLSearchParams(searchParams.toString());
    if (next.length > 0) {
      params.set(key, next.join(","));
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset pagination when filters change
    setOverrides((prev) => ({ ...prev, [key]: { expected: next.length > 0 ? next.join(",") : null, values: next } }));
    pushParams(params);
  };

  const activeCount = selectedCategories.length + selectedBrands.length + selectedPrices.length;
  const hasActiveFilters = activeCount > 0 || Boolean(search);

  const clearAll = () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    setOverrides({
      cats: { expected: null, values: [] },
      brands: { expected: null, values: [] },
      price: { expected: null, values: [] },
    });
    pushParams(params);
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
        {chips.length > 0 && <ActiveChips chips={chips} onRemove={(c) => toggle(c.key, selected[c.key], c.value)} className="mt-3" />}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-full shrink-0 md:block md:w-56 lg:w-60 xl:w-64">
        <div className="sticky top-20 space-y-8">
          <div>
            <div className="flex items-center justify-between border-b border-foreground/[0.12] pb-3">
              <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground">
                <SlidersHorizontal className="size-3.5 text-primary" aria-hidden /> Refine
                {activeCount > 0 && (
                  <span className="numeral grid size-5 place-items-center rounded-full bg-primary text-[11px] text-primary-foreground">
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
                onRemove={(c) => toggle(c.key, selected[c.key], c.value)}
                className="border-b border-foreground/[0.08] py-3"
              />
            )}
            <div>{panel}</div>
          </div>

          {/* Branding note */}
          <div className="border-t-2 border-primary pt-4">
            <p className="kicker text-primary">Need it branded?</p>
            <p className="mt-2 text-[13.5px] leading-snug text-foreground/80">
              Logo print, engraving and custom packaging on every product.
            </p>
            <Link
              href="/contact-us"
              className="group/brand mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground transition-colors hover:text-primary"
            >
              <span className="underline decoration-foreground/25 underline-offset-[5px] group-hover/brand:decoration-primary">
                Talk to a gifting manager
              </span>
              <ArrowRight className="size-3.5 transition-transform group-hover/brand:translate-x-0.5" aria-hidden />
            </Link>
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
          className="group/chip inline-flex items-center gap-1 rounded-md bg-foreground py-1 pr-1.5 pl-2.5 text-xs font-semibold text-background transition-colors hover:bg-primary"
          aria-label={`Remove filter ${chip.label}`}
        >
          {chip.label}
          <span className="grid size-4 place-items-center rounded-full bg-white/15">
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
        <AccordionTrigger className="py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80 hover:no-underline">
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
        <AccordionTrigger className="py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80 hover:no-underline">
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
                    "flex items-center justify-between rounded-md border px-3 py-2 text-left text-[12.5px] font-medium transition-all",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-foreground/80 hover:border-foreground/50 hover:text-foreground"
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
        <AccordionTrigger className="py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/80 hover:no-underline">
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
