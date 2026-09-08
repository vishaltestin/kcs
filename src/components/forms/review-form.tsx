"use client";

import { startTransition, useActionState, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitReviewAction } from "@/actions/reviews";
import { reviewSchema, type ReviewInput } from "@/lib/validations/shop";
import type { ActionResult } from "@/types";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    (prev, formData) => submitReviewAction(prev, formData),
    null
  );

  const [rating, setRating] = useState(5);

  const form = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      productId,
      rating: 5,
      title: "",
      comment: "",
      authorName: "",
    },
  });

  useEffect(() => {
    if (!state) return;
    const id = window.setTimeout(() => {
      if (state.ok) {
        toast.success(state.message ?? "Review submitted!");
        form.reset({ productId, rating: 5, title: "", comment: "", authorName: "" });
        setRating(5);
      } else {
        toast.error(state.message);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [state, form, productId]);

  const onSubmit = (values: ReviewInput) => {
    const formData = new FormData();
    formData.set("productId", values.productId);
    formData.set("rating", String(rating));
    formData.set("title", values.title ?? "");
    formData.set("comment", values.comment);
    formData.set("authorName", values.authorName);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-5" aria-busy={isPending}>
        <input type="hidden" name="productId" value={productId} />

        <div className="space-y-2">
          <FormLabel>Your rating</FormLabel>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                onClick={() => {
                  setRating(value);
                  form.setValue("rating", value);
                }}
                className="group/star rounded-md p-1 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Star
                  className={cn(
                    "size-8 transition-colors",
                    value <= rating ? "fill-brand-amber text-brand-amber" : "text-muted-foreground/30 group-hover/star:text-brand-amber/60"
                  )}
                  aria-hidden
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-medium text-muted-foreground">
              {rating > 0 ? ["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating] : "Tap to rate"}
            </span>
          </div>
          {form.formState.errors.rating && (
            <p className="text-sm text-destructive">{form.formState.errors.rating.message}</p>
          )}
        </div>

        <FormField
          control={form.control}
          name="authorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Priya Sharma" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Sum up your experience" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your review</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="What did you like or dislike?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" disabled={isPending} className="min-w-44">
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden /> Submitting…
            </>
          ) : (
            "Submit Review"
          )}
        </Button>
      </form>
    </Form>
  );
}
