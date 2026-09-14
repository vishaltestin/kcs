"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/guards";
import { homeBandSchema, type HomeBandInput } from "@/lib/validations/admin";
import { str } from "@/lib/form";
import type { ActionResult } from "@/types";

/**
 * Admin — home page promo bands.
 *
 * There is exactly one row per slot, so the form upserts rather than creates:
 * a band can be rewritten and switched off, never duplicated or orphaned.
 */
function parseBandForm(formData: FormData): HomeBandInput {
  return {
    slot: str(formData.get("slot")) as HomeBandInput["slot"],
    eyebrow: str(formData.get("eyebrow")),
    title: str(formData.get("title")),
    subtitle: str(formData.get("subtitle")),
    ctaLabel: str(formData.get("ctaLabel")),
    ctaHref: str(formData.get("ctaHref")),
    image: str(formData.get("image")),
    videoUrl: str(formData.get("videoUrl")),
    isActive: formData.get("isActive") === "true",
  };
}

/** Empty fields become NULL so the storefront falls back to its defaults. */
function bandData(parsed: HomeBandInput) {
  const orNull = (value: string) => (value === "" ? null : value);
  return {
    eyebrow: orNull(parsed.eyebrow),
    title: parsed.title,
    subtitle: orNull(parsed.subtitle),
    ctaLabel: orNull(parsed.ctaLabel),
    ctaHref: orNull(parsed.ctaHref),
    image: orNull(parsed.image),
    videoUrl: orNull(parsed.videoUrl),
    isActive: parsed.isActive,
  };
}

export async function updateHomeBandAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const parsed = homeBandSchema.safeParse(parseBandForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const slot = parsed.data.slot;
  const data = bandData(parsed.data);

  await db.homeBanner.upsert({
    where: { slot },
    create: { slot, ...data },
    update: data,
  });

  revalidatePath("/");
  revalidatePath("/admin/home-bands");

  return { ok: true, message: data.isActive ? "Band saved — the home page is live with it." : "Band saved and hidden from the home page." };
}
