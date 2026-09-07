import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  size = "md",
  showValue = false,
  className,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}) {
  const rounded = Math.round(rating);
  const sizeClass = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-6 h-6" : "w-5 h-5";

  return (
    <span className={cn("flex items-center gap-1", className)} aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      <span className="flex" aria-hidden>
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              sizeClass,
              i < rounded ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
            )}
          />
        ))}
      </span>
      {showValue && <span className="text-sm text-muted-foreground">{rating.toFixed(1)}</span>}
    </span>
  );
}
