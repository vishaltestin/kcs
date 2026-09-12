"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { AlertCircle, ChevronDown, Copy, Layers3, Plus, RefreshCw, Sparkles, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ImagePicker } from "@/components/admin/image-picker";
import { NumberField } from "@/components/admin/number-field";
import type { productSchema, PricingModeValue } from "@/lib/validations/admin";
import { attributeKey, combinations, mergeVariants, resolveVariantTiers, type OptionAxis, type VariantInput } from "@/lib/variants";
import { formatGrams } from "@/lib/shipping";
import { swatchFor as storefrontSwatch } from "@/components/shop/variant-selector";
import { cn, formatCurrency } from "@/lib/utils";

type Values = z.infer<typeof productSchema>;

const AXIS_PRESETS: { name: string; values: string[] }[] = [
  { name: "Colour", values: ["Black", "White", "Navy", "Red", "Grey", "Maroon", "Royal Blue", "Green"] },
  { name: "Size", values: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] },
  { name: "Material", values: ["Cotton", "Polyester", "Dry-fit", "Leather", "PU", "Steel"] },
  { name: "Capacity", values: ["350 ml", "500 ml", "750 ml", "1 L"] },
];

function suggestionsFor(name: string): string[] {
  const preset = AXIS_PRESETS.find((p) => p.name.toLowerCase() === name.trim().toLowerCase());
  return preset?.values ?? [];
}

/**
 * Swatch for colour-like axes. Uses the same deterministic name table as the
 * storefront selector so server and client render identical markup.
 */
function swatchFor(axis: string, value: string): string | null {
  if (!/colou?r/i.test(axis)) return null;
  return storefrontSwatch(value);
}

function emptyTier(minQuantity: number): VariantInput["prices"][number] {
  return { minQuantity, price: undefined, mrp: undefined } as unknown as VariantInput["prices"][number];
}

