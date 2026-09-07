import Link from "next/link";
import { MoveRight } from "lucide-react";

export function SectionHeader({
  title,
  viewMoreHref,
  viewMoreLabel = "View More",
  center = false,
}: {
  title: string;
  viewMoreHref?: string;
  viewMoreLabel?: string;
  center?: boolean;
}) {
  if (center) {
    return (
      <h2 className="mb-8 text-center text-3xl font-bold tracking-tight md:mb-10 md:text-4xl">
        {title}
      </h2>
    );
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-4 md:mb-8">
      <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      {viewMoreHref && (
        <Link
          href={viewMoreHref}
          className="group/viewmore flex shrink-0 items-center gap-1 text-sm font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
        >
          {viewMoreLabel}{" "}
          <MoveRight
            className="ml-0.5 transition-transform duration-300 group-hover/viewmore:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}
    </div>
  );
}
