import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ClearStaleSession } from "@/components/auth/clear-stale-session";
import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth/auth";
import { getCurrentUser } from "@/lib/auth/guards";
import { safeNextPath } from "@/lib/urls";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your KCS G-Mart account to manage orders, addresses and gifting ideas.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = safeNextPath(next);

  // "Already signed in" is decided HERE, not in the middleware: this check
  // goes to the database, so a revoked cookie (see ClearStaleSession) can't
  // make the login page unreachable. See src/proxy.ts for the bug that caused.
  const [user, jwtSession] = await Promise.all([getCurrentUser(), auth()]);
  if (user) redirect(target);

  return (
    <div>
      <ClearStaleSession stale={Boolean(jwtSession?.user)} />
      <p className="eyebrow text-primary">Welcome back</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Sign in to your account</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Manage your orders, addresses and saved gifting ideas.
      </p>

      <Suspense>
        <LoginForm />
      </Suspense>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Create one
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Want to sell on KCS G-Mart?{" "}
        <Link href="/vendor-signup" className="font-semibold text-primary hover:underline">
          Register as a Vendor
        </Link>
      </p>
    </div>
  );
}
