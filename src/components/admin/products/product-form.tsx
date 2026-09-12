"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form";
import { ArrowLeft, Layers, Loader2, MessageSquareQuote, Plus, Save, Tag, Trash2 } from "lucide-react";
import { VariantsEditor } from "@/components/admin/products/variants-editor";
import { formatGrams, volumetricGrams } from "@/lib/shipping";
import { splitInclusive } from "@/lib/tax";
import type { OptionAxis, VariantInput } from "@/lib/variants";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { GalleryUploader, ImagePicker } from "@/components/admin/image-picker";
import { NumberField } from "@/components/admin/number-field";
import { SeoFields } from "@/components/admin/seo/seo-fields";
import { createProductAction, updateProductAction } from "@/actions/admin/products";
import { productSchema, type PricingModeValue, type VariantPricingValue } from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";

export type ProductFormValues = z.infer<typeof productSchema>;

const FIELD_LABELS: Record<string, string> = {
  name: "Product name",
  slug: "Slug",
  image: "Main image",
  prices: "Pricing",
  stock: "Stock",
  hsnCode: "HSN code",
  gstRate: "GST rate",
  weightGrams: "Weight",
  options: "Variant options",
  variants: "Variants",
  categoryIds: "Categories",
  video: "Video URL",
  metaTitle: "Meta title",
  metaDescription: "Meta description",
};

/** First human-readable message in RHF's nested error tree, prefixed with the section. */
function firstErrorMessage(errors: FieldErrors<ProductFormValues>): string | null {
  const walk = (node: unknown, path: string[]): string | null => {
    if (!node || typeof node !== "object") return null;
    const rec = node as Record<string, unknown>;
    if (typeof rec.message === "string") {
      const top = path[0] ?? "";
      const nested = path.slice(1).filter((p) => !/^\d+$/.test(p));
      const rowIndex = path.length > 1 && /^\d+$/.test(path[1]) ? Number(path[1]) + 1 : null;
      const where = [FIELD_LABELS[top] ?? top, rowIndex ? `row ${rowIndex}` : null, nested.at(-1)]
        .filter(Boolean)
        .join(" › ");
      return `${where}: ${rec.message}`;
    }
    for (const [key, value] of Object.entries(rec)) {
      if (key === "ref" || key === "type" || key === "types") continue;
      const found = walk(value, [...path, key]);
      if (found) return found;
    }
    return null;
  };
  return walk(errors, []);
}

type BrandOption = { id: number; name: string };
type CategoryOption = { id: number; title: string; parentId: number | null };

export interface ProductFormProduct {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  brandId: number | null;
  introtext: string | null;
  description: string | null;
  image: string;
  video: string | null;
  delivery: string | null;
  stock: number;
  pricingMode: PricingModeValue;
  isActive: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  categoryIds: number[];
  images: string[];
  prices: { minQuantity: number; price: number; mrp: number }[];
  specs: { label: string; value: string }[];
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
  hsnCode?: string | null;
  gstRate?: number;
  weightGrams?: number;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  hasVariants?: boolean;
  variantPricing?: VariantPricingValue;
  options?: OptionAxis[];
  variants?: VariantInput[];
}

const GST_RATES = [0, 5, 12, 18, 28] as const;

/** A blank tier — cast because RHF holds `undefined` for untouched number inputs. */
function emptyTier(minQuantity: number) {
  return { minQuantity, price: undefined, mrp: undefined } as unknown as ProductFormValues["prices"][number];
}

const PRICING_MODE_OPTIONS: {
  value: PricingModeValue;
  label: string;
  description: string;
  icon: typeof Tag;
}[] = [
  {
    value: "SINGLE",
    label: "Single unit price",
    description: "One flat price, order from 1 piece. No slab table on the storefront.",
    icon: Tag,
  },
  {
    value: "BULK",
    label: "Bulk pricing tiers",
    description: "Minimum order quantity with slabs that get cheaper as quantity grows.",
    icon: Layers,
  },
  {
    value: "ENQUIRY",
    label: "Enquiry only",
    description: "No public price — the buy button becomes “Request a quote”.",
    icon: MessageSquareQuote,
  },
];

