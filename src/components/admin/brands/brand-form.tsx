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
import { ImagePicker } from "@/components/admin/image-picker";
import { createBrandAction, updateBrandAction } from "@/actions/admin/brands";
import { brandSchema } from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";

export type BrandFormValues = z.infer<typeof brandSchema>;

export interface BrandFormBrand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  sortOrder: number;
}

export function BrandForm({ mode, brand }: { mode: "create" | "edit"; brand?: BrandFormBrand }) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.name ?? "",
      slug: brand?.slug ?? "",
      logo: brand?.logo ?? "",
      sortOrder: brand?.sortOrder ?? 0,
    },
  });

  const nameValue = form.watch("name");
  useEffect(() => {
    if (!slugTouched && nameValue) {
      form.setValue("slug", slugify(nameValue), { shouldValidate: false });
    }
  }, [nameValue, slugTouched, form]);

  const logoValue = form.watch("logo");

  const onSubmit = async (values: BrandFormValues) => {
    const formData = new FormData();
    if (isEdit) formData.set("id", String(brand!.id));
    formData.set("name", values.name);
    formData.set("slug", values.slug);
    formData.set("logo", values.logo ?? "");
    formData.set("sortOrder", String(values.sortOrder));

    const result = isEdit
      ? await updateBrandAction(null, formData)
      : await createBrandAction(null, formData);

    if (result.ok) {
      toast.success(result.message ?? "Saved!");
      router.push("/admin/brands");
    } else {
      toast.error(result.message);
      if (result.fieldErrors) {
        for (const [key, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.length) {
            form.setError(key as keyof BrandFormValues, { message: messages[0] });
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
            <CardTitle>Brand details</CardTitle>
            <CardDescription>Brands featured on products across the catalogue.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Adidas" {...field} />
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
                      placeholder="auto-generated-from-name"
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
            <CardTitle>Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <ImagePicker
                    value={logoValue ?? ""}
                    onChange={(path) => field.onChange(path)}
                    label="Brand logo"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur">
          <Button type="button" variant="outline" asChild>
            <a href="/admin/brands">
              <ArrowLeft aria-hidden /> Cancel
            </a>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            {isEdit ? "Save Changes" : "Create Brand"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
