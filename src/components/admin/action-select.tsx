"use client";

import { useTransition } from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/types";

/**
 * Inline select that immediately persists a value via a server action.
 */
export function ActionSelect({
  value,
  options,
  on_change,
  ariaLabel,
}: {
  value: string;
  options: readonly string[];
  on_change: (value: string) => Promise<ActionResult>;
  ariaLabel: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value}
        disabled={isPending}
        onValueChange={(next) => {
          startTransition(async () => {
            const result = await on_change(next);
            if (result.ok) {
              toast.success(result.message ?? "Updated");
            } else {
              toast.error(result.message);
            }
          });
        }}
      >
        <SelectTrigger size="sm" className="w-[140px]" aria-label={ariaLabel}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />}
    </div>
  );
}
