import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/ui";
import { BlogForm } from "@/components/admin/blogs/blog-form";

export const metadata: Metadata = { title: "New Blog Post" };

export default async function NewBlogPostPage() {
  return (
    <div>
      <PageHeader
        title="New Blog Post"
        description="Write an article for the storefront blog."
      />
      <BlogForm mode="create" />
    </div>
  );
}
