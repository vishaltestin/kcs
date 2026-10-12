"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Pencil, RefreshCw, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requestPhoneOtpAction, verifyPhoneOtpAction } from "@/actions/auth";

const RESEND_SECONDS = 60;

function maskRawPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 5 ? `••••• ${digits.slice(-5)}` : phone;
}

/**
 * Inline phone verification for phone-first signup (shared by customer +
 * vendor forms). Lives inside the parent <form>: phone + Send OTP, then the
 * code box, then a locked verified chip. Fires `onVerified` with the typed
 * phone on success (null when the user changes it); the server normalizes
 * it again at signup, so the format here only needs to be human-friendly.
 */
export function PhoneVerifySection({ onVerified }: { onVerified: (phone: string | null) => void }) {
  const [isPending, startTransition] = useTransition();
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [code, setCode] = useState("");
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function onSend() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await requestPhoneOtpAction(phone);
      if (!res.ok || !res.data) {
        setError(res.message ?? "Could not send the code. Please try again.");
        return;
      }
      setSent(true);
      setMaskedPhone(res.data.maskedPhone);
      setCooldown(res.data.cooldownSeconds);
      if (res.data.devOtp) setDevOtp(res.data.devOtp);
      setNotice(res.message ?? "Code sent.");
    });
  }

  function onVerify() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await verifyPhoneOtpAction(phone, code);
      if (!res.ok) {
        setError(res.message ?? "Verification failed. Please try again.");
        return;
      }
      setVerified(true);
      onVerified(phone);
    });
  }

  function onChange() {
    setVerified(false);
    setSent(false);
    setCode("");
    setError(null);
    setNotice(null);
    setDevOtp(undefined);
    onVerified(null);
  }

  if (verified) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-500/[0.07] px-4 py-3 ring-1 ring-emerald-500/25">
        <p className="flex min-w-0 items-center gap-2 text-sm">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
          <span className="truncate">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {maskRawPhone(phone)}
            </span>{" "}
            <span className="text-muted-foreground">verified</span>
          </span>
        </p>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          onClick={onChange}
        >
          <Pencil className="size-3.5" aria-hidden /> Change
        </button>
      </div>
    );
  }

  return (
    <fieldset className="space-y-4">
      <legend className="kicker text-primary">Verify your mobile</legend>

      <div className="space-y-2">
        <Label htmlFor="signup-phone">Mobile number</Label>
        <div className="flex flex-col gap-2 min-[420px]:flex-row">
          <Input
            id="signup-phone"
            type="tel"
            placeholder="98765 43210"
            className="h-11 rounded-xl"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            disabled={sent}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !sent && phone.trim()) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <Button
            type="button"
            variant={sent ? "outline" : "default"}
            className="h-11 shrink-0 rounded-xl px-5"
            disabled={isPending || !phone.trim()}
            onClick={onSend}
          >
            {isPending && !sent ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Send aria-hidden />
            )}
            {sent ? "Resend OTP" : "Send OTP"}
          </Button>
        </div>
        {!sent && (
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            We&apos;ll send a 6-digit code to this number on WhatsApp. Your account is created
            only after the number is verified.
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {notice && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {sent && (
        <div className="space-y-4 rounded-2xl bg-foreground/[0.03] p-4 ring-1 ring-foreground/[0.07]">
          <div className="space-y-2">
            <Label htmlFor="signup-otp">
              Enter the code sent to <span className="font-semibold text-foreground">{maskedPhone}</span>
            </Label>
            <Input
              id="signup-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              className="h-12 rounded-xl text-center text-lg tracking-[0.5em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.length === 6) {
                  e.preventDefault();
                  onVerify();
                }
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
            type="button"
            size="xl"
            className="w-full"
            disabled={isPending || code.length !== 6}
            onClick={onVerify}
          >
            {isPending && <Loader2 className="animate-spin" aria-hidden />}
            Verify & continue
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => {
                setSent(false);
                setCode("");
                setError(null);
                setNotice(null);
              }}
            >
              ← Wrong number?
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 font-medium text-primary disabled:cursor-not-allowed disabled:text-muted-foreground"
              disabled={cooldown > 0 || isPending}
              onClick={onSend}
            >
              <RefreshCw className="size-3.5" aria-hidden />
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}
    </fieldset>
  );
}
