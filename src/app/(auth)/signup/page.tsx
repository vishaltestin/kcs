import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ClearStaleSession } from "@/components/auth/clear-stale-session";
import { SignupForm } from "@/components/auth/signup-form";
import { auth } from "@/lib/auth/auth";
import { getCurrentUser } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your KCS G-Mart account for corporate gifting.",
};

export default async function SignupPage() {
  // Same database-verified check as the login page (src/proxy.ts explains why
  // the middleware must not decide this from the cookie alone).
  const [user, jwtSession] = await Promise.all([getCurrentUser(), auth()]);
  if (user) redirect("/");

  return (
    <div>
      <ClearStaleSession stale={Boolean(jwtSession?.user)} />
      <p className="eyebrow text-primary">Get started</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Create your account</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Order corporate gifts, save gifting ideas and track enquiries — all in one place.
      </p>

      <SignupForm />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
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
