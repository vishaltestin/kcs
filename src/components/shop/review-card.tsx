import { Card, CardContent } from "@/components/ui/card";

import { StarRating } from "@/components/shared/star-rating";
import type { ReviewCard as ReviewCardType } from "@/types";

export function ReviewCard({ review }: { review: ReviewCardType }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
          <StarRating rating={review.rating} size="sm" />
          <span className="font-semibold">{review.authorName}</span>
          <span className="text-xs text-muted-foreground">{review.createdAt}</span>
        </div>
        {review.title && <p className="font-medium mb-1">{review.title}</p>}
        <p className="text-muted-foreground text-sm">{review.comment}</p>
      </CardContent>
    </Card>
  );
}
