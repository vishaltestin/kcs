"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BookMeetingDialog } from "./book-meeting-dialog";
import { cn } from "@/lib/utils";

/**
 * Self-contained "Book a Meeting" trigger — drop it anywhere (CTA blocks,
 * contact page) without wiring dialog state through the parent.
 */
export function BookMeetingButton({
  className,
  variant = "default",
  size = "default",
  label = "Book a meeting",
}: {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant={variant} size={size} className={cn(className)} onClick={() => setOpen(true)}>
        <CalendarDays aria-hidden /> {label}
      </Button>
      <BookMeetingDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
