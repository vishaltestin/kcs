"use client";

import * as React from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import type { ActionResult } from "@/types";

/**
 * Dropdown item that opens an AlertDialog confirmation (small confirmations
 * stay in dialogs per the admin UX rules — only large tasks get pages).
 *
 * `onConfirm` receives the ids of the affected rows (single row from a row
 * menu, or many from a bulk action bar) and must call a server action
 * returning ActionResult.
 */
export function ConfirmMenuItem({
  label = "Delete",
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  destructive = true,
}: {
  label?: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<ActionResult>;
  destructive?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await onConfirm();
      if (result.ok) {
        toast.success(result.message ?? "Done");
        setOpen(false);
      } else {
        toast.error(result.message ?? "Something went wrong.");
      }
    });
  };

  return (
    <>
      <DropdownMenuItem
        variant={destructive ? "destructive" : "default"}
        onSelect={(event) => {
          // Keep the dropdown open state from dismissing the dialog focus —
          // prevent default and open the dialog instead.
          event.preventDefault();
          setOpen(true);
        }}
      >
        {label}
      </DropdownMenuItem>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>
              {description ?? "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault(); // keep the dialog open while pending
                handleConfirm();
              }}
              className={destructive ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
            >
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * Standalone button that opens an AlertDialog confirmation and runs a server
 * action (used in bulk-action bars and wherever a full-width confirm button
 * is needed).
 */
export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  variant = "outline",
  destructive = true,
}: {
  label: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<ActionResult>;
  variant?: "outline" | "destructive" | "secondary" | "default";
  destructive?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await onConfirm();
      if (result.ok) {
        toast.success(result.message ?? "Done");
        setOpen(false);
      } else {
        toast.error(result.message ?? "Something went wrong.");
      }
    });
  };

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        className={destructive ? "text-destructive hover:text-destructive" : undefined}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>
              {description ?? "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                handleConfirm();
              }}
              className={destructive ? "bg-destructive text-white hover:bg-destructive/90" : undefined}
            >
              {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
