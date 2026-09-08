import { BadgeCheck, Quote } from "lucide-react";

import { StarRating } from "@/components/shared/star-rating";
import { initials } from "@/lib/utils";
import type { ReviewCard as ReviewCardType } from "@/types";

export function ReviewCard({ review }: { review: ReviewCardType }) {
  return (
    <article className="relative flex h-full flex-col rounded-2xl bg-card p-5 ring-1 ring-foreground/[0.07] transition-shadow hover:shadow-[0_18px_40px_-24px_rgb(0_0_0/0.3)]">
      <Quote className="absolute top-4 right-4 size-6 text-primary/15" aria-hidden />
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-charcoal text-xs font-bold text-white">
          {initials(review.authorName)}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <span className="truncate">{review.authorName}</span>
            <BadgeCheck className="size-3.5 shrink-0 text-success" aria-label="Verified reviewer" />
          </p>
          <p className="text-xs text-muted-foreground">{review.createdAt}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <StarRating rating={review.rating} size="sm" />
        <span className="text-xs font-semibold text-muted-foreground">{review.rating}/5</span>
      </div>
      {review.title && <h3 className="mt-2 text-[15px] font-bold tracking-tight">{review.title}</h3>}
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
    </article>
  );
}
