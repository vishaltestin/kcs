"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImagePicker } from "@/components/admin/image-picker";
import { SeoFields } from "@/components/admin/seo/seo-fields";
import { createBlogPostAction, updateBlogPostAction } from "@/actions/admin/blogs";
import { blogPostSchema } from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";

export type BlogFormValues = z.infer<typeof blogPostSchema>;

export interface BlogFormPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  isPublished: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
}

export function BlogForm({ mode, post }: { mode: "create" | "edit"; post?: BlogFormPost }) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      excerpt: post?.excerpt ?? "",
      content: post?.content ?? "",
      image: post?.image ?? "",
      author: post?.author ?? "KCS G-Mart Team",
      isPublished: post?.isPublished ?? true,
      metaTitle: post?.metaTitle ?? "",
      metaDescription: post?.metaDescription ?? "",
      metaKeywords: post?.metaKeywords ?? "",
      ogImage: post?.ogImage ?? "",
    },
  });

  const titleValue = form.watch("title");
  useEffect(() => {
    if (!slugTouched && titleValue) {
      form.setValue("slug", slugify(titleValue), { shouldValidate: false });
    }
  }, [titleValue, slugTouched, form]);

  const imageValue = form.watch("image");

  const onSubmit = async (values: BlogFormValues) => {
    const formData = new FormData();
    if (isEdit) formData.set("id", String(post!.id));
    formData.set("title", values.title);
    formData.set("slug", values.slug);
    formData.set("excerpt", values.excerpt);
    formData.set("content", values.content);
    formData.set("image", values.image);
    formData.set("author", values.author);
    formData.set("isPublished", values.isPublished ? "true" : "false");
    formData.set("metaTitle", values.metaTitle ?? "");
    formData.set("metaDescription", values.metaDescription ?? "");
    formData.set("metaKeywords", values.metaKeywords ?? "");
    formData.set("ogImage", values.ogImage ?? "");

    const result = isEdit
      ? await updateBlogPostAction(null, formData)
      : await createBlogPostAction(null, formData);

    if (result.ok) {
      toast.success(result.message ?? "Saved!");
      router.push("/admin/blogs");
    } else {
      toast.error(result.message);
      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.length) {
            form.setError(key as keyof BlogFormValues, { message: messages[0] });
          }
        }
      }
    }
  };

  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Post details</CardTitle>
            <CardDescription>Blog articles appear on the storefront blog.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="10 Corporate Diwali Gifting Ideas for 2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="auto-generated-from-title"
                      {...field}
                      onChange={(e) => {
                        setSlugTouched(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author *</FormLabel>
                  <FormControl>
                    <Input placeholder="KCS G-Mart Team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Excerpt *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      maxLength={500}
                      placeholder="Short summary shown on the blog listing page…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Content *</FormLabel>
                  <FormControl>
                    <Textarea rows={14} placeholder="Full article content…" {...field} />
                  </FormControl>
                  <FormDescription>Plain text — paragraphs are preserved as-is.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cover image & publishing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <ImagePicker
                    value={imageValue}
                    onChange={(path) => field.onChange(path)}
                    label="Cover image *"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal">Published</FormLabel>
                    <FormDescription>Visible on the storefront blog listing.</FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <SeoFields control={form.control} />

        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
          <Button type="button" variant="outline" asChild>
            <a href="/admin/blogs">
              <ArrowLeft aria-hidden /> Cancel
            </a>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            {isEdit ? "Save Changes" : "Create Post"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
