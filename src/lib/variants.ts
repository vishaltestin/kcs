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

export type VariantInput = {
  id?: string;
  attributes: VariantAttributes;
  label: string;
  sku: string;
  image: string;
  stock: number;
  isActive: boolean;
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
