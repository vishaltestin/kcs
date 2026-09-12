/**
 * Variant helpers shared by the admin form, storefront selector and checkout.
 *
 * A product declares option axes (e.g. Colour: Red/Blue, Size: S/M/L) and the
 * admin generates one ProductVariant per combination. Each variant has its own
 * SKU, stock, image, price tiers and (optionally) shipping weight.
 */

export type OptionAxis = { name: string; values: string[] };

export type VariantAttributes = Record<string, string>;

export type PriceTierInput = { minQuantity: number; price: number; mrp: number };

export type VariantPricingMode = "SHARED" | "CUSTOM";

export type VariantInput = {
  id?: string;
  attributes: VariantAttributes;
  label: string;
  sku: string;
  image: string;
  stock: number;
  isActive: boolean;
  /** Shared pricing: ₹ added to every product tier for this variant. */
  priceDelta: number;
  /** Custom pricing: the variant's own tier table. */
  prices: PriceTierInput[];
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
};

/** Public, serialisable variant shape for the storefront. */
export type StorefrontVariant = {
  id: string;
  attributes: VariantAttributes;
  label: string;
  sku: string | null;
  image: string | null;
  stock: number;
  price: number | null;
  mrp: number | null;
  minQuantity: number;
  prices: PriceTierInput[];
};

/** Deterministic key for a combination, independent of option order. */
export function attributeKey(attrs: VariantAttributes, axes?: OptionAxis[]): string {
  const names = axes ? axes.map((a) => a.name) : Object.keys(attrs).sort();
  return names.map((n) => `${n}=${attrs[n] ?? ""}`).join("|");
}

export function variantLabel(attrs: VariantAttributes, axes?: OptionAxis[]): string {
  const names = axes ? axes.map((a) => a.name) : Object.keys(attrs);
  return names
    .map((n) => attrs[n])
    .filter(Boolean)
    .join(" / ");
}

/** Cartesian product of the option axes → every attribute combination. */
export function combinations(axes: OptionAxis[]): VariantAttributes[] {
  const clean = axes
    .map((a) => ({ name: a.name.trim(), values: uniq(a.values.map((v) => v.trim()).filter(Boolean)) }))
    .filter((a) => a.name && a.values.length > 0);
  if (clean.length === 0) return [];
  return clean.reduce<VariantAttributes[]>(
    (acc, axis) => acc.flatMap((combo) => axis.values.map((value) => ({ ...combo, [axis.name]: value }))),
    [{}],
  );
}

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Merge freshly generated combinations with existing variants so re-generating
 * after adding a value keeps SKUs, stock and prices already entered.
 */
export function mergeVariants(axes: OptionAxis[], existing: VariantInput[], template: Partial<VariantInput> = {}): VariantInput[] {
  const byKey = new Map(existing.map((v) => [attributeKey(v.attributes, axes), v]));
  return combinations(axes).map((attrs) => {
    const key = attributeKey(attrs, axes);
    const prev = byKey.get(key);
    if (prev) return { ...prev, attributes: attrs, label: variantLabel(attrs, axes) };
    return {
      attributes: attrs,
      label: variantLabel(attrs, axes),
      sku: "",
      image: "",
      stock: 0,
      isActive: true,
      priceDelta: 0,
      prices: template.prices?.map((t) => ({ ...t })) ?? [],
      weightGrams: null,
      lengthCm: null,
      widthCm: null,
      heightCm: null,
    };
  });
}

/** Find the variant matching a (possibly partial) selection. */
export function findVariant<T extends { attributes: VariantAttributes }>(variants: T[], selection: VariantAttributes, axes: OptionAxis[]): T | undefined {
  if (axes.some((a) => !selection[a.name])) return undefined;
  return variants.find((v) => axes.every((a) => v.attributes[a.name] === selection[a.name]));
}

/** Whether choosing `value` for `axis` (given the rest of the selection) leads to any in-stock, active variant. */
export function valueAvailable<T extends { attributes: VariantAttributes; stock: number }>(
  variants: T[],
  axisName: string,
  value: string,
  selection: VariantAttributes,
): boolean {
  return variants.some(
    (v) =>
      v.attributes[axisName] === value &&
      Object.entries(selection).every(([k, val]) => k === axisName || !val || v.attributes[k] === val),
  );
}

export function priceRange(variants: { price: number | null }[]): { min: number; max: number } | null {
  const prices = variants.map((v) => v.price).filter((p): p is number => typeof p === "number" && p > 0);
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/**
 * Effective tier table for a variant.
 *
 * SHARED pricing → the product's tiers shifted by the variant's `priceDelta`
 * (MRP shifts too so the discount stays honest). CUSTOM pricing → the
 * variant's own tiers, falling back to the product tiers when it has none.
 * Used by the storefront mapper, the admin save and order placement, so all
 * three agree to the paisa.
 */
type Numeric = number | string | null | undefined | { toString(): string };
type TierLike = { minQuantity: Numeric; price: Numeric; mrp: Numeric };

/**
 * Coerces Prisma Decimals, strings and half-typed admin form values to a
 * finite number. Anything missing or unparsable (an empty MRP box while the
 * admin is still typing, `undefined` from a freshly added tier row) becomes 0
 * instead of throwing.
 */
function coerceNumber(value: Numeric): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

export function resolveVariantTiers(
  mode: VariantPricingMode,
  productTiers: readonly TierLike[],
  variant: { prices?: readonly TierLike[] | null; priceDelta?: Numeric },
): PriceTierInput[] {
  const num = coerceNumber;
  const asTiers = (rows: readonly TierLike[]) =>
    rows
      .filter((t): t is TierLike => !!t)
      .map((t) => {
        const price = num(t.price);
        // A tier without an MRP (or with an MRP below the price) sells at list price.
        const mrp = Math.max(num(t.mrp), price);
        return { minQuantity: Math.max(1, Math.trunc(num(t.minQuantity)) || 1), price, mrp };
      })
      .sort((a, b) => a.minQuantity - b.minQuantity);
  const own = variant.prices ?? [];
  if (mode === "CUSTOM" && own.length > 0) return asTiers(own);
  const delta = num(variant.priceDelta);
  return asTiers(productTiers).map((t) => ({
    minQuantity: t.minQuantity,
    price: round2(t.price + delta),
    mrp: round2(Math.max(t.mrp + delta, t.price + delta)),
  }));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
