"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PhoneOtpCard } from "@/components/auth/phone-otp-card";

/** Client wrapper for the /verify-phone page (uses the shared OTP card). */
export function PhoneOtpClient({
  email,
  maskedPhone,
}: {
  email: string;
  maskedPhone: string;
}) {
  const router = useRouter();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="space-y-6">
        <Alert className="border-success/40 bg-success/[0.06] text-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          <AlertDescription className="text-success">
            Mobile number verified — you can sign in now.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PhoneOtpCard
        email={email}
        maskedPhone={maskedPhone}
        onVerified={() => {
          setDone(true);
          setTimeout(() => router.push("/login"), 1400);
        }}
      />
      <p className="text-center text-sm text-muted-foreground">
        Wrong account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
