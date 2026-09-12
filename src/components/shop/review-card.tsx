import { BadgeCheck, Quote } from "lucide-react";

import { StarRating } from "@/components/shared/star-rating";
import { initials } from "@/lib/utils";
import type { ReviewCard as ReviewCardType } from "@/types";

export function ReviewCard({ review }: { review: ReviewCardType }) {
  return (
    <article className="grid gap-4 py-6 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-8">
      <div className="flex items-center gap-3 sm:block">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-ink text-xs font-bold text-white">
          {initials(review.authorName)}
        </span>
        <div className="min-w-0 sm:mt-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <span className="truncate">{review.authorName}</span>
            <BadgeCheck className="size-3.5 shrink-0 text-success" aria-label="Verified reviewer" />
          </p>
          <p className="text-xs text-muted-foreground">{review.createdAt}</p>
        </div>
      </div>
      <div className="relative">
        <Quote className="absolute -top-1 -left-7 hidden size-5 text-primary/25 lg:block" aria-hidden />
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size="sm" />
          <span className="numeral text-xs text-muted-foreground">{review.rating}/5</span>
        </div>
        {review.title && <h3 className="display mt-2 text-[1.2rem] leading-snug">{review.title}</h3>}
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-foreground/75">{review.comment}</p>
      </div>
    </article>
  );
}
