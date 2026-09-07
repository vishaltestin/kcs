"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

import type { ActionResult } from "@/types";

/**
 * Wishlist mutations — server-side source of truth for signed-in users.
 * Every query is strictly scoped to the authenticated user's id so one
 * account can never read or mutate another account's wishlist.
 */

export async function toggleWishlistAction(
  productId: string
): Promise<ActionResult<{ wishlisted: boolean }>> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Please sign in to save gifting ideas." };
  }

  const existing = await db.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
    select: { id: true },
  });

  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/wishlist");
    return { ok: true, message: "Removed from wishlist", data: { wishlisted: false } };
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true },
  });
  if (!product || !product.isActive) {
    return { ok: false, message: "Product not found." };
  }

  await db.wishlistItem.create({ data: { userId: user.id, productId } });
  revalidatePath("/wishlist");
  return { ok: true, message: "Added to wishlist", data: { wishlisted: true } };
}

/**
 * Merges a guest (localStorage) wishlist into the signed-in user's account.
 * Called from the login/signup forms right after successful authentication.
 */
export async function mergeGuestWishlistAction(
  productIds: string[]
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user || productIds.length === 0) return { ok: true, message: "" };

  const products = await db.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true },
  });

  await db.wishlistItem.createMany({
    data: products.map((p) => ({ userId: user.id, productId: p.id })),
    skipDuplicates: true,
  });

  return { ok: true, message: "" };
}

/** Removes every wishlist item for the authenticated user. */
export async function clearWishlistAction(): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Please sign in first." };

  await db.wishlistItem.deleteMany({ where: { userId: user.id } });
  revalidatePath("/wishlist");
  return { ok: true, message: "Wishlist cleared." };
}
