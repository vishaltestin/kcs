import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/ui";
import { BlogForm } from "@/components/admin/blogs/blog-form";
import { getAdminBlogPostForEdit } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Edit Blog Post" };

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId)) notFound();

  const post = await getAdminBlogPostForEdit(postId);
  if (!post) notFound();

  return (
    <div>
      <PageHeader title={`Edit: ${post.title}`} description="Update the blog post." />
      <BlogForm mode="edit" post={post} />
    </div>
  );
}
