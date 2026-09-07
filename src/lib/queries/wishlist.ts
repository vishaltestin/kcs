import { db } from "@/lib/db";

import type { WishlistItem } from "@/types";

/**
 * Wishlist read model — ALWAYS scoped by userId. Never queried without a
 * user id; the wishlist page falls back to the guest localStorage store.
 */
export async function getWishlistForUser(userId: string): Promise<WishlistItem[]> {
  const rows = await db.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          basePrice: true,
          brand: { select: { name: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.product.id,
    slug: row.product.slug,
    name: row.product.name,
    image: row.product.image,
    price: Number(row.product.basePrice),
    brand: row.product.brand?.name ?? null,
  }));
}
