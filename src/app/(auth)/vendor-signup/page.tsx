import type { Metadata } from "next";
import Link from "next/link";

import { VendorSignupForm } from "@/components/auth/vendor-signup-form";

export const metadata: Metadata = {
  title: "Vendor Registration",
  description: "Register as a vendor on KCS G-Mart to sell corporate gifts.",
};

export default function VendorSignupPage() {
  return (
    <div>
      <p className="eyebrow text-primary">Become a seller</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">Vendor Registration</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Register your business to start selling on KCS G-Mart. After signup, you can complete your
        profile with GST details, address, and more.
      </p>

      <VendorSignupForm />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have a vendor account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
