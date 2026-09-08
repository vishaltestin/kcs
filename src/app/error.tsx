"use client";

import { useEffect } from "react";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/shared/status-page";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      icon={AlertTriangle}
      tone="amber"
      eyebrow="Unexpected error"
      title="Something went wrong"
      description="An unexpected error occurred. Please try again — if the problem persists, our team has been notified."
      actions={
        <>
          <Button onClick={reset} size="lg">
            <RotateCcw aria-hidden /> Try again
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">Go Home</Link>
          </Button>
        </>
      }
    />
  );
}
