"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/guards";
import { categorySchema, type CategoryInput } from "@/lib/validations/admin";
import type { ActionResult } from "@/types";
import { str, strOpt } from "@/lib/form";

/**
 * Admin — category CRUD (supports parent/child hierarchy).
 */

function parseCategoryForm(formData: FormData): CategoryInput {
  // Builds the raw input — validation happens in the actions via safeParse so
  // failures return ActionResult.fieldErrors instead of throwing.
  return {
    title: str(formData.get("title")),
    slug: str(formData.get("slug")),
    image: str(formData.get("image")),
    parentId: formData.get("parentId") ? Number(formData.get("parentId")) : null,
    isSpecial: formData.get("isSpecial") === "true",
    sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : 0,
    metaTitle: str(formData.get("metaTitle")),
    metaDescription: str(formData.get("metaDescription")),
    metaKeywords: str(formData.get("metaKeywords")),
    ogImage: str(formData.get("ogImage")),
  };
}

function revalidateCatalog() {
  revalidatePath("/admin/categories");
  revalidatePath("/product");
  revalidatePath("/category");
  revalidatePath("/");
}

export async function createCategoryAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await assertAdmin();

  const parsed = categorySchema.safeParse(parseCategoryForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const clash = await db.category.findUnique({ where: { slug: parsed.data.slug } });
  if (clash) {
    return { ok: false, message: "Slug already in use.", fieldErrors: { slug: ["Slug already exists."] } };
  }

  if (parsed.data.parentId) {
    const parent = await db.category.findUnique({ where: { id: parsed.data.parentId } });
    if (!parent) return { ok: false, message: "Parent category not found." };
  }

  await db.category.create({
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      image: parsed.data.image || null,
      parentId: parsed.data.parentId ?? null,
      isSpecial: parsed.data.isSpecial,
      sortOrder: parsed.data.sortOrder,
      metaTitle: parsed.data.metaTitle || null,
      metaDescription: parsed.data.metaDescription || null,
      metaKeywords: parsed.data.metaKeywords || null,
      ogImage: parsed.data.ogImage || null,
    },
  });

  revalidateCatalog();
  return { ok: true, message: "Category created." };
}

export async function updateCategoryAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  await assertAdmin();

  const id = Number(formData.get("id"));
  if (!id) return { ok: false, message: "Missing category id." };

  const parsed = categorySchema.safeParse(parseCategoryForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.parentId === id) {
    return { ok: false, message: "A category cannot be its own parent." };
  }

  const clash = await db.category.findFirst({ where: { slug: parsed.data.slug, id: { not: id } } });
  if (clash) {
    return { ok: false, message: "Slug already in use.", fieldErrors: { slug: ["Slug already exists."] } };
  }

  await db.category.update({
    where: { id },
    data: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      image: parsed.data.image || null,
      parentId: parsed.data.parentId ?? null,
      isSpecial: parsed.data.isSpecial,
      sortOrder: parsed.data.sortOrder,
      metaTitle: parsed.data.metaTitle || null,
      metaDescription: parsed.data.metaDescription || null,
      metaKeywords: parsed.data.metaKeywords || null,
      ogImage: parsed.data.ogImage || null,
    },
  });

  revalidateCatalog();
  return { ok: true, message: "Category updated." };
}

export async function deleteCategoryAction(id: number): Promise<ActionResult> {
  await assertAdmin();

  const existing = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { children: true, products: true } } },
  });

  if (!existing) return { ok: false, message: "Category not found." };
  if (existing._count.children > 0) {
    return { ok: false, message: "Delete or move the sub-categories first." };
  }

  await db.category.delete({ where: { id } });
  revalidateCatalog();
  return { ok: true, message: "Category deleted." };
}
