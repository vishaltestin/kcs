"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { isRecordNotFound } from "@/lib/prisma-errors";
import { assertVendor } from "@/lib/auth/guards";
import { productSchema } from "@/lib/validations/admin";
import type { ActionResult } from "@/types";
import {
  cleanOptions,
  cleanVariants,
  findSlugClash,
  findVariantSkuClash,
  parseProductForm,
  productData,
  productTierRows,
  validationFailure,
} from "@/lib/product-form";
import type { Prisma } from "@prisma/client";

/**
 * Vendor portal — catalogue management. Vendors create, edit, publish/unpublish
 * and delete ONLY their own products. Marketing flags (featured / bestseller)
 * stay admin-controlled.
 */

async function ownProduct(vendorId: string, productId: string) {
  return db.product.findFirst({
    where: { id: productId, vendorId },
    select: { id: true, slug: true, name: true },
  });
}

function revalidateCatalog(slug?: string) {
  revalidatePath("/vendor/products");
  revalidatePath("/vendor");
  revalidatePath("/product");
  revalidatePath("/sellers");
  if (slug) revalidatePath(`/product/${slug}`);
  revalidatePath("/");
}

/** Strip admin-only fields from a vendor submission before validation. */
function vendorProductForm(formData: FormData, vendorId: string) {
  const raw = parseProductForm(formData);
  return {
    ...raw,
    vendorId,
    isFeatured: false,
    isBestSeller: false,
  };
}

export async function vendorCreateProductAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { vendor } = await assertVendor();

  const parsed = productSchema.safeParse(vendorProductForm(formData, vendor.id));
  if (!parsed.success) return validationFailure(parsed.error);

  const slugClash = await findSlugClash(parsed.data.slug);
  if (slugClash) return slugClash;

  const skuClash = await findVariantSkuClash(parsed.data);
  if (skuClash) return skuClash;

  const options = cleanOptions(parsed.data);
  const variants = cleanVariants(parsed.data);

  await db.product.create({
    data: {
      ...productData(parsed.data),
      vendorId: vendor.id,
      images: {
        create: parsed.data.images
          .filter((url) => url !== parsed.data.image)
          .map((url, index) => ({ url, sortOrder: index })),
      },
      prices: { create: productTierRows(parsed.data, variants) },
      specs: { create: parsed.data.specs.map((spec) => ({ label: spec.label, value: spec.value })) },
      categories: { create: parsed.data.categoryIds.map((categoryId) => ({ categoryId })) },
      options: { create: options.map((o, index) => ({ name: o.name, values: o.values, sortOrder: index })) },
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

  revalidateCatalog(parsed.data.slug);
  return { ok: true, message: "Product created." };
}

export async function vendorUpdateProductAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { vendor } = await assertVendor();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing product id." };

  const existing = await ownProduct(vendor.id, id);
  if (!existing) return { ok: false, message: "Product not found — it may belong to another seller." };

  const parsed = productSchema.safeParse(vendorProductForm(formData, vendor.id));
  if (!parsed.success) return validationFailure(parsed.error);

  const slugClash = await findSlugClash(parsed.data.slug, id);
  if (slugClash) return slugClash;

  const skuClash = await findVariantSkuClash(parsed.data, id);
  if (skuClash) return skuClash;

  const options = cleanOptions(parsed.data);
  const variants = cleanVariants(parsed.data);
  // "Has variants" is a visibility toggle — see the admin action for why the
  // stored rows survive a switch-off.
  const syncVariantData = parsed.data.hasVariants;

  // Marketing flags are admin-controlled — never overwrite them from the
  // vendor portal.
  const { isFeatured, isBestSeller, ...updateData } = productData(parsed.data);
  void isFeatured;
  void isBestSeller;

  await db.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: updateData });
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

  revalidateCatalog(parsed.data.slug);
  return { ok: true, message: "Product updated." };
}

export async function vendorToggleProductActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const { vendor } = await assertVendor();

  const existing = await ownProduct(vendor.id, id);
  if (!existing) return { ok: false, message: "Product not found — it may belong to another seller." };

  try {
    await db.product.update({ where: { id }, data: { isActive } });
  } catch (error) {
    if (isRecordNotFound(error)) return { ok: false, message: "Product not found — it may have been removed." };
    throw error;
  }
  revalidateCatalog(existing.slug);
  return { ok: true, message: isActive ? "Product published." : "Product unpublished." };
}

export async function vendorDeleteProductAction(id: string): Promise<ActionResult> {
  const { vendor } = await assertVendor();

  const existing = await ownProduct(vendor.id, id);
  if (!existing) return { ok: false, message: "Product not found — it may belong to another seller." };

  // Products with order history are never deleted — order items snapshot the
  // name/price, but the link back to the catalogue row must stay intact.
  const ordered = await db.orderItem.count({ where: { productId: id } });
  if (ordered > 0) {
    return {
      ok: false,
      message: "This product has orders against it, so it can't be deleted. Unpublish it instead.",
    };
  }

  try {
    await db.product.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error)) return { ok: false, message: "Product not found — it may have been removed." };
    throw error;
  }
  revalidateCatalog();
  return { ok: true, message: "Product deleted." };
}
