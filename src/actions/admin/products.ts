"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { isRecordNotFound } from "@/lib/prisma-errors";
import { assertAdmin } from "@/lib/auth/guards";
import { productSchema } from "@/lib/validations/admin";
import type { ActionResult } from "@/types";
import {
  cleanOptions,
  cleanVariants,
  findVariantSkuClash,
  parseProductForm,
  productData,
  productTierRows,
  validationFailure,
} from "@/lib/product-form";
import type { Prisma } from "@prisma/client";

/**
 * Admin — product CRUD.
 */

export async function createProductAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const parsed = productSchema.safeParse(parseProductForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  // Every product belongs to a vendor — the admin picks which one.
  const vendorId = parsed.data.vendorId?.trim();
  if (!vendorId) {
    return {
      ok: false,
      message: "Pick the vendor that sells this product.",
      fieldErrors: { vendorId: ["Vendor is required."] },
    };
  }
  const vendor = await db.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
  if (!vendor) {
    return {
      ok: false,
      message: "The selected vendor no longer exists.",
      fieldErrors: { vendorId: ["Unknown vendor."] },
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

  const skuClash = await findVariantSkuClash(parsed.data);
  if (skuClash) return skuClash;

  const options = cleanOptions(parsed.data);
  const variants = cleanVariants(parsed.data);

  await db.product.create({
    data: {
      ...productData(parsed.data),
      vendorId,
      images: {
        create: parsed.data.images
          .filter((url) => url !== parsed.data.image)
          .map((url, index) => ({ url, sortOrder: index })),
      },
      prices: {
        create: productTierRows(parsed.data, variants),
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
      options: {
        create: options.map((o, index) => ({ name: o.name, values: o.values, sortOrder: index })),
      },
      variants: {
        create: variants.map((variant) => {
          const { id, prices, ...v } = variant;
          void id; // new product → ids from the form are meaningless
          return {
            ...v,
            prices: { create: prices.map((t) => ({ minQuantity: t.minQuantity, price: t.price, mrp: t.mrp })) },
          };
        }),
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
  if (!parsed.success) return validationFailure(parsed.error);

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "Product not found." };

  // Vendor reassignment is optional on edit — keep the current owner when the
  // form doesn't submit one.
  let vendorId: string | undefined;
  const submittedVendor = parsed.data.vendorId?.trim();
  if (submittedVendor && submittedVendor !== existing.vendorId) {
    const vendor = await db.vendor.findUnique({ where: { id: submittedVendor }, select: { id: true } });
    if (!vendor) {
      return {
        ok: false,
        message: "The selected vendor no longer exists.",
        fieldErrors: { vendorId: ["Unknown vendor."] },
      };
    }
    vendorId = submittedVendor;
  }

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

  const skuClash = await findVariantSkuClash(parsed.data, id);
  if (skuClash) return skuClash;

  const options = cleanOptions(parsed.data);
  const variants = cleanVariants(parsed.data);
  // The "this product comes in variants" switch is a *visibility* toggle, not a
  // delete. While it is off the form submits no variant rows, so syncing would
  // wipe every SKU, price table and variant image the product already has —
  // and a product that goes back to being single-size tomorrow would lose the
  // data it needs the day after. So: with the switch off we leave the stored
  // option axes and variant rows completely untouched (flipping the switch back
  // on restores them exactly). Rows are only removed when they were really
  // edited away (switch on) or via deleteProductVariantsAction.
  const syncVariantData = parsed.data.hasVariants;

  await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: { ...productData(parsed.data), ...(vendorId ? { vendorId } : {}) },
    });
    await tx.productImage.deleteMany({ where: { productId: id } });
    await tx.productPrice.deleteMany({ where: { productId: id } });
    await tx.productSpec.deleteMany({ where: { productId: id } });
    await tx.productCategory.deleteMany({ where: { productId: id } });
    if (syncVariantData) await tx.productOption.deleteMany({ where: { productId: id } });

    await tx.productImage.createMany({
      data: parsed.data.images
        .filter((url) => url !== parsed.data.image)
        .map((url, index) => ({ url, sortOrder: index, productId: id })),
    });
    await tx.productPrice.createMany({
      data: productTierRows(parsed.data, variants).map((tier) => ({ ...tier, productId: id })),
    });
    await tx.productSpec.createMany({
      data: parsed.data.specs.map((spec) => ({ label: spec.label, value: spec.value, productId: id })),
    });
    await tx.productCategory.createMany({
      data: parsed.data.categoryIds.map((categoryId) => ({ productId: id, categoryId })),
    });

    if (syncVariantData) {
      await tx.productOption.createMany({
        data: options.map((o, index) => ({ productId: id, name: o.name, values: o.values, sortOrder: index })),
      });

      // Variants are upserted by id so carts and past order lines keep pointing
      // at the same rows; anything no longer generated is removed.
      const keepIds = variants.map((v) => v.id).filter((v): v is string => !!v);
      await tx.productVariant.deleteMany({ where: { productId: id, id: { notIn: keepIds } } });
      for (const { id: variantId, prices, ...v } of variants) {
        const data: Prisma.ProductVariantUncheckedCreateInput = { ...v, productId: id };
        if (variantId) {
          const updated = await tx.productVariant.updateMany({ where: { id: variantId, productId: id }, data });
          if (updated.count === 1) {
            await tx.variantPrice.deleteMany({ where: { variantId } });
            if (prices.length) {
              await tx.variantPrice.createMany({
                data: prices.map((t) => ({ variantId, minQuantity: t.minQuantity, price: t.price, mrp: t.mrp })),
              });
            }
            continue;
          }
        }
        await tx.productVariant.create({
          data: {
            ...data,
            prices: { create: prices.map((t) => ({ minQuantity: t.minQuantity, price: t.price, mrp: t.mrp })) },
          },
        });
      }
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/product");
  revalidatePath(`/product/${parsed.data.slug}`);
  revalidatePath("/");
  return { ok: true, message: "Product updated." };
}

/**
 * Explicit, irreversible removal of a product's option axes and variant rows.
 * This is the only path that deletes them — turning the "has variants" switch
 * off merely hides them (see updateProductAction). Past order lines keep their
 * own snapshots (name / SKU / price), so only `OrderItem.variantId` is nulled.
 */
export async function deleteProductVariantsAction(id: string): Promise<ActionResult> {
  await assertAdmin();

  const product = await db.product.findUnique({
    where: { id },
    select: { id: true, slug: true, variants: { select: { id: true } } },
  });
  if (!product) return { ok: false, message: "Product not found." };

  const removed = product.variants.length;
  await db.$transaction([
    db.productVariant.deleteMany({ where: { productId: id } }),
    db.productOption.deleteMany({ where: { productId: id } }),
    db.product.update({
      where: { id },
      data: { hasVariants: false },
    }),
  ]);

  revalidatePath("/admin/products");
  revalidatePath("/product");
  revalidatePath(`/product/${product.slug}`);
  revalidatePath("/");
  return {
    ok: true,
    message: removed > 0 ? `${removed} variant${removed === 1 ? "" : "s"} and their option axes deleted.` : "No variants to remove.",
  };
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
