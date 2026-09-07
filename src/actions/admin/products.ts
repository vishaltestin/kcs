"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { isRecordNotFound } from "@/lib/prisma-errors";
import { assertAdmin } from "@/lib/auth/guards";
import { productSchema, type ProductInput } from "@/lib/validations/admin";
import type { ActionResult } from "@/types";
import { str, strOpt } from "@/lib/form";

/**
 * Admin — product CRUD.
 */

function parseProductForm(formData: FormData): ProductInput {
  // Builds the raw input — validation happens in the actions via safeParse so
  // failures return ActionResult.fieldErrors instead of throwing.
  return {
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
    isActive: formData.get("isActive") === "true",
    isNew: formData.get("isNew") === "true",
    isFeatured: formData.get("isFeatured") === "true",
    isBestSeller: formData.get("isBestSeller") === "true",
    prices: JSON.parse(String(formData.get("prices") ?? "[]")),
    specs: JSON.parse(String(formData.get("specs") ?? "[]")),
    metaTitle: str(formData.get("metaTitle")),
    metaDescription: str(formData.get("metaDescription")),
    metaKeywords: str(formData.get("metaKeywords")),
    ogImage: str(formData.get("ogImage")),
  };
}

function productData(parsed: ProductInput) {
  const baseTier = [...parsed.prices].sort(
    (a, b) => a.minQuantity - b.minQuantity,
  )[0];
  return {
    basePrice: baseTier.price,
    baseMrp: baseTier.mrp,
    name: parsed.name,
    slug: parsed.slug,
    sku: parsed.sku || null,
    brandId: parsed.brandId ?? null,
    introtext: parsed.introtext || null,
    description: parsed.description || null,
    image: parsed.image,
    video: parsed.video || null,
    delivery: parsed.delivery || null,
    stock: parsed.stock,
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

export async function createProductAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const parsed = productSchema.safeParse(parseProductForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const slugTaken = await db.product.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (slugTaken) {
    return {
      ok: false,
      message: "Slug already in use.",
      fieldErrors: { slug: ["Slug already exists."] },
    };
  }

  await db.product.create({
    data: {
      ...productData(parsed.data),
      images: {
        create: parsed.data.images
          .filter((url) => url !== parsed.data.image)
          .map((url, index) => ({ url, sortOrder: index })),
      },
      prices: {
        create: parsed.data.prices.map((tier) => ({
          minQuantity: tier.minQuantity,
          price: tier.price,
          mrp: tier.mrp,
        })),
      },
      specs: {
        create: parsed.data.specs.map((spec) => ({
          label: spec.label,
          value: spec.value,
        })),
      },
      categories: {
        create: parsed.data.categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/product");
  revalidatePath("/");
  return { ok: true, message: "Product created." };
}

export async function updateProductAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing product id." };

  const parsed = productSchema.safeParse(parseProductForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "Product not found." };

  const slugClash = await db.product.findFirst({
    where: { slug: parsed.data.slug, id: { not: id } },
  });
  if (slugClash) {
    return {
      ok: false,
      message: "Slug already in use.",
      fieldErrors: { slug: ["Slug already exists."] },
    };
  }

  await db.$transaction([
    db.product.update({
      where: { id },
      data: productData(parsed.data),
    }),
    db.productImage.deleteMany({ where: { productId: id } }),
    db.productPrice.deleteMany({ where: { productId: id } }),
    db.productSpec.deleteMany({ where: { productId: id } }),
    db.productCategory.deleteMany({ where: { productId: id } }),
    db.productImage.createMany({
      data: parsed.data.images
        .filter((url) => url !== parsed.data.image)
        .map((url, index) => ({ url, sortOrder: index, productId: id })),
    }),
    db.productPrice.createMany({
      data: parsed.data.prices.map((tier) => ({
        minQuantity: tier.minQuantity,
        price: tier.price,
        mrp: tier.mrp,
        productId: id,
      })),
    }),
    db.productSpec.createMany({
      data: parsed.data.specs.map((spec) => ({
        label: spec.label,
        value: spec.value,
        productId: id,
      })),
    }),
    db.productCategory.createMany({
      data: parsed.data.categoryIds.map((categoryId) => ({
        productId: id,
        categoryId,
      })),
    }),
  ]);

  revalidatePath("/admin/products");
  revalidatePath("/product");
  revalidatePath(`/product/${parsed.data.slug}`);
  revalidatePath("/");
  return { ok: true, message: "Product updated." };
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  await assertAdmin();

  const existing = await db.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { ok: false, message: "Product not found." };

  try {
    await db.product.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Product not found — it may have been removed.",
      };
    throw error;
  }
  revalidatePath("/admin/products");
  revalidatePath("/product");
  revalidatePath("/");
  return { ok: true, message: "Product deleted." };
}

/** Bulk delete used by the admin data table's bulk action bar. */
export async function deleteProductsAction(ids: string[]): Promise<ActionResult> {
  await assertAdmin();

  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, message: "No products selected." };
  }

  const deleted = await db.product.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/products");
  revalidatePath("/product");
  revalidatePath("/");
  return {
    ok: true,
    message: deleted.count === 1 ? "Product deleted." : `${deleted.count} products deleted.`,
  };
}

export async function toggleProductActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  await assertAdmin();
  try {
    await db.product.update({ where: { id }, data: { isActive } });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Product not found — it may have been removed.",
      };
    throw error;
  }
  revalidatePath("/admin/products");
  revalidatePath("/product");
  return {
    ok: true,
    message: isActive ? "Product published." : "Product unpublished.",
  };
}
