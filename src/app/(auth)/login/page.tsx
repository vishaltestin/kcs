import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your KCS G-Mart account to manage orders, addresses and gifting ideas.",
};

export default function LoginPage() {
  return (
    <div>
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
    </div>
  );
}
