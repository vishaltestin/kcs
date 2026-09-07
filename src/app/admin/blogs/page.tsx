import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/ui";
import { BlogsTable, type AdminBlogRow } from "@/components/admin/blogs/blogs-table";
import { getAdminBlogPosts } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Blog Posts" };

export default async function AdminBlogsPage() {
  const rows = await getAdminBlogPosts();

  const posts: AdminBlogRow[] = rows.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    image: p.image,
    author: p.author,
    isPublished: p.isPublished,
    updatedAt: p.updatedAt,
  }));

  return (
    <div>
      <PageHeader
        title="Blog Posts"
        description={`${posts.length} post${posts.length === 1 ? "" : "s"} on the storefront blog`}
        actions={
          <Button asChild>
            <Link href="/admin/blogs/new">
              <Plus aria-hidden /> Add Post
            </Link>
          </Button>
        }
      />
      <BlogsTable posts={posts} />
    </div>
  );
}
