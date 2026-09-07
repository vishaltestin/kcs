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
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="text-muted-foreground mt-2 mb-8">
        Join KCS G-Mart to order corporate gifts, save gifting ideas and track enquiries.
      </p>

      <SignupForm />

      <p className="text-sm text-muted-foreground mt-8 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
