"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useFieldArray, useForm } from "react-hook-form";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
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
import { ImagePicker } from "@/components/admin/image-picker";
import { SeoFields } from "@/components/admin/seo/seo-fields";
import { createProductAction, updateProductAction } from "@/actions/admin/products";
import { productSchema } from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";

export type ProductFormValues = z.infer<typeof productSchema>;

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
}

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
      isActive: product?.isActive ?? true,
      isNew: product?.isNew ?? false,
      isFeatured: product?.isFeatured ?? false,
      isBestSeller: product?.isBestSeller ?? false,
      prices: product?.prices?.length
        ? product.prices
        : [{ minQuantity: 10, price: NaN, mrp: NaN }],
      specs: product?.specs ?? [],
      metaTitle: product?.metaTitle ?? "",
      metaDescription: product?.metaDescription ?? "",
      metaKeywords: product?.metaKeywords ?? "",
      ogImage: product?.ogImage ?? "",
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
  const addGalleryImage = () =>
    form.setValue("images", [...form.getValues("images"), ""], { shouldDirty: true });
  const removeGalleryImage = (index: number) =>
    form.setValue(
      "images",
      form.getValues("images").filter((_, i) => i !== index),
      { shouldDirty: true }
    );

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
    formData.set("prices", JSON.stringify(values.prices));
    formData.set("specs", JSON.stringify(values.specs));
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
      toast.error(result.message);
      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.length) {
            form.setError(key as keyof ProductFormValues, { message: messages[0] });
          }
        }
      }
    }
  };

  const { isSubmitting } = form.formState;
  const parentCategories = categories.filter((c) => c.parentId === null);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basics + organisation */}
        <Card>
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
                  <FormLabel>Stock *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
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
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>Main image plus optional gallery images.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <ImagePicker
                    value={imageValue}
                    onChange={(path) => field.onChange(path)}
                    label="Main image *"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Additional gallery images</p>
              {galleryImages.map((url, index) => (
                <div key={`gallery-${index}`} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`images.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="/images/…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeGalleryImage(index)}
                    aria-label="Remove gallery image"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGalleryImage}
              >
                <Plus aria-hidden /> Add image
              </Button>
            </div>
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
        <Card>
          <CardHeader>
            <CardTitle>Bulk pricing tiers *</CardTitle>
            <CardDescription>
              e.g. 10+ @ ₹749, 50+ @ ₹689 — the storefront shows a bulk pricing table.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
                      <FormLabel className={index === 0 ? "" : "sm:invisible"}>
                        Min qty
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Min qty"
                          value={Number.isNaN(field.value) ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
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
                        <Input
                          type="number"
                          min={0.01}
                          step="0.01"
                          placeholder="Price ₹"
                          value={Number.isNaN(field.value) ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
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
                        <Input
                          type="number"
                          min={0.01}
                          step="0.01"
                          placeholder="MRP ₹"
                          value={Number.isNaN(field.value) ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendTier({ minQuantity: 10, price: NaN, mrp: NaN })}
            >
              <Plus aria-hidden /> Add tier
            </Button>
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
