"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { isRecordNotFound } from "@/lib/prisma-errors";
import { assertAdmin } from "@/lib/auth/guards";
import { blogPostSchema, type BlogPostInput } from "@/lib/validations/admin";
import type { ActionResult } from "@/types";
import { str, strOpt } from "@/lib/form";

/**
 * Admin — blog CRUD.
 */

function parseBlogForm(formData: FormData): BlogPostInput {
  // Builds the raw input — validation happens in the actions via safeParse so
  // failures return ActionResult.fieldErrors instead of throwing.
  return {
    title: str(formData.get("title")),
    slug: str(formData.get("slug")),
    excerpt: str(formData.get("excerpt")),
    content: str(formData.get("content")),
    image: str(formData.get("image")),
    author: str(formData.get("author")) || "KCS G-Mart Team",
    isPublished: formData.get("isPublished") === "true",
    metaTitle: str(formData.get("metaTitle")),
    metaDescription: str(formData.get("metaDescription")),
    metaKeywords: str(formData.get("metaKeywords")),
    ogImage: str(formData.get("ogImage")),
  };
}

function revalidateBlog() {
  revalidatePath("/admin/blogs");
  revalidatePath("/blog");
  revalidatePath("/");
}

function blogPostData(parsed: BlogPostInput) {
  return {
    ...parsed,
    metaTitle: parsed.metaTitle || null,
    metaDescription: parsed.metaDescription || null,
    metaKeywords: parsed.metaKeywords || null,
    ogImage: parsed.ogImage || null,
  };
}

export async function createBlogPostAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const parsed = blogPostSchema.safeParse(parseBlogForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const clash = await db.blogPost.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (clash)
    return {
      ok: false,
      message: "Slug already in use.",
      fieldErrors: { slug: ["Slug already exists."] },
    };

  await db.blogPost.create({ data: blogPostData(parsed.data) });
  revalidateBlog();
  return { ok: true, message: "Blog post created." };
}

export async function updateBlogPostAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const id = Number(formData.get("id"));
  if (!id) return { ok: false, message: "Missing post id." };

  const parsed = blogPostSchema.safeParse(parseBlogForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const clash = await db.blogPost.findFirst({
    where: { slug: parsed.data.slug, id: { not: id } },
  });
  if (clash) return { ok: false, message: "Slug already in use." };

  try {
    await db.blogPost.update({ where: { id }, data: blogPostData(parsed.data) });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Post not found — it may have been removed.",
      };
    throw error;
  }
  revalidateBlog();
  revalidatePath(`/blog/${parsed.data.slug}`);
  return { ok: true, message: "Blog post updated." };
}

export async function deleteBlogPostAction(id: number): Promise<ActionResult> {
  await assertAdmin();

  const existing = await db.blogPost.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "Post not found." };

  try {
    await db.blogPost.delete({ where: { id } });
  } catch (error) {
    if (isRecordNotFound(error))
      return {
        ok: false,
        message: "Post not found — it may have been removed.",
      };
    throw error;
  }
  revalidateBlog();
  return { ok: true, message: "Blog post deleted." };
}
