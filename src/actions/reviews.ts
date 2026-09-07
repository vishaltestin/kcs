"use server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { limitKey, rateLimit } from "@/lib/rate-limit";
import { reviewSchema, type ReviewInput } from "@/lib/validations/shop";
import type { ActionResult } from "@/types";
import { str, strOpt } from "@/lib/form";

/**
 * Product reviews — submitted for moderation (isApproved = false).
 */
export async function submitReviewAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Please sign in to write a review." };
  }

  const allowed = rateLimit(await limitKey("review"), 5, 60_000);
  if (!allowed) {
    return { ok: false, message: "Too many reviews submitted. Please try again later." };
  }

  const parsed = reviewSchema.safeParse({
    productId: str(formData.get("productId")),
    rating: Number(str(formData.get("rating"))),
    title: str(formData.get("title")),
    comment: str(formData.get("comment")),
    authorName: str(formData.get("authorName")),
  } satisfies ReviewInput);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const product = await db.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true },
  });
  if (!product) return { ok: false, message: "Product not found." };

  await db.review.create({
    data: {
      productId: product.id,
      userId: user.id,
      authorName: parsed.data.authorName,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      comment: parsed.data.comment,
      isApproved: false,
    },
  });

  return {
    ok: true,
    message: "Thank you! Your review is pending moderation and will appear shortly.",
  };
}