export function ProductForm({
  mode,
  product,
  brands,
  categories,
}: {
  mode: "create" | "edit";
  product?: ProductFormProduct;
  brands: BrandOption[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      sku: product?.sku ?? "",
      brandId: product?.brandId ?? null,
      categoryIds: product?.categoryIds ?? [],
      introtext: product?.introtext ?? "",
      description: product?.description ?? "",
      image: product?.image ?? "",
      images: product?.images ?? [],
      video: product?.video ?? "",
      delivery: product?.delivery ?? "",
      stock: product?.stock ?? 0,
      pricingMode: product?.pricingMode ?? "BULK",
      isActive: product?.isActive ?? true,
      isNew: product?.isNew ?? false,
      isFeatured: product?.isFeatured ?? false,
      isBestSeller: product?.isBestSeller ?? false,
      // Empty price boxes start as `undefined` (never NaN) so React doesn't
      // warn and zod reports "Price is required." instead of "NaN".
      prices: product?.prices?.length ? product.prices : [emptyTier(10)],
      specs: product?.specs ?? [],
      metaTitle: product?.metaTitle ?? "",
      metaDescription: product?.metaDescription ?? "",
      metaKeywords: product?.metaKeywords ?? "",
      ogImage: product?.ogImage ?? "",
      hsnCode: product?.hsnCode ?? "",
      gstRate: product?.gstRate ?? 18,
      weightGrams: product?.weightGrams ?? 0,
      lengthCm: product?.lengthCm ?? null,
      widthCm: product?.widthCm ?? null,
      heightCm: product?.heightCm ?? null,
      hasVariants: product?.hasVariants ?? false,
      variantPricing: product?.variantPricing ?? "SHARED",
      options: product?.options ?? [],
      variants: product?.variants ?? [],
    },
  });

  const {
    fields: tierFields,
    append: appendTier,
    remove: removeTier,
  } = useFieldArray({ control: form.control, name: "prices" });
  const {
    fields: specFields,
    append: appendSpec,
    remove: removeSpec,
  } = useFieldArray({ control: form.control, name: "specs" });
  // `images` is a primitive string array, which useFieldArray does not
  // accept (RHF v7.87 restricts it to object arrays) — manage it manually.
  const galleryImages = form.watch("images");
  const setGalleryImages = (paths: string[]) =>
    form.setValue("images", paths, { shouldDirty: true, shouldValidate: true });
  const pricingMode = form.watch("pricingMode");
  const hasVariants = form.watch("hasVariants");
  const variantPricing = form.watch("variantPricing");
  // Product-level tiers are hidden only when every variant prices itself.
  const tiersLiveOnVariants = hasVariants && variantPricing === "CUSTOM";
  const weightGrams = form.watch("weightGrams");
  const lengthCm = form.watch("lengthCm");
  const widthCm = form.watch("widthCm");
  const heightCm = form.watch("heightCm");
  const gstRate = form.watch("gstRate");
  const firstPrice = form.watch("prices.0.price");
  const volumetric = volumetricGrams(Number(lengthCm) || 0, Number(widthCm) || 0, Number(heightCm) || 0, 5000);
  const chargeable = Math.max(Number(weightGrams) || 0, volumetric);

  // Auto-generate the slug from the name until the user edits it manually.
  const nameValue = form.watch("name");
  useEffect(() => {
    if (!slugTouched && nameValue) {
      form.setValue("slug", slugify(nameValue), { shouldValidate: false });
    }
  }, [nameValue, slugTouched, form]);

  const imageValue = form.watch("image");
  const selectedCategories = form.watch("categoryIds");

  const toggleCategory = (id: number, checked: boolean) => {
    const current = form.getValues("categoryIds");
    form.setValue(
      "categoryIds",
      checked ? [...current, id] : current.filter((c) => c !== id),
      { shouldDirty: true }
    );
  };

  const onSubmit = async (values: ProductFormValues) => {
    const formData = new FormData();
    if (isEdit) formData.set("id", product!.id);
    formData.set("name", values.name);
    formData.set("slug", values.slug);
    formData.set("sku", values.sku ?? "");
    formData.set("brandId", values.brandId ? String(values.brandId) : "");
    values.categoryIds.forEach((id) => formData.append("categoryIds", String(id)));
    formData.set("image", values.image);
    values.images.filter(Boolean).forEach((url) => formData.append("images", url));
    formData.set("introtext", values.introtext ?? "");
    formData.set("description", values.description ?? "");
    formData.set("video", values.video ?? "");
    formData.set("delivery", values.delivery ?? "");
    formData.set("stock", String(values.stock));
    formData.set("pricingMode", values.pricingMode);
    formData.set(
      "prices",
      JSON.stringify(
        values.pricingMode === "ENQUIRY"
          ? []
          : values.pricingMode === "SINGLE"
            ? values.prices.slice(0, 1).map((t) => ({ ...t, minQuantity: 1 }))
            : values.prices
      )
    );
    formData.set("specs", JSON.stringify(values.specs));
    formData.set("hsnCode", values.hsnCode ?? "");
    formData.set("gstRate", String(values.gstRate ?? 18));
    formData.set("weightGrams", String(values.weightGrams ?? 0));
    formData.set("lengthCm", values.lengthCm == null ? "" : String(values.lengthCm));
    formData.set("widthCm", values.widthCm == null ? "" : String(values.widthCm));
    formData.set("heightCm", values.heightCm == null ? "" : String(values.heightCm));
    formData.set("hasVariants", values.hasVariants ? "true" : "false");
    formData.set("variantPricing", values.variantPricing);
    formData.set("options", JSON.stringify(values.hasVariants ? values.options : []));
    formData.set(
      "variants",
      JSON.stringify(
        values.hasVariants
          ? values.variants.map((v) => ({
              ...v,
              prices:
                values.pricingMode === "ENQUIRY"
                  ? []
                  : values.pricingMode === "SINGLE"
                    ? v.prices.slice(0, 1).map((t) => ({ ...t, minQuantity: 1 }))
                    : v.prices,
            }))
          : [],
      ),
    );
    if (values.isActive) formData.set("isActive", "true");
    if (values.isNew) formData.set("isNew", "true");
    if (values.isFeatured) formData.set("isFeatured", "true");
    if (values.isBestSeller) formData.set("isBestSeller", "true");
    formData.set("metaTitle", values.metaTitle ?? "");
    formData.set("metaDescription", values.metaDescription ?? "");
    formData.set("metaKeywords", values.metaKeywords ?? "");
    formData.set("ogImage", values.ogImage ?? "");

    const result = isEdit
      ? await updateProductAction(null, formData)
      : await createProductAction(null, formData);

    if (result.ok) {
      toast.success(result.message ?? "Saved!");
      router.push("/admin/products");
    } else {
      toast.error("Couldn't save the product", { description: result.message });
      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.length) {
            form.setError(key as keyof ProductFormValues, { message: messages.join(" · ") });
          }
        }
        const key = Object.keys(result.fieldErrors)[0];
        document
          .querySelector<HTMLElement>(`[data-form-section="${key}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const { isSubmitting } = form.formState;
  const parentCategories = categories.filter((c) => c.parentId === null);

  /**
   * Client-side validation failed: say what is wrong instead of silently
   * painting things red, and bring the first problem into view.
   */
  const onInvalid = (errors: FieldErrors<ProductFormValues>) => {
    const first = firstErrorMessage(errors);
    toast.error("Can't save yet", { description: first ?? "Please check the highlighted fields." });
    const key = Object.keys(errors)[0];
    const anchor =
      document.querySelector<HTMLElement>(`[data-form-section="${key}"]`) ??
      document.querySelector<HTMLElement>("[aria-invalid='true']");
    anchor?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        {/* Basics + organisation */}
        <Card data-form-section="name">
          <CardHeader>
            <CardTitle>Basic information</CardTitle>
            <CardDescription>
              Name, slug and catalogue organisation. The slug forms the product URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Adidas Dry-Fit Round Neck T-Shirt" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="auto-generated-from-name"
                      {...field}
                      onChange={(e) => {
                        setSlugTouched(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="KCS-TSH-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brandId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No brand</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={String(brand.id)}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock {hasVariants ? "" : "*"}</FormLabel>
                  <FormControl>
                    <NumberField field={field} integer min={0} placeholder="0" disabled={hasVariants} />
                  </FormControl>
                  <FormDescription>
                    {hasVariants ? "Tracked per variant — the total is calculated on save." : "0 = not tracked (always purchasable)."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="delivery"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping note</FormLabel>
                  <FormControl>
                    <Input placeholder="Dispatch in 3–5 working days…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Assign the product to one or more catalogue categories ({selectedCategories.length}{" "}
              selected).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {parentCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories exist yet — create some first.
              </p>
            ) : (
              <div className="space-y-4">
                {parentCategories.map((parent) => {
                  const children = categories.filter((c) => c.parentId === parent.id);
                  return (
                    <div key={parent.id}>
                      <label className="flex items-start gap-2.5 text-sm font-semibold cursor-pointer">
                        <Checkbox
                          checked={selectedCategories.includes(parent.id)}
                          onCheckedChange={(v) => toggleCategory(parent.id, v === true)}
                          aria-label={parent.title}
                        />
                        {parent.title}
                      </label>
                      {children.length > 0 && (
                        <div className="mt-2 ml-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {children.map((child) => (
                            <label
                              key={child.id}
                              className="flex items-start gap-2.5 text-sm text-muted-foreground cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedCategories.includes(child.id)}
                                onCheckedChange={(v) => toggleCategory(child.id, v === true)}
                                aria-label={child.title}
                              />
                              <span>{child.title}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Images */}
        <Card data-form-section="image">
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              Uploads are auto-rotated, resized to 1600 px and converted to WebP so pages stay fast and sharp.
              Use square or 4:5 images of at least 1000 px for best results.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <ImagePicker
                    value={imageValue}
                    onChange={(path) => field.onChange(path)}
                    label="Main image *"
                    hint="Shown on cards, search and as the first gallery slide"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <FormField
              control={form.control}
              name="images"
              render={() => (
                <FormItem>
                  <GalleryUploader
                    value={galleryImages.filter(Boolean)}
                    onChange={setGalleryImages}
                    onMakeMain={(path) => {
                      const current = form.getValues("image");
                      form.setValue("image", path, { shouldDirty: true, shouldValidate: true });
                      // Keep the old main image in the gallery so nothing is lost.
                      const rest = galleryImages.filter((p) => p && p !== path);
                      setGalleryImages(current && !rest.includes(current) ? [current, ...rest] : rest);
                      toast.success("Main image updated");
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Content</CardTitle>
            <CardDescription>Description copy shown on the product page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="introtext"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intro text (short description)</FormLabel>
                  <FormControl>
                    <Input maxLength={500} placeholder="Moisture-wicking performance tee…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full description</FormLabel>
                  <FormControl>
                    <Textarea rows={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="video"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video URL (YouTube or mp4)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card data-form-section="prices">
          <CardHeader>
            <CardTitle>Pricing *</CardTitle>
            <CardDescription>Choose how this product is sold, then enter the price(s).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <FormField
              control={form.control}
              name="pricingMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Pricing mode</FormLabel>
                  <FormControl>
                    <div role="radiogroup" aria-label="Pricing mode" className="grid gap-2.5 sm:grid-cols-3">
                      {PRICING_MODE_OPTIONS.map((option) => {
                        const selected = field.value === option.value;
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => {
                              field.onChange(option.value);
                              // Drop rows that were removed/never filled so a stale
                              // half-typed tier can't survive a mode switch.
                              const current = (form.getValues("prices") ?? []).filter(Boolean);
                              if (option.value === "SINGLE") {
                                const first = current[0] ?? emptyTier(1);
                                form.setValue("prices", [{ ...first, minQuantity: 1 }], { shouldDirty: true });
                              } else if (option.value === "BULK" && current.length === 0) {
                                form.setValue("prices", [emptyTier(10)], { shouldDirty: true });
                              } else if (option.value === "BULK" && current.length === 1 && Number(current[0].minQuantity) <= 1) {
                                form.setValue("prices", [{ ...current[0], minQuantity: 10 }], { shouldDirty: true });
                              } else if (option.value === "ENQUIRY") {
                                form.setValue("prices", [], { shouldDirty: true });
                              }
                              form.clearErrors(["prices", "variants"]);
                            }}
                            className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                              selected
                                ? "border-primary bg-primary/[0.05] ring-2 ring-primary/20"
                                : "border-border hover:border-primary/40 hover:bg-muted/40"
                            }`}
                          >
                            <span
                              className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                                selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <Icon className="size-4" aria-hidden />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">{option.label}</span>
                              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                                {option.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {pricingMode === "ENQUIRY" ? (
              <p className="rounded-xl border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                No price will be shown. Customers see <strong className="text-foreground">Price on request</strong>{" "}
                and a <strong className="text-foreground">Request a quote</strong> button that opens the bulk-enquiry
                form. The product can&apos;t be added to the cart.
              </p>
            ) : tiersLiveOnVariants ? (
              <p className="rounded-xl border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Prices are entered <strong className="text-foreground">per variant</strong> in the Variants section
                below (custom pricing). The product card shows a “from” price based on the cheapest active variant.
                {pricingMode === "BULK" && " Use “Copy to all variants” to share one tier table."}
              </p>
            ) : pricingMode === "SINGLE" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {hasVariants && (
                  <p className="rounded-xl border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground sm:col-span-2">
                    This price applies to <strong className="text-foreground">every variant</strong>. Add a per-variant ₹
                    adjustment in the Variants section if some cost more (e.g. XXL).
                  </p>
                )}
                <FormField
                  control={form.control}
                  name="prices.0.price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling price ₹ *</FormLabel>
                      <FormControl>
                        <NumberField field={field} min={0.01} placeholder="e.g. 749" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prices.0.mrp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MRP ₹ *</FormLabel>
                      <FormControl>
                        <NumberField field={field} min={0.01} placeholder="e.g. 999" />
                      </FormControl>
                      <FormDescription>Shown struck-through when higher than the selling price.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.formState.errors.prices?.root?.message && (
                  <p className="text-sm text-destructive sm:col-span-2">{form.formState.errors.prices.root.message}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  e.g. 10+ @ ₹749, 50+ @ ₹689, 100+ @ ₹649 — the lowest tier sets the minimum order quantity.
                </p>
                {hasVariants && (
                  <p className="rounded-xl border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    These tiers apply to <strong className="text-foreground">every variant</strong>. Add a per-variant ₹
                    adjustment in the Variants section if some cost more (e.g. XXL).
                  </p>
                )}
                {tierFields.map((tierField, index) => (
                  <div
                    key={tierField.id}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-start"
                  >
                    <FormField
                      control={form.control}
                      name={`prices.${index}.minQuantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index === 0 ? "" : "sm:invisible"}>Min qty</FormLabel>
                          <FormControl>
                            <NumberField field={field} integer min={1} placeholder="Min qty" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`prices.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index === 0 ? "" : "sm:invisible"}>Price ₹</FormLabel>
                          <FormControl>
                            <NumberField field={field} min={0.01} placeholder="Price ₹" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`prices.${index}.mrp`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index === 0 ? "" : "sm:invisible"}>MRP ₹</FormLabel>
                          <FormControl>
                            <NumberField field={field} min={0.01} placeholder="MRP ₹" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="sm:mt-7"
                      disabled={tierFields.length === 1}
                      onClick={() => removeTier(index)}
                      aria-label={`Remove tier ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                ))}
                {form.formState.errors.prices?.root?.message && (
                  <p className="text-sm text-destructive">{form.formState.errors.prices.root.message}</p>
                )}
                {typeof form.formState.errors.prices?.message === "string" && (
                  <p className="text-sm text-destructive">{form.formState.errors.prices.message}</p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Suggest the next slab from the largest finished min-qty (rows may be half-typed).
                    const mins = (form.getValues("prices") ?? [])
                      .map((t) => Number(t?.minQuantity))
                      .filter((n) => Number.isFinite(n) && n >= 1);
                    const nextMin = mins.length ? Math.max(...mins) * 5 : 10;
                    appendTier(emptyTier(nextMin));
                  }}
                >
                  <Plus aria-hidden /> Add tier
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tax & shipping */}
        <Card data-form-section="hsnCode">
          <CardHeader>
            <CardTitle>Tax &amp; shipping</CardTitle>
            <CardDescription>
              Prices are GST-inclusive. HSN and rate print on the invoice; weight and box size drive the shipping
              rate card (chargeable weight = greater of actual and volumetric L×W×H ÷ 5000).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="hsnCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HSN code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="6109" inputMode="numeric" maxLength={8} className="font-mono" />
                    </FormControl>
                    <FormDescription>4, 6 or 8 digits — e.g. 6109 (T-shirts), 4202 (bags), 9608 (pens).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gstRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST rate *</FormLabel>
                    <FormControl>
                      <div role="radiogroup" aria-label="GST rate" className="flex flex-wrap gap-1.5">
                        {GST_RATES.map((rate) => {
                          const selected = Number(field.value) === rate;
                          return (
                            <button
                              key={rate}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => field.onChange(rate)}
                              className={`h-9 min-w-[3.25rem] rounded-lg border px-3 text-sm font-semibold tabular-nums transition-all ${
                                selected
                                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                  : "border-border bg-background hover:border-primary/40"
                              }`}
                            >
                              {rate}%
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormDescription>
                      {Number.isFinite(firstPrice) && firstPrice > 0 && !tiersLiveOnVariants
                        ? `₹${firstPrice} includes ₹${splitInclusive(firstPrice, Number(gstRate) || 0).tax.toFixed(2)} GST.`
                        : "Intra-state orders split this into CGST + SGST; inter-state charge IGST."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weightGrams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight per unit (g) *</FormLabel>
                    <FormControl>
                      <NumberField field={field} integer min={0} placeholder="e.g. 250" />
                    </FormControl>
                    <FormDescription>Packed weight of one piece. 0 falls back to 500 g.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.4fr)]">
              {(
                [
                  ["lengthCm", "Length (cm)"],
                  ["widthCm", "Width (cm)"],
                  ["heightCm", "Height (cm)"],
                ] as const
              ).map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <NumberField field={{ ...field, value: field.value ?? undefined } as typeof field}
                    emptyValue={null} min={0} placeholder="—" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <div className="rounded-xl bg-surface p-3.5 text-xs ring-1 ring-foreground/[0.06] sm:self-end">
                <p className="eyebrow text-muted-foreground">Chargeable weight</p>
                <p className="mt-1 text-lg font-extrabold tabular-nums tracking-tight">
                  {chargeable > 0 ? formatGrams(chargeable) : "—"}
                </p>
                <p className="text-muted-foreground">
                  Actual {formatGrams(Number(weightGrams) || 0)}
                  {volumetric > 0 ? ` · volumetric ${formatGrams(volumetric)}` : " · add dimensions for volumetric"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        <Card data-form-section="variants">
          <CardHeader>
            <CardTitle>Variants</CardTitle>
            <CardDescription>
              Colour and size options with independent stock, SKU, images and pricing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VariantsEditor form={form} pricingMode={pricingMode} productWeightGrams={Number(weightGrams) || undefined} />
          </CardContent>
        </Card>

        {/* Specs */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
            <CardDescription>Label/value pairs shown on the product page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {specFields.map((specField, index) => (
              <div
                key={specField.id}
                className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-start"
              >
                <FormField
                  control={form.control}
                  name={`specs.${index}.label`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={index === 0 ? "" : "sm:invisible"}>Label</FormLabel>
                      <FormControl>
                        <Input placeholder="Fabric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`specs.${index}.value`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={index === 0 ? "" : "sm:invisible"}>Value</FormLabel>
                      <FormControl>
                        <Input placeholder="100% Cotton" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="sm:mt-7"
                  onClick={() => removeSpec(index)}
                  aria-label={`Remove specification ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendSpec({ label: "", value: "" })}
            >
              <Plus aria-hidden /> Add spec
            </Button>
          </CardContent>
        </Card>

        {/* Flags */}
        <Card>
          <CardHeader>
            <CardTitle>Visibility & badges</CardTitle>
            <CardDescription>Control storefront visibility and marketing badges.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal">Active</FormLabel>
                    <FormDescription>Visible on the storefront</FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isNew"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal">New Arrival</FormLabel>
                    <FormDescription>Shows the NEW badge</FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal">Featured</FormLabel>
                    <FormDescription>Highlighted on the home page</FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isBestSeller"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal">Best Seller</FormLabel>
                    <FormDescription>Shows the BESTSELLER badge</FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <SeoFields control={form.control} />

        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
          <Button type="button" variant="outline" asChild>
            <a href="/admin/products">
              <ArrowLeft aria-hidden /> Cancel
            </a>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Save aria-hidden />
            )}
            {isEdit ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
