"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, MessageCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { verifyOtpAction, resendOtpAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const OTP_RESEND_COOLDOWN_SECONDS = 60;

/**
 * Step 2 of signup: enter the 6-digit WhatsApp code.
 * Shared between customer and vendor signup forms.
 */
export function PhoneOtpCard({
  email,
  maskedPhone,
  initialDevOtp,
  onVerified,
  onBack,
}: {
  email: string;
  maskedPhone: string;
  /** Only set when the server is in ALLOW_DEV_OTP mode. */
  initialDevOtp?: string;
  onVerified: () => void;
  onBack?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [devOtp, setDevOtp] = useState(initialDevOtp);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(OTP_RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function onVerify() {
    setError(null);
    startTransition(async () => {
      const res = await verifyOtpAction(email, code);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      onVerified();
    });
  }

  function onResend() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await resendOtpAction(email);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setNotice(res.message ?? "Code resent.");
      if (res.data?.devOtp) setDevOtp(res.data.devOtp);
      setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-2 text-center">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MessageCircle className="size-5" />
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          Verify your mobile
        </h2>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{maskedPhone}</span> on
          WhatsApp.
        </p>
      </div>

      {error && (
        <Alert variant={error.includes("already verified") ? "default" : "destructive"}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {notice && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="otp">Verification code</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className="text-center text-lg tracking-[0.5em]"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && code.length === 6) onVerify();
          }}
        />
        {devOtp && (
          <p className="rounded-md bg-amber-500/10 px-3 py-2 text-center text-xs font-medium text-amber-700 dark:text-amber-400">
            Dev mode — WhatsApp not configured. Your code is{" "}
            <span className="font-bold tracking-widest">{devOtp}</span>
          </p>
        )}
      </div>

      <Button
        className="w-full"
        disabled={isPending || code.length !== 6}
        onClick={onVerify}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify & continue
      </Button>

      <div className="flex items-center justify-between text-sm">
        {onBack ? (
          <button
            type="button"
            className="text-muted-foreground transition-colors hover:text-foreground"
            onClick={onBack}
          >
            ← Edit details
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="inline-flex items-center gap-1 font-medium text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
          disabled={cooldown > 0 || isPending}
          onClick={onResend}
        >
          <RefreshCw className="size-3.5" />
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}
