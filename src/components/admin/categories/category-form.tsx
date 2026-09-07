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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePicker } from "@/components/admin/image-picker";
import { SeoFields } from "@/components/admin/seo/seo-fields";
import { createCategoryAction, updateCategoryAction } from "@/actions/admin/categories";
import { categorySchema } from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";

export type CategoryFormValues = z.infer<typeof categorySchema>;

export interface CategoryFormCategory {
  id: number;
  title: string;
  slug: string;
  image: string | null;
  parentId: number | null;
  isSpecial: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
}

export function CategoryForm({
  mode,
  category,
  parents,
}: {
  mode: "create" | "edit";
  category?: CategoryFormCategory;
  parents: { id: number; title: string }[];
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      title: category?.title ?? "",
      slug: category?.slug ?? "",
      image: category?.image ?? "",
      parentId: category?.parentId ?? null,
      isSpecial: category?.isSpecial ?? false,
      sortOrder: category?.sortOrder ?? 0,
      metaTitle: category?.metaTitle ?? "",
      metaDescription: category?.metaDescription ?? "",
      metaKeywords: category?.metaKeywords ?? "",
      ogImage: category?.ogImage ?? "",
    },
  });

  const titleValue = form.watch("title");
  useEffect(() => {
    if (!slugTouched && titleValue) {
      form.setValue("slug", slugify(titleValue), { shouldValidate: false });
    }
  }, [titleValue, slugTouched, form]);

  const imageValue = form.watch("image");

  const onSubmit = async (values: CategoryFormValues) => {
    const formData = new FormData();
    if (isEdit) formData.set("id", String(category!.id));
    formData.set("title", values.title);
    formData.set("slug", values.slug);
    formData.set("image", values.image ?? "");
    formData.set("parentId", values.parentId ? String(values.parentId) : "");
    formData.set("isSpecial", values.isSpecial ? "true" : "false");
    formData.set("sortOrder", String(values.sortOrder));
    formData.set("metaTitle", values.metaTitle ?? "");
    formData.set("metaDescription", values.metaDescription ?? "");
    formData.set("metaKeywords", values.metaKeywords ?? "");
    formData.set("ogImage", values.ogImage ?? "");

    const result = isEdit
      ? await updateCategoryAction(null, formData)
      : await createCategoryAction(null, formData);

    if (result.ok) {
      toast.success(result.message ?? "Saved!");
      router.push("/admin/categories");
    } else {
      toast.error(result.message);
      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.length) {
            form.setError(key as keyof CategoryFormValues, { message: messages[0] });
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
            <CardTitle>Category details</CardTitle>
            <CardDescription>
              Categories organise the catalogue menu; special categories appear in the
              storefront themes strip.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Festive Hampers" {...field} />
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
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent category</FormLabel>
                  <Select
                    value={field.value ? String(field.value) : "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Top-level category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Top-level category</SelectItem>
                      {parents
                        .filter((p) => p.id !== category?.id)
                        .map((parent) => (
                          <SelectItem key={parent.id} value={String(parent.id)}>
                            {parent.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Nest this category under a parent.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>Lower numbers appear first.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Image & visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <ImagePicker
                    value={imageValue ?? ""}
                    onChange={(path) => field.onChange(path)}
                    label="Category image"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isSpecial"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal">Special category</FormLabel>
                    <FormDescription>
                      Appears in the storefront&apos;s themes strip (e.g. Diwali gifting).
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <SeoFields control={form.control} />

        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
          <Button type="button" variant="outline" asChild>
            <a href="/admin/categories">
              <ArrowLeft aria-hidden /> Cancel
            </a>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            {isEdit ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
