"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { isRecordNotFound } from "@/lib/prisma-errors";
import { assertAdmin } from "@/lib/auth/guards";
import { brandSchema, type BrandInput } from "@/lib/validations/admin";
import type { ActionResult } from "@/types";
import { str, strOpt } from "@/lib/form";

/**
 * Admin — brand CRUD.
 */

function parseBrandForm(formData: FormData): BrandInput {
  // Builds the raw input — validation happens in the actions via safeParse so
  // failures return ActionResult.fieldErrors instead of throwing.
  return {
    name: str(formData.get("name")),
    slug: str(formData.get("slug")),
    logo: str(formData.get("logo")),
    sortOrder: formData.get("sortOrder")
      ? Number(formData.get("sortOrder"))
      : 0,
  };
}

function revalidateBrands() {
  revalidatePath("/admin/brands");
  revalidatePath("/");
  revalidatePath("/product");
}

export async function createBrandAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const parsed = brandSchema.safeParse(parseBrandForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const clash = await db.brand.findFirst({
    where: { OR: [{ slug: parsed.data.slug }, { name: parsed.data.name }] },
  });
  if (clash)
    return {
      ok: false,
      message: "A brand with this name or slug already exists.",
    };

  await db.brand.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      logo: parsed.data.logo || null,
      sortOrder: parsed.data.sortOrder,
    },
  });

  revalidateBrands();
  return { ok: true, message: "Brand created." };
}

export async function updateBrandAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const id = Number(formData.get("id"));
  if (!id) return { ok: false, message: "Missing brand id." };

  const parsed = brandSchema.safeParse(parseBrandForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const clash = await db.brand.findFirst({
    where: {
      OR: [{ slug: parsed.data.slug }, { name: parsed.data.name }],
      id: { not: id },
    },
  });
  if (clash)
    return {
      ok: false,
      message: "A brand with this name or slug already exists.",
    };

  try {
    await db.brand.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        logo: parsed.data.logo || null,
        sortOrder: parsed.data.sortOrder,
      },
    });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Brand not found — it may have been removed.",
      };
    throw error;
  }

  revalidateBrands();
  return { ok: true, message: "Brand updated." };
}

export async function deleteBrandAction(id: number): Promise<ActionResult> {
  await assertAdmin();

  const existing = await db.brand.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "Brand not found." };

  try {
    await db.brand.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Brand not found — it may have been removed.",
      };
    throw error;
  }
  revalidateBrands();
  return { ok: true, message: "Brand deleted." };
}