export function VariantsEditor({
  form,
  pricingMode,
  productWeightGrams,
}: {
  form: UseFormReturn<Values>;
  pricingMode: PricingModeValue;
  productWeightGrams: number | undefined;
}) {
  const hasVariants = form.watch("hasVariants");
  const variantPricing = form.watch("variantPricing") ?? "SHARED";
  const options = form.watch("options");
  const variants = form.watch("variants");
  const productTiers = form.watch("prices") ?? [];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const shared = variantPricing === "SHARED";
  // Only tiers the admin has finished typing feed the "effective price"
  // preview; a blank MRP/price box must never take the editor down.
  const validProductTiers = productTiers.filter(
    (t) => t && Number.isFinite(Number(t.price)) && Number(t.price) > 0 && Number.isFinite(Number(t.minQuantity)),
  );

  const axes: OptionAxis[] = (options ?? []).map((o) => ({ name: o.name, values: o.values }));
  const comboCount = combinations(axes).length;
  const currentKeys = new Set((variants ?? []).map((v) => attributeKey(v.attributes, axes)));
  const generatedKeys = combinations(axes).map((attrs) => attributeKey(attrs, axes));
  const outOfSync =
    hasVariants &&
    comboCount > 0 &&
    (generatedKeys.some((k) => !currentKeys.has(k)) || (variants ?? []).length !== generatedKeys.length);

  const setOptions = (next: OptionAxis[]) => form.setValue("options", next, { shouldDirty: true, shouldValidate: false });
  const setVariants = (next: VariantInput[]) =>
    form.setValue("variants", next as Values["variants"], { shouldDirty: true, shouldValidate: false });

  const regenerate = () => {
    const template = { prices: (form.getValues("prices") ?? []).filter((t) => t && Number.isFinite(t.price)) };
    const next = mergeVariants(axes, (form.getValues("variants") ?? []) as VariantInput[], template);
    setVariants(next);
    form.clearErrors(["variants", "options"]);
  };

  const errors = form.formState.errors;
  const variantsError =
    (typeof errors.variants?.message === "string" && errors.variants.message) ||
    (typeof errors.variants?.root?.message === "string" && errors.variants.root.message) ||
    null;
  // Field-level problems inside rows (a blank stock, a tier without a price…)
  // are summarised here so the admin knows *which* variant is red and why.
  const rowProblems = collectRowProblems(errors.variants, variants ?? []);
  const optionsError =
    (typeof errors.options?.message === "string" && errors.options.message) ||
    (typeof errors.options?.root?.message === "string" && errors.options.root.message) ||
    null;

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <FormField
        control={form.control}
        name="hasVariants"
        render={({ field }) => (
          <FormItem>
            <button
              type="button"
              role="switch"
              aria-checked={field.value}
              onClick={() => {
                const next = !field.value;
                field.onChange(next);
                if (next && (form.getValues("options") ?? []).length === 0) {
                  setOptions([{ name: "Colour", values: [] }]);
                }
              }}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all",
                field.value ? "border-primary bg-primary/[0.05] ring-2 ring-primary/20" : "border-border hover:border-primary/40 hover:bg-muted/40",
              )}
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-lg",
                  field.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                <Layers3 className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">This product comes in variants</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  Colour, size, capacity… Each variant gets its own SKU, stock, image, price tiers and weight. Customers
                  pick a variant before adding to cart.
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  field.value ? "bg-primary" : "bg-muted-foreground/30",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                    field.value && "translate-x-5",
                  )}
                />
              </span>
            </button>
          </FormItem>
        )}
      />

      {hasVariants && (
        <>
          {/* Option axes */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Options</p>
                <p className="text-xs text-muted-foreground">
                  Add the axes customers choose from. Press Enter or comma to add a value.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AXIS_PRESETS.filter((p) => !axes.some((a) => a.name.toLowerCase() === p.name.toLowerCase())).map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setOptions([...axes, { name: p.name, values: [] }])}
                    className="rounded-full border border-dashed px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    + {p.name}
                  </button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOptions([...axes, { name: "", values: [] }])}
                >
                  <Plus aria-hidden /> Custom
                </Button>
              </div>
            </div>

            {axes.length === 0 && (
              <p className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                No options yet — add Colour, Size or a custom axis.
              </p>
            )}

            {axes.map((axis, index) => (
              <AxisRow
                key={index}
                axis={axis}
                onChange={(next) => setOptions(axes.map((a, i) => (i === index ? next : a)))}
                onRemove={() => setOptions(axes.filter((_, i) => i !== index))}
              />
            ))}
            {optionsError && <p className="text-sm text-destructive">{optionsError}</p>}
            <datalist id="kcs-axis-names">
              {AXIS_PRESETS.map((p) => (
                <option key={p.name} value={p.name} />
              ))}
            </datalist>
          </div>

          {/* Pricing strategy */}
          {pricingMode !== "ENQUIRY" && (
            <FormField
              control={form.control}
              name="variantPricing"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold">How are variants priced?</p>
                    <p className="text-xs text-muted-foreground">
                      Most apparel shares one price list — only a size surcharge differs. Switch to custom when
                      every variant needs its own table.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Variant pricing">
                    {(
                      [
                        {
                          value: "SHARED",
                          title: "Shared price list",
                          text:
                            pricingMode === "SINGLE"
                              ? "The product price applies to every variant. Add a ₹ adjustment per variant if needed (e.g. +₹30 for XXL)."
                              : "The product's tiers apply to every variant. Add a ₹ adjustment per variant if needed (e.g. +₹30 for XXL).",
                        },
                        {
                          value: "CUSTOM",
                          title: "Custom per variant",
                          text: "Each variant has its own price table. Use “Copy to all variants” to start from one and tweak.",
                        },
                      ] as const
                    ).map((opt) => {
                      const selected = field.value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => {
                            field.onChange(opt.value);
                            form.clearErrors(["variants", "prices"]);
                            if (opt.value === "CUSTOM") {
                              // Seed empty custom tables from the shared list so nothing starts blank.
                              const current = (form.getValues("variants") ?? []) as VariantInput[];
                              setVariants(
                                current.map((v) =>
                                  v.prices?.length
                                    ? v
                                    : { ...v, prices: resolveVariantTiers("SHARED", validProductTiers, v) },
                                ),
                              );
                            }
                          }}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                            selected
                              ? "border-primary bg-primary/[0.05] ring-2 ring-primary/20"
                              : "border-border hover:border-primary/40 hover:bg-muted/40",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2",
                              selected ? "border-primary" : "border-muted-foreground/40",
                            )}
                            aria-hidden
                          >
                            {selected && <span className="size-2 rounded-full bg-primary" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{opt.title}</span>
                            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{opt.text}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {shared && validProductTiers.length === 0 && (
                    <p className="flex items-start gap-2 rounded-lg bg-brand-amber/10 px-3 py-2 text-xs text-amber-900 ring-1 ring-brand-amber/40">
                      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
                      Enter the product price{pricingMode === "BULK" ? " tiers" : ""} in the Pricing card above — every
                      variant will use {pricingMode === "BULK" ? "them" : "it"}.
                    </p>
                  )}
                  {shared && validProductTiers.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Shared list:{" "}
                      {validProductTiers
                        .slice()
                        .sort((a, b) => a.minQuantity - b.minQuantity)
                        .map((t) => `${pricingMode === "SINGLE" ? "" : `${t.minQuantity}+ `}${formatCurrency(t.price)}`)
                        .join(" · ")}
                    </p>
                  )}
                </FormItem>
              )}
            />
          )}

          {/* Generate */}
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3",
              outOfSync ? "bg-brand-amber/10 ring-1 ring-brand-amber/40" : "bg-surface ring-1 ring-foreground/[0.06]",
            )}
          >
            <p className="text-sm">
              {comboCount === 0 ? (
                <span className="text-muted-foreground">Add at least one value per option to generate variants.</span>
              ) : outOfSync ? (
                <>
                  <strong>{comboCount}</strong> combination{comboCount === 1 ? "" : "s"} available — refresh to sync. Existing
                  SKUs, stock and prices are kept.
                </>
              ) : (
                <>
                  <strong>{variants?.length ?? 0}</strong> variant{variants?.length === 1 ? "" : "s"} in sync with the options.
                </>
              )}
            </p>
            <Button type="button" size="sm" variant={outOfSync ? "default" : "outline"} disabled={comboCount === 0} onClick={regenerate}>
              {outOfSync ? <Sparkles aria-hidden /> : <RefreshCw aria-hidden />}
              {(variants?.length ?? 0) === 0 ? "Generate variants" : "Refresh variants"}
            </Button>
          </div>

          {/* Variant rows */}
          {(variants?.length ?? 0) > 0 && (
            <div className="overflow-hidden rounded-xl ring-1 ring-foreground/[0.07]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-sm">
                  <thead className="bg-surface text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    <tr>
                      <th className="w-10 px-3 py-2.5">
                        <span className="sr-only">Active</span>
                      </th>
                      <th className="px-3 py-2.5">Variant</th>
                      <th className="w-40 px-3 py-2.5">SKU</th>
                      <th className="w-24 px-3 py-2.5">Stock</th>
                      {pricingMode !== "ENQUIRY" && shared && (
                        <>
                          <th className="w-28 px-3 py-2.5">Adjust ₹</th>
                          <th className="px-3 py-2.5">Effective price</th>
                        </>
                      )}
                      {pricingMode === "SINGLE" && !shared && (
                        <>
                          <th className="w-28 px-3 py-2.5">Price ₹</th>
                          <th className="w-28 px-3 py-2.5">MRP ₹</th>
                        </>
                      )}
                      {pricingMode === "BULK" && !shared && <th className="px-3 py-2.5">Tiers</th>}
                      <th className="w-28 px-3 py-2.5">Weight g</th>
                      <th className="w-12 px-3 py-2.5">
                        <span className="sr-only">Details</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {variants.map((variant, index) => {
                      const key = attributeKey(variant.attributes, axes);
                      const open = !!expanded[key];
                      const tiers = variant.prices ?? [];
                      return (
                        <VariantRows
                          key={key}
                          form={form}
                          index={index}
                          axes={axes}
                          variant={variant as VariantInput}
                          tiers={tiers}
                          open={open}
                          pricingMode={pricingMode}
                          shared={shared}
                          productTiers={validProductTiers}
                          problems={rowProblems.get(index)}
                          productWeightGrams={productWeightGrams}
                          onToggle={() => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))}
                          onCopyPricesToAll={() => {
                            const src = form.getValues(`variants.${index}.prices`) ?? [];
                            setVariants(
                              (form.getValues("variants") as VariantInput[]).map((v) => ({
                                ...v,
                                prices: src.map((t) => ({ ...t })),
                              })),
                            );
                          }}
                          onRemove={() => setVariants((form.getValues("variants") as VariantInput[]).filter((_, i) => i !== index))}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {(variantsError || rowProblems.size > 0) && (
            <div className="rounded-xl bg-destructive/[0.05] px-4 py-3 text-sm text-destructive ring-1 ring-destructive/25">
              <p className="flex items-center gap-2 font-semibold">
                <AlertCircle className="size-4" aria-hidden />
                {variantsError ?? "Some variants need attention"}
              </p>
              {rowProblems.size > 0 && (
                <ul className="mt-1.5 list-disc space-y-0.5 pl-6 text-[13px]">
                  {Array.from(rowProblems.entries())
                    .slice(0, 8)
                    .map(([index, messages]) => (
                      <li key={index}>
                        <span className="font-medium">{variants?.[index]?.label ?? `Variant ${index + 1}`}:</span>{" "}
                        {messages.join(" · ")}
                      </li>
                    ))}
                  {rowProblems.size > 8 && <li>…and {rowProblems.size - 8} more</li>}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

type RowErrors = Record<string, unknown> | undefined;

/** Flatten RHF's nested error tree for `variants` into per-row human messages. */
function collectRowProblems(errors: unknown, variants: { label: string }[]): Map<number, string[]> {
  const out = new Map<number, string[]>();
  if (!errors || typeof errors !== "object") return out;
  const FIELD_LABELS: Record<string, string> = {
    stock: "stock",
    sku: "SKU",
    priceDelta: "adjustment",
    minQuantity: "min qty",
    price: "price",
    mrp: "MRP",
    weightGrams: "weight",
    image: "image",
  };
  const walk = (node: unknown, path: string[], sink: string[]) => {
    if (!node || typeof node !== "object") return;
    const rec = node as Record<string, unknown>;
    if (typeof rec.message === "string" && path.length) {
      const leaf = path.filter((p) => !/^\d+$/.test(p)).at(-1) ?? "";
      const tierIndex = path.length >= 2 && path[0] === "prices" ? Number(path[1]) + 1 : null;
      const where = tierIndex ? `tier ${tierIndex} ${FIELD_LABELS[leaf] ?? leaf}` : FIELD_LABELS[leaf] ?? leaf;
      sink.push(`${where} — ${rec.message}`);
      return;
    }
    for (const [key, value] of Object.entries(rec)) {
      if (key === "ref" || key === "type" || key === "types") continue;
      walk(value, [...path, key], sink);
    }
  };
  variants.forEach((_, index) => {
    const rowErrors = (errors as Record<string, RowErrors>)[index];
    if (!rowErrors) return;
    const sink: string[] = [];
    walk(rowErrors, [], sink);
    if (sink.length) out.set(index, Array.from(new Set(sink)));
  });
  return out;
}

/* -------------------------------------------------------------------------- */

function AxisRow({
  axis,
  onChange,
  onRemove,
}: {
  axis: OptionAxis;
  onChange: (next: OptionAxis) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState("");
  const suggestions = suggestionsFor(axis.name).filter((s) => !axis.values.includes(s));

  const addValues = (raw: string) => {
    const parts = raw
      .split(/[,\n]/)
      .map((v) => v.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const merged = Array.from(new Set([...axis.values, ...parts]));
    onChange({ ...axis, values: merged });
    setDraft("");
  };

  return (
    <div className="rounded-xl border p-3.5">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_1fr_auto] sm:items-start">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Option name</label>
          <Input
            value={axis.name}
            onChange={(e) => onChange({ ...axis, name: e.target.value })}
            placeholder="Colour"
            list="kcs-axis-names"
          />
        </div>
        <div className="min-w-0">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Values</label>
          <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring/40">
            {axis.values.map((value) => {
              const swatch = swatchFor(axis.name, value);
              return (
                <span
                  key={value}
                  className="inline-flex items-center gap-1.5 rounded-md bg-surface px-2 py-0.5 text-xs font-medium ring-1 ring-foreground/[0.08]"
                >
                  {swatch && <span className="size-2.5 rounded-full ring-1 ring-black/10" style={{ background: swatch }} aria-hidden />}
                  {value}
                  <button
                    type="button"
                    aria-label={`Remove ${value}`}
                    onClick={() => onChange({ ...axis, values: axis.values.filter((v) => v !== value) })}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              );
            })}
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addValues(draft);
                } else if (e.key === "Backspace" && draft === "" && axis.values.length) {
                  onChange({ ...axis, values: axis.values.slice(0, -1) });
                }
              }}
              onBlur={() => draft.trim() && addValues(draft)}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (/[,\n]/.test(text)) {
                  e.preventDefault();
                  addValues(text);
                }
              }}
              placeholder={axis.values.length ? "Add another…" : "Type a value and press Enter"}
              className="min-w-[8rem] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          {suggestions.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addValues(s)}
                  className="rounded-full border border-dashed px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button type="button" variant="outline" size="icon" className="sm:mt-6" onClick={onRemove} aria-label={`Remove option ${axis.name || ""}`}>
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function VariantRows({
  form,
  index,
  axes,
  variant,
  tiers,
  open,
  pricingMode,
  shared,
  productTiers,
  problems,
  productWeightGrams,
  onToggle,
  onCopyPricesToAll,
  onRemove,
}: {
  form: UseFormReturn<Values>;
  index: number;
  axes: OptionAxis[];
  variant: VariantInput;
  tiers: VariantInput["prices"];
  open: boolean;
  pricingMode: PricingModeValue;
  shared: boolean;
  productTiers: VariantInput["prices"];
  problems: string[] | undefined;
  productWeightGrams: number | undefined;
  onToggle: () => void;
  onCopyPricesToAll: () => void;
  onRemove: () => void;
}) {
  const inactive = !variant.isActive;
  const priceCols = pricingMode === "ENQUIRY" ? 0 : shared ? 2 : pricingMode === "SINGLE" ? 2 : 1;
  const colSpan = 6 + priceCols;
  const rowErrors = problems && problems.length > 0;
  // The adjustment box may hold "" / "-" while the admin is typing — treat anything non-finite as 0.
  const delta = Number.isFinite(Number(variant.priceDelta)) ? Number(variant.priceDelta) : 0;
  const effective = shared && pricingMode !== "ENQUIRY" ? resolveVariantTiers("SHARED", productTiers, variant) : [];

  const setTiers = (next: VariantInput["prices"]) =>
    form.setValue(`variants.${index}.prices`, next as Values["variants"][number]["prices"], { shouldDirty: true });

  return (
    <>
      <tr
        className={cn("align-top transition-colors", inactive && "bg-muted/30 text-muted-foreground", rowErrors && "bg-destructive/[0.05]")}
        title={rowErrors ? problems.join("\n") : undefined}
      >
        <td className="px-3 py-2.5">
          <FormField
            control={form.control}
            name={`variants.${index}.isActive`}
            render={({ field }) => (
              <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} aria-label={`${variant.label} active`} className="mt-2" />
            )}
          />
        </td>
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            {variant.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={variant.image} alt="" className="size-9 shrink-0 rounded-md object-cover ring-1 ring-foreground/10" />
            ) : (
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-surface text-[10px] font-semibold text-muted-foreground ring-1 ring-foreground/[0.06]">
                IMG
              </span>
            )}
            <div className="min-w-0">
              <p className={cn("truncate font-semibold", inactive && "line-through decoration-muted-foreground/60")}>{variant.label}</p>
              {rowErrors && (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-destructive">
                  <AlertCircle className="size-3" aria-hidden /> {problems[0]}
                </p>
              )}
              <p className="mt-0.5 flex flex-wrap gap-1">
                {axes.map((a) => {
                  const value = variant.attributes[a.name];
                  const swatch = swatchFor(a.name, value ?? "");
                  return (
                    <span key={a.name} className="inline-flex items-center gap-1 rounded bg-surface px-1.5 py-px text-[10.5px] text-muted-foreground ring-1 ring-foreground/[0.06]">
                      {swatch && <span className="size-2 rounded-full ring-1 ring-black/10" style={{ background: swatch }} aria-hidden />}
                      {a.name}: <span className="font-medium text-foreground">{value}</span>
                    </span>
                  );
                })}
              </p>
            </div>
          </div>
        </td>
        <td className="px-3 py-2.5">
          <FormField
            control={form.control}
            name={`variants.${index}.sku`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="KCS-TS-RED-L" className="h-9 font-mono text-xs uppercase" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </td>
        <td className="px-3 py-2.5">
          <FormField
            control={form.control}
            name={`variants.${index}.stock`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <NumberField field={field} integer min={0} placeholder="0" className="h-9" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </td>
        {pricingMode !== "ENQUIRY" && shared && (
          <>
            <td className="px-3 py-2.5">
              <FormField
                control={form.control}
                name={`variants.${index}.priceDelta`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <NumberField
                        field={{ ...field, value: field.value === 0 ? undefined : field.value } as typeof field}
                        allowNegative
                        placeholder="0"
                        className="h-9"
                        aria-label={`Price adjustment for ${variant.label}`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </td>
            <td className="px-3 py-2.5">
              {effective.length === 0 ? (
                <span className="text-xs text-muted-foreground">Set the product price first</span>
              ) : (
                <span className="flex flex-wrap gap-1">
                  {effective.map((t) => (
                    <span key={t.minQuantity} className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] tabular-nums ring-1 ring-foreground/[0.06]">
                      {pricingMode === "BULK" ? `${t.minQuantity}+ ` : ""}
                      {formatCurrency(t.price)}
                      {delta !== 0 && (
                        <span className={cn("ml-1", delta > 0 ? "text-amber-700" : "text-success")}>
                          ({delta > 0 ? "+" : "−"}
                          {formatCurrency(Math.abs(delta))})
                        </span>
                      )}
                    </span>
                  ))}
                </span>
              )}
            </td>
          </>
        )}
        {pricingMode === "SINGLE" && !shared && (
          <>
            <td className="px-3 py-2.5">
              <FormField
                control={form.control}
                name={`variants.${index}.prices.0.price`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <NumberField field={field} min={0.01} placeholder="749" className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </td>
            <td className="px-3 py-2.5">
              <FormField
                control={form.control}
                name={`variants.${index}.prices.0.mrp`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <NumberField field={field} min={0.01} placeholder="999" className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </td>
          </>
        )}
        {pricingMode === "BULK" && !shared && (
          <td className="px-3 py-2.5">
            <button type="button" onClick={onToggle} className="group/tiers text-left">
              {tiers.length === 0 ? (
                <span className="text-xs font-medium text-destructive">No tiers — click to add</span>
              ) : (
                <span className="flex flex-wrap gap-1">
                  {tiers.map((t, i) => (
                    <span key={i} className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] tabular-nums ring-1 ring-foreground/[0.06] group-hover/tiers:ring-primary/40">
                      {Number.isFinite(Number(t?.minQuantity)) ? t.minQuantity : "?"}+{" "}
                      {Number.isFinite(Number(t?.price)) && Number(t?.price) > 0 ? formatCurrency(t.price) : "₹—"}
                    </span>
                  ))}
                </span>
              )}
            </button>
          </td>
        )}
        <td className="px-3 py-2.5">
          <FormField
            control={form.control}
            name={`variants.${index}.weightGrams`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <NumberField
                    field={{ ...field, value: field.value ?? undefined } as typeof field}
                    emptyValue={null}
                    integer
                    min={0}
                    placeholder={productWeightGrams ? String(productWeightGrams) : "—"}
                    className="h-9"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </td>
        <td className="px-3 py-2.5">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-label={`${open ? "Hide" : "Show"} details for ${variant.label}`}
            className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
        </td>
      </tr>

      {open && (
        <tr className="bg-surface/60">
          <td colSpan={colSpan} className="px-4 py-4">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <FormField
                control={form.control}
                name={`variants.${index}.image`}
                render={({ field }) => (
                  <ImagePicker
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    label="Variant image"
                    hint="Shown when this variant is selected; falls back to the product image."
                  />
                )}
              />

              <div className="space-y-4">
                {pricingMode === "BULK" && !shared && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Price tiers for {variant.label}</p>
                      <div className="flex gap-1.5">
                        <Button type="button" variant="ghost" size="sm" onClick={onCopyPricesToAll} disabled={tiers.length === 0}>
                          <Copy aria-hidden /> Copy to all variants
                        </Button>
                      </div>
                    </div>
                    {tiers.map((_, tierIndex) => (
                      <div key={tierIndex} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                        <FormField
                          control={form.control}
                          name={`variants.${index}.prices.${tierIndex}.minQuantity`}
                          render={({ field }) => (
                            <FormItem>
                              {tierIndex === 0 && <FormLabel className="text-xs">Min qty</FormLabel>}
                              <FormControl>
                                <NumberField field={field} integer min={1} placeholder="10" className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variants.${index}.prices.${tierIndex}.price`}
                          render={({ field }) => (
                            <FormItem>
                              {tierIndex === 0 && <FormLabel className="text-xs">Price ₹</FormLabel>}
                              <FormControl>
                                <NumberField field={field} min={0.01} placeholder="749" className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`variants.${index}.prices.${tierIndex}.mrp`}
                          render={({ field }) => (
                            <FormItem>
                              {tierIndex === 0 && <FormLabel className="text-xs">MRP ₹</FormLabel>}
                              <FormControl>
                                <NumberField field={field} min={0.01} placeholder="999" className="h-9" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className={cn("size-9", tierIndex === 0 && "mt-6")}
                          onClick={() => setTiers(tiers.filter((_, i) => i !== tierIndex))}
                          aria-label={`Remove tier ${tierIndex + 1}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const mins = tiers.map((t) => Number(t?.minQuantity)).filter((n) => Number.isFinite(n) && n >= 1);
                        const nextMin = mins.length ? Math.max(...mins) * 5 : 10;
                        setTiers([...tiers, emptyTier(nextMin)]);
                      }}
                    >
                      <Plus aria-hidden /> Add tier
                    </Button>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold">Shipping overrides</p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Leave blank to use the product&apos;s weight and dimensions
                    {productWeightGrams ? ` (${formatGrams(productWeightGrams)})` : ""}.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["lengthCm", "widthCm", "heightCm"] as const).map((dim, i) => (
                      <FormField
                        key={dim}
                        control={form.control}
                        name={`variants.${index}.${dim}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">{["Length", "Width", "Height"][i]} cm</FormLabel>
                            <FormControl>
                              <NumberField field={{ ...field, value: field.value ?? undefined } as typeof field}
                    emptyValue={null} min={0} placeholder="—" className="h-9" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onRemove}>
                    <Trash2 aria-hidden /> Remove this variant
                  </Button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
