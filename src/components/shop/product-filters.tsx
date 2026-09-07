"use client";

import { useCallback } from "react";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, X } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PRICE_FILTER_OPTIONS } from "@/lib/constants";
import type { CategoryNode } from "@/types";

type BrandOption = { id: number; name: string };

/**
 * URL-driven filter sidebar. All state lives in searchParams so listings are
 * server-rendered, shareable and crawlable.
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

  const toggleCategory = (id: number) => {
    const current = selectedCategories;
    setParam(
      "cats",
      current.includes(String(id))
        ? current.filter((c) => c !== String(id))
        : [...current, String(id)]
    );
  };

  const toggleBrand = (id: number) => {
    const current = selectedBrands;
    setParam(
      "brands",
      current.includes(String(id))
        ? current.filter((b) => b !== String(id))
        : [...current, String(id)]
    );
  };

  const togglePrice = (label: string) => {
    const current = selectedPrices;
    setParam(
      "price",
      current.includes(label) ? current.filter((p) => p !== label) : [...current, label]
    );
  };

  const hasActiveFilters =
    selectedCategories.length > 0 || selectedBrands.length > 0 || selectedPrices.length > 0 || Boolean(search);

  const clearAll = () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    router.push(`${pathname}${params.size > 0 ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  return (
    <div className="w-full md:w-1/4 space-y-6">
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <X className="h-3.5 w-3.5" aria-hidden /> Clear all filters
        </button>
      )}

      <Accordion type="multiple" defaultValue={["categories", "price", "brands"]} className="space-y-4">
        <AccordionItem value="categories" className="border-b-0">
          <AccordionTrigger className="font-semibold text-lg py-2 hover:no-underline">
            Categories
          </AccordionTrigger>
          <AccordionContent>
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">No categories yet.</p>
            )}
            {categories.map((category) => (
              <div key={category.id} className="space-y-3 ml-1 my-3">
                <div className="flex items-start">
                  <Checkbox
                    id={`cat-${category.id}`}
                    checked={selectedCategories.includes(String(category.id))}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <Label
                    htmlFor={`cat-${category.id}`}
                    className="ml-2 text-base leading-tight text-slate-600 font-semibold cursor-pointer"
                  >
                    {category.title}
                  </Label>
                </div>

                {category.children.map((child) => (
                  <div key={child.id} className="ml-4 flex items-start mt-1">
                    <Checkbox
                      id={`cat-${child.id}`}
                      checked={selectedCategories.includes(String(child.id))}
                      onCheckedChange={() => toggleCategory(child.id)}
                    />
                    <Label
                      htmlFor={`cat-${child.id}`}
                      className="ml-2 text-sm font-semibold text-slate-600 leading-tight cursor-pointer"
                    >
                      {child.title}
                    </Label>
                  </div>
                ))}
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price" className="border-b-0">
          <AccordionTrigger className="font-semibold text-lg py-2 hover:no-underline">
            Price
          </AccordionTrigger>
          <AccordionContent>
            {PRICE_FILTER_OPTIONS.map((option) => (
              <div key={option.label} className="ml-1 my-2 flex items-center">
                <Checkbox
                  id={`price-${option.min}`}
                  checked={selectedPrices.includes(option.label)}
                  onCheckedChange={() => togglePrice(option.label)}
                />
                <Label
                  htmlFor={`price-${option.min}`}
                  className="ml-2 text-base leading-tight text-slate-600 font-semibold cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="brands" className="border-b-0">
          <AccordionTrigger className="font-semibold text-lg py-2 hover:no-underline">
            Brand
          </AccordionTrigger>
          <AccordionContent>
            {brands.length === 0 && (
              <p className="text-sm text-muted-foreground">No brands yet.</p>
            )}
            {brands.map((brand) => (
              <div key={brand.id} className="flex items-center ml-1 my-2">
                <Checkbox
                  id={`brand-${brand.id}`}
                  checked={selectedBrands.includes(String(brand.id))}
                  onCheckedChange={() => toggleBrand(brand.id)}
                />
                <Label
                  htmlFor={`brand-${brand.id}`}
                  className="ml-2 text-base leading-tight text-slate-600 font-semibold cursor-pointer"
                >
                  {brand.name}
                </Label>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Mobile: category quick links */}
      <div className="md:hidden pt-2 border-t">
        <p className="text-sm font-semibold mb-2">Popular categories</p>
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 6).map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="text-xs bg-muted hover:bg-primary hover:text-primary-foreground rounded-full px-3 py-1 transition-colors"
            >
              {category.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
