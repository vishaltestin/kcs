import type { z } from "zod";

import { db } from "@/lib/db";
import { str } from "@/lib/form";
import { resolveVariantTiers, variantLabel } from "@/lib/variants";
import { type ProductInput, type VariantFormInput } from "@/lib/validations/admin";
import type { ActionResult } from "@/types";

/**
 * Shared product form plumbing used by BOTH the admin console and the vendor
 * portal: parsing the multipart form, normalising tiers/variants and building
 * Prisma payloads. The calling server action supplies auth + ownership rules.
 */

export function parseProductForm(formData: FormData): Record<keyof ProductInput, unknown> {
  // Builds the raw (unvalidated) input — validation happens in the actions
  // via safeParse so failures return ActionResult.fieldErrors instead of
  // throwing. Hence the loose `unknown` values here.
  return {
    vendorId: str(formData.get("vendorId")),
    name: str(formData.get("name")),
    slug: str(formData.get("slug")),
    sku: str(formData.get("sku")),
    brandId: formData.get("brandId") ? Number(formData.get("brandId")) : null,
    categoryIds: formData.getAll("categoryIds").map(Number),
    introtext: str(formData.get("introtext")),
    description: str(formData.get("description")),
    image: str(formData.get("image")),
    images: formData
      .getAll("images")
      .filter((v) => String(v).trim() !== "")
      .map(String),
    video: str(formData.get("video")),
    delivery: str(formData.get("delivery")),
    stock: formData.get("stock") ? Number(formData.get("stock")) : 0,
    pricingMode: str(formData.get("pricingMode")) || "BULK",
    isActive: formData.get("isActive") === "true",
    isNew: formData.get("isNew") === "true",
    isFeatured: formData.get("isFeatured") === "true",
    isBestSeller: formData.get("isBestSeller") === "true",
    prices: safeJsonArray(formData.get("prices")),
    specs: safeJsonArray(formData.get("specs")),
    hsnCode: str(formData.get("hsnCode")).replace(/\s+/g, ""),
    gstRate: formData.get("gstRate") === null || formData.get("gstRate") === "" ? 18 : Number(formData.get("gstRate")),
    weightGrams: formData.get("weightGrams") ? Number(formData.get("weightGrams")) : 0,
    lengthCm: numOrNull(formData.get("lengthCm")),
    widthCm: numOrNull(formData.get("widthCm")),
    heightCm: numOrNull(formData.get("heightCm")),
    hasVariants: formData.get("hasVariants") === "true",
    variantPricing: str(formData.get("variantPricing")) || "SHARED",
    options: safeJsonArray(formData.get("options")),
    variants: safeJsonArray(formData.get("variants")).map((v) =>
      v && typeof v === "object"
        ? { priceDelta: 0, prices: [], ...(v as Record<string, unknown>) }
        : v,
    ),
    metaTitle: str(formData.get("metaTitle")),
    metaDescription: str(formData.get("metaDescription")),
    metaKeywords: str(formData.get("metaKeywords")),
    ogImage: str(formData.get("ogImage")),
  };
}

/**
 * Server-side validation normally never fires (the form validates first), but
 * when it does the caller should see *which* field failed rather than a generic
 * "fix the highlighted fields" — nested paths (variants.3.stock) are
 * flattened to their top-level key with a readable pointer.
 */
export function validationFailure(error: z.ZodError): ActionResult {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const [top, ...rest] = issue.path.map(String);
    if (!top) continue;
    const pointer = rest.length ? ` (${rest.join(" › ")})` : "";
    (fieldErrors[top] ??= []).push(`${issue.message}${pointer}`);
  }
  const first = error.issues[0];
  const where = first?.path.length ? ` — ${first.path.map(String).join(".")}` : "";
  return {
    ok: false,
    message: `${first?.message ?? "Validation failed."}${where}`,
    fieldErrors,
  };
}

