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
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="text-muted-foreground mt-2 mb-8">
        Sign in to manage your orders, addresses and gifting ideas.
      </p>

      <Suspense>
        <LoginForm />
      </Suspense>

      <p className="text-sm text-muted-foreground mt-8 text-center">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
