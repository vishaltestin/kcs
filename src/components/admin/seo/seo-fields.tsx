"use client";

import type { Control, Path } from "react-hook-form";

import { ImagePicker } from "@/components/admin/image-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** Shape every admin form schema shares for its SEO override fields. */
export interface SeoFieldValues {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;
}

/**
 * `Path<T>` can't be resolved for an unconstrained generic, but every T that
 * extends SeoFieldValues has these keys, so the cast is sound.
 */
function seoPath<T>(key: keyof SeoFieldValues): Path<T> {
  return key as Path<T>;
}

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span
      className={`text-xs tabular-nums ${over ? "font-medium text-destructive" : "text-muted-foreground"}`}
    >
      {value.length}/{max}
    </span>
  );
}

/**
 * Shared "SEO & social sharing" card for the product/category/blog forms.
 * Values fall back to derived metadata on the storefront when left empty.
 */
export function SeoFields<T extends SeoFieldValues>({ control }: { control: Control<T> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO &amp; social sharing</CardTitle>
        <CardDescription>
          Optional overrides for search engines and social previews. Leave empty to
          derive metadata from the content automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name={seoPath<T>("metaTitle")}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-2">
                <FormLabel>Meta title</FormLabel>
                <CharCount value={field.value ?? ""} max={70} />
              </div>
              <FormControl>
                <Input
                  placeholder="Custom title tag for search results"
                  maxLength={70}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={seoPath<T>("metaKeywords")}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between gap-2">
                <FormLabel>Meta keywords</FormLabel>
                <CharCount value={field.value ?? ""} max={255} />
              </div>
              <FormControl>
                <Input
                  placeholder="corporate gifts, festive hampers, bulk pricing"
                  maxLength={255}
                  {...field}
                />
              </FormControl>
              <FormDescription>Comma-separated search keywords.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={seoPath<T>("metaDescription")}
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <FormLabel>Meta description</FormLabel>
                <CharCount value={field.value ?? ""} max={165} />
              </div>
              <FormControl>
                <Textarea
                  rows={3}
                  maxLength={165}
                  placeholder="Short summary shown under the title in search results (aim for 150–165 characters)."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={seoPath<T>("ogImage")}
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <ImagePicker
                value={field.value ?? ""}
                onChange={field.onChange}
                label="Social share image (OG image)"
              />
              <FormDescription>
                1200×630 image shown when the page is shared on WhatsApp, LinkedIn
                or X. Falls back to the main image.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
