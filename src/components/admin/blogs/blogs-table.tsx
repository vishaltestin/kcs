"use client";

import Image from "next/image";
import Link from "next/link";

import { createColumnHelper } from "@tanstack/react-table";
import { ExternalLink, MoreHorizontal, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableFeatures } from "@/components/data-table/data-table";
import { SortButton } from "@/components/data-table/sort-button";
import { ConfirmMenuItem } from "@/components/data-table/row-actions";
import { deleteBlogPostAction } from "@/actions/admin/blogs";

export interface AdminBlogRow {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  author: string;
  isPublished: boolean;
  updatedAt: Date;
}

const columnHelper = createColumnHelper<DataTableFeatures, AdminBlogRow>();

export function BlogsTable({ posts }: { posts: AdminBlogRow[] }) {
  const columns = [
    columnHelper.accessor("title", {
      meta: { label: "Post" },
      header: ({ column }) => <SortButton column={column} label="Post" />,
      cell: ({ row }) => {
        const post = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="relative hidden h-11 w-16 shrink-0 overflow-hidden rounded-md bg-muted sm:block">
              <Image src={post.image} alt="" fill className="object-cover" sizes="64px" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/blog/${post.slug}`}
                target="_blank"
                className="line-clamp-1 font-medium hover:text-primary"
              >
                {post.title}
              </Link>
              <p className="line-clamp-1 text-xs text-muted-foreground">{post.excerpt}</p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("author", {
      meta: { label: "Author" },
      header: ({ column }) => <SortButton column={column} label="Author" />,
      cell: ({ row }) => <span className="text-sm">{row.original.author}</span>,
    }),
    columnHelper.accessor("isPublished", {
      meta: { label: "Status" },
      header: ({ column }) => <SortButton column={column} label="Status" />,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={row.original.isPublished ? "bg-green-100 text-green-800" : "bg-muted"}
        >
          {row.original.isPublished ? "Published" : "Draft"}
        </Badge>
      ),
      filterFn: "equalsString",
    }),
    columnHelper.accessor("updatedAt", {
      meta: { label: "Updated" },
      header: ({ column }) => <SortButton column={column} label="Updated" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {new Date(row.original.updatedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      meta: { label: "Actions" },
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const post = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${post.title}`}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Post</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/blogs/${post.id}/edit`}>
                    <Pencil aria-hidden /> Edit
                  </Link>
                </DropdownMenuItem>
                {post.isPublished && (
                  <DropdownMenuItem asChild>
                    <Link href={`/blog/${post.slug}`} target="_blank">
                      <ExternalLink aria-hidden /> View on store
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <ConfirmMenuItem
                  label="Delete"
                  title={`Delete "${post.title}"?`}
                  description="The blog post will be permanently removed."
                  onConfirm={() => deleteBlogPostAction(post.id)}
                />
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
    }),
  ];

  return (
    <DataTable
      columns={columns}
      data={posts}
      getRowId={(post) => String(post.id)}
      globalFilter={(post, query) =>
        [post.title, post.slug, post.author, post.excerpt]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      }
      searchPlaceholder="Search posts…"
      filters={[
        {
          columnId: "isPublished",
          title: "Status",
          options: [
            { label: "Published", value: "true" },
            { label: "Draft", value: "false" },
          ],
        },
      ]}
      initialSorting={[{ id: "updatedAt", desc: true }]}
      initialPageSize={20}
      emptyTitle="No posts found"
      emptyDescription="Try a different search or write a new post."
    />
  );
}
