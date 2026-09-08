import type { Metadata } from "next";
import Link from "next/link";

import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your KCS G-Mart account for corporate gifting.",
};

export default function SignupPage() {
  return (
    <div>
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
    </div>
  );
}
