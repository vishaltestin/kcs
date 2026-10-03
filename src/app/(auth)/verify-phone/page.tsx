import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { maskPhone } from "@/lib/phone";
import { PhoneOtpClient } from "@/components/auth/phone-otp-client";

export const metadata: Metadata = {
  title: "Verify your mobile",
  description: "Enter the 6-digit WhatsApp code we sent to finish creating your account.",
  robots: { index: false, follow: false },
};

/**
 * Standalone phone-verification page. Users land here from the sign-in
 * error path ("verify your mobile first") when they registered but never
 * completed the WhatsApp OTP step — i.e. their signup is still a
 * PendingRegistration row, not an account.
 */
export default async function VerifyPhonePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email: rawEmail } = await searchParams;
  const email = rawEmail?.trim().toLowerCase();
  if (!email) redirect("/login");

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (user) {
    // Account exists — it was born verified (the OTP gate is pre-creation).
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Already verified</h1>
        <p className="text-sm text-muted-foreground">
          This account is already verified — you can sign in.
        </p>
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  const pending = await db.pendingRegistration.findUnique({
    where: { email },
    select: { phone: true },
  });
  if (!pending) redirect("/signup");

  return (
    <div>
      <p className="eyebrow text-primary">One last step</p>
      <h1 className="mt-2 mb-8 text-3xl font-extrabold tracking-tight md:text-4xl">
        Verify your mobile number
      </h1>
      <PhoneOtpClient email={email} maskedPhone={maskPhone(pending.phone)} />
    </div>
  );
}
