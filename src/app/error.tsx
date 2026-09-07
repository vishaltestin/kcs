"use client";

import { useEffect } from "react";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

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
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <AlertTriangle className="h-16 w-16 text-amber-500 mb-6" aria-hidden />
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        An unexpected error occurred. Please try again — if the problem persists, our team has been
        notified.
      </p>
      <Button onClick={reset}>
        <RotateCcw className="mr-2 h-4 w-4" aria-hidden /> Try again
      </Button>
    </div>
  );
}
