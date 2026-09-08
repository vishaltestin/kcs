import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/actions/auth";

export const metadata: Metadata = {
  title: "Verify Email",
};

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await verifyEmailToken(token);

  return (
    <div className="rounded-3xl bg-card p-8 text-center ring-1 ring-foreground/[0.07] shadow-[0_28px_56px_-32px_rgb(0_0_0/0.35)] md:p-10">
      {result.success ? (
        <>
          <span className="relative mx-auto mb-6 grid size-24 place-items-center">
            <span aria-hidden className="animate-ring absolute inset-0 rounded-full border-2 border-success/40" />
            <span aria-hidden className="absolute inset-2 rounded-full bg-success/10" />
            <span className="relative grid size-16 place-items-center rounded-full bg-success text-white">
              <CheckCircle2 className="size-8" strokeWidth={2.25} aria-hidden />
            </span>
          </span>
          <p className="eyebrow text-success">All set</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">Email verified!</h1>
          <p className="mt-2 mb-7 text-muted-foreground">{result.message}</p>
          <Button asChild size="lg">
            <Link href="/login">
              Sign in now <ArrowRight aria-hidden />
            </Link>
          </Button>
        </>
      ) : (
        <>
          <span className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="size-8" aria-hidden />
          </span>
          <p className="eyebrow text-destructive">Something went wrong</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">Verification failed</h1>
          <p className="mt-2 mb-7 text-muted-foreground">{result.message}</p>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">Back to sign up</Link>
          </Button>
        </>
      )}
    </div>
  );
}
