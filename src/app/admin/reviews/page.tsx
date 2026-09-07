import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/ui";
import { ReviewsTable, type AdminReviewRow } from "@/components/admin/reviews/reviews-table";
import { getAdminReviews } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  const rows: AdminReviewRow[] = reviews.map((review) => ({
    id: review.id,
    product: review.product,
    authorName: review.authorName,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    isApproved: review.isApproved,
    createdAt: review.createdAt,
  }));

  const pending = rows.filter((r) => !r.isApproved).length;

  return (
    <div>
      <PageHeader
        title="Reviews"
        description={`${rows.length} review${rows.length === 1 ? "" : "s"} · ${pending} pending moderation`}
      />
      <ReviewsTable reviews={rows} />
    </div>
  );
}