export function numOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function safeJsonArray(value: FormDataEntryValue | null): unknown[] {
  try {
    const parsed: unknown = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Normalise tiers for the chosen mode so the storefront never sees stray data. */
export function normalisePrices(parsed: ProductInput) {
  if (parsed.pricingMode === "ENQUIRY") return [];
  if (parsed.pricingMode === "SINGLE") {
    const only = parsed.prices[0];
    return only ? [{ ...only, minQuantity: 1 }] : [];
  }
  return [...parsed.prices].sort((a, b) => a.minQuantity - b.minQuantity);
}

/**
 * Normalise a variant's own tier rows. Under SHARED pricing the effective price
 * comes from the product tiers ± `priceDelta`, so these rows are simply ignored
 * by every consumer — but they are still *stored*. Keeping them means an admin
 * can flip Shared → Custom → Shared without losing the per-variant tables they
 * took the time to type in (the storefront resolver picks them back up).
 */
export function normaliseVariantPrices(parsed: ProductInput, variant: VariantFormInput) {
  if (parsed.pricingMode === "ENQUIRY") return [];
  if (parsed.pricingMode === "SINGLE") {
    const only = variant.prices[0];
    return only ? [{ ...only, minQuantity: 1 }] : [];
  }
  return [...variant.prices].sort((a, b) => a.minQuantity - b.minQuantity);
}

/** Only keep option axes that are actually referenced by the variants. */
export function cleanOptions(parsed: ProductInput) {
  if (!parsed.hasVariants) return [];
  return parsed.options
    .map((o) => ({ name: o.name.trim(), values: Array.from(new Set(o.values.map((v) => v.trim()).filter(Boolean))) }))
    .filter((o) => o.name && o.values.length > 0);
}

export function cleanVariants(parsed: ProductInput) {
  if (!parsed.hasVariants) return [];
  const axes = cleanOptions(parsed);
  return parsed.variants
    .filter((v) => axes.every((a) => a.values.includes(v.attributes[a.name] ?? "")))
    .map((v, index) => {
      const prices = normaliseVariantPrices(parsed, v);
      const priceDelta = parsed.variantPricing === "SHARED" ? v.priceDelta ?? 0 : 0;
      // Denormalised first tier — resolved the same way the storefront does.
      const effective =
        parsed.pricingMode === "ENQUIRY"
          ? []
          : resolveVariantTiers(parsed.variantPricing, normalisePrices(parsed), { prices, priceDelta });
      return {
        id: v.id,
        sortOrder: index,
        attributes: v.attributes,
        label: variantLabel(v.attributes, axes),
        sku: v.sku.trim() || null,
        image: v.image.trim() || null,
        stock: v.stock,
        isActive: v.isActive,
        priceDelta,
        basePrice: effective[0]?.price ?? 0,
        baseMrp: effective[0]?.mrp ?? 0,
        weightGrams: v.weightGrams && v.weightGrams > 0 ? v.weightGrams : null,
        lengthCm: v.lengthCm && v.lengthCm > 0 ? v.lengthCm : null,
        widthCm: v.widthCm && v.widthCm > 0 ? v.widthCm : null,
        heightCm: v.heightCm && v.heightCm > 0 ? v.heightCm : null,
        prices,
      };
    });
}

export function productData(parsed: ProductInput) {
  const prices = normalisePrices(parsed);
  const variants = cleanVariants(parsed);
  // With variants, the product-level base price mirrors the cheapest active
  // variant so listings / sorting keep working without a join.
  const activeVariantPrices = variants.filter((v) => v.isActive && v.basePrice > 0);
  const cheapest = activeVariantPrices.sort((a, b) => a.basePrice - b.basePrice)[0];
  const baseTier = parsed.hasVariants && cheapest ? { price: cheapest.basePrice, mrp: cheapest.baseMrp } : prices[0];
  const variantStock = variants.filter((v) => v.isActive).reduce((sum, v) => sum + v.stock, 0);
  return {
    pricingMode: parsed.pricingMode,
    basePrice: baseTier?.price ?? 0,
    baseMrp: baseTier?.mrp ?? 0,
    hsnCode: parsed.hsnCode || null,
    gstRate: parsed.gstRate,
    weightGrams: parsed.weightGrams,
    lengthCm: parsed.lengthCm ?? 0,
    widthCm: parsed.widthCm ?? 0,
    heightCm: parsed.heightCm ?? 0,
    hasVariants: parsed.hasVariants && variants.length > 0,
    variantPricing: parsed.variantPricing,
    name: parsed.name,
    slug: parsed.slug,
    sku: parsed.sku || null,
    brandId: parsed.brandId ?? null,
    introtext: parsed.introtext || null,
    description: parsed.description || null,
    image: parsed.image,
    video: parsed.video || null,
    delivery: parsed.delivery || null,
    stock: parsed.hasVariants && variants.length > 0 ? variantStock : parsed.stock,
    isActive: parsed.isActive,
    isNew: parsed.isNew,
    isFeatured: parsed.isFeatured,
    isBestSeller: parsed.isBestSeller,
    metaTitle: parsed.metaTitle || null,
    metaDescription: parsed.metaDescription || null,
    metaKeywords: parsed.metaKeywords || null,
    ogImage: parsed.ogImage || null,
  };
}

/**
 * Product-level tiers. Variant products keep a fallback tier mirroring the
 * cheapest active variant so legacy consumers (cards, sorting) have a price.
 */
export function productTierRows(parsed: ProductInput, variants: ReturnType<typeof cleanVariants>) {
  if (!parsed.hasVariants || variants.length === 0 || parsed.variantPricing === "SHARED") {
    return normalisePrices(parsed).map((tier) => ({ minQuantity: tier.minQuantity, price: tier.price, mrp: tier.mrp }));
  }
  if (parsed.pricingMode === "ENQUIRY") return [];
  const cheapest = [...variants].filter((v) => v.isActive && v.prices.length).sort((a, b) => a.basePrice - b.basePrice)[0];
  return (cheapest?.prices ?? []).map((tier) => ({ minQuantity: tier.minQuantity, price: tier.price, mrp: tier.mrp }));
}

/** Variant SKUs are globally unique — surface a friendly error instead of a P2002. */
export async function findVariantSkuClash(parsed: ProductInput, productId?: string): Promise<ActionResult | null> {
  const skus = cleanVariants(parsed).map((v) => v.sku).filter((v): v is string => !!v);
  if (skus.length === 0) return null;
  const clash = await db.productVariant.findFirst({
    where: { sku: { in: skus }, ...(productId ? { productId: { not: productId } } : {}) },
    select: { sku: true, product: { select: { name: true } } },
  });
  if (!clash) return null;
  return {
    ok: false,
    message: `SKU ${clash.sku} is already used by “${clash.product.name}”.`,
    fieldErrors: { variants: [`SKU ${clash.sku} is already used by another product.`] },
  };
}

/** Product slug uniqueness check as an ActionResult, or null when free. */
export async function findSlugClash(slug: string, productId?: string): Promise<ActionResult | null> {
  const clash = await db.product.findFirst({
    where: { slug, ...(productId ? { id: { not: productId } } : {}) },
    select: { id: true },
  });
  if (!clash) return null;
  return {
    ok: false,
    message: "Slug already in use.",
    fieldErrors: { slug: ["Slug already exists."] },
  };
}
