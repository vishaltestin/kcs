"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { vendorSignupAction } from "@/actions/auth";
import { vendorSignupSchema, type VendorSignupInput } from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import { PhoneOtpCard } from "@/components/auth/phone-otp-card";
import type { ActionResult } from "@/types";

type SignupResult = ActionResult<{
  otpRequired: boolean;
  email: string;
  maskedPhone: string;
  devOtp?: string;
}>;

const STRENGTH = [
  { label: "Too weak", bar: "bg-red-400", text: "text-red-500" },
  { label: "Weak", bar: "bg-orange-400", text: "text-orange-500" },
  { label: "Okay", bar: "bg-amber-400", text: "text-amber-500" },
  { label: "Good", bar: "bg-teal-400", text: "text-teal-600" },
  { label: "Strong", bar: "bg-emerald-400", text: "text-emerald-600" },
] as const;

function evaluatePassword(pw: string) {
  const checks = {
    length: pw.length >= 8,
    letter: /[A-Za-z]/.test(pw),
    digit: /\d/.test(pw),
    bonus: pw.length >= 12 || /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { checks, score };
}

export function VendorSignupForm() {
  const [state, formAction, isPending] = useActionState<SignupResult | null, FormData>(
    vendorSignupAction,
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [otpState, setOtpState] = useState<{
    email: string;
    maskedPhone: string;
    devOtp?: string;
  } | null>(null);
  const [verified, setVerified] = useState(false);

  const form = useForm<VendorSignupInput>({
    resolver: zodResolver(vendorSignupSchema),
    defaultValues: {
      vendorName: "",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const password = form.watch("password");
  const { checks, score } = useMemo(() => evaluatePassword(password), [password]);
  const strength = STRENGTH[score];

  useEffect(() => {
    if (!state) return;
    const id = window.setTimeout(() => {
      if (state.ok) {
        toast.success(state.message ?? "Verification code sent!");
        if (state.data?.otpRequired) {
          setOtpState({
            email: state.data.email,
            maskedPhone: state.data.maskedPhone,
            devOtp: state.data.devOtp,
          });
        }
      } else {
        toast.error(state.message);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [state]);

  const onSubmit = (values: VendorSignupInput) => {
    const formData = new FormData();
    formData.set("vendorName", values.vendorName);
    formData.set("firstName", values.firstName);
    formData.set("lastName", values.lastName);
    formData.set("phone", values.phone);
    formData.set("email", values.email);
    formData.set("password", values.password);
    formData.set("passwordConfirmation", values.passwordConfirmation);
    startTransition(() => {
      formAction(formData);
    });
  };

  // Show success state after verification
  if (verified) {
    return (
      <Card className="gap-0 rounded-3xl border-none py-0 shadow-[0_28px_56px_-32px_rgb(0_0_0/0.35)] ring-1 ring-foreground/[0.07]">
        <CardContent className="px-6 py-7 md:px-8">
          <Alert className="border-success/40 bg-success/[0.06] text-success">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            <AlertDescription className="text-success">
              Mobile number verified — your vendor account is ready!{" "}
              <Link href="/login" className="font-semibold underline">
                Sign in now
              </Link>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show OTP verification card
  if (otpState) {
    return (
      <Card className="gap-0 rounded-3xl border-none py-0 shadow-[0_28px_56px_-32px_rgb(0_0_0/0.35)] ring-1 ring-foreground/[0.07]">
        <CardContent className="px-6 py-7 md:px-8">
          <PhoneOtpCard
            email={otpState.email}
            maskedPhone={otpState.maskedPhone}
            initialDevOtp={otpState.devOtp}
            onVerified={() => setVerified(true)}
            onBack={() => setOtpState(null)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0 rounded-3xl border-none py-0 shadow-[0_28px_56px_-32px_rgb(0_0_0/0.35)] ring-1 ring-foreground/[0.07]">
      <CardContent className="px-6 py-7 md:px-8">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
            {/* ── Business details ─────────────────────────────────── */}
            <fieldset className="space-y-4">
              <legend className="kicker text-primary">Business details</legend>

              <FormField
                control={form.control}
                name="vendorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business / Vendor name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Your company or brand name"
                        className="h-11 rounded-xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            {/* ── Your details ─────────────────────────────────────── */}
            <fieldset className="space-y-4">
              <legend className="kicker text-primary">Your details</legend>
              <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Priya"
                          className="h-11 rounded-xl"
                          autoComplete="given-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sharma"
                          className="h-11 rounded-xl"
                          autoComplete="family-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="98765 43210"
                        className="h-11 rounded-xl"
                        autoComplete="tel"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        className="h-11 rounded-xl"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            {/* ── Security ─────────────────────────────────────────── */}
            <fieldset className="space-y-4">
              <legend className="kicker text-primary">Secure your account</legend>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          className="h-11 rounded-xl pr-11"
                          autoComplete="new-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden />
                          )}
                        </button>
                      </div>
                    </FormControl>

                    {/* Strength meter */}
                    <div className="pt-1.5" aria-live="polite">
                      <div className="flex gap-1.5">
                        {[0, 1, 2, 3].map((i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-colors duration-300",
                              password && i < score ? strength.bar : "bg-foreground/10"
                            )}
                          />
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                        {(
                          [
                            ["length", "8+ characters"],
                            ["letter", "A letter"],
                            ["digit", "A number"],
                          ] as const
                        ).map(([key, label]) => (
                          <span
                            key={key}
                            className={cn(
                              "inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors",
                              checks[key] ? "text-emerald-600" : "text-muted-foreground"
                            )}
                          >
                            <span
                              className={cn(
                                "grid size-3.5 place-items-center rounded-full ring-1 transition-all",
                                checks[key]
                                  ? "bg-emerald-500 ring-emerald-500"
                                  : "ring-foreground/20"
                              )}
                            >
                              {checks[key] && (
                                <svg viewBox="0 0 8 8" className="size-2 text-white" fill="none" aria-hidden>
                                  <path d="M1.5 4.2 3.2 5.8 6.5 2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                            {label}
                          </span>
                        ))}
                        {password.length > 0 && (
                          <span className={cn("ml-auto text-[12px] font-semibold", strength.text)}>
                            {strength.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="passwordConfirmation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Re-enter your password"
                          className="h-11 rounded-xl pr-11"
                          autoComplete="new-password"
                          {...field}
                        />
                        {field.value.length > 0 && (
                          <span
                            className={cn(
                              "absolute right-3.5 top-1/2 -translate-y-1/2",
                              field.value === password ? "text-emerald-500" : "text-muted-foreground/60"
                            )}
                            aria-label={field.value === password ? "Passwords match" : "Passwords do not match yet"}
                          >
                            {field.value === password ? (
                              <CheckCircle2 className="h-4 w-4" aria-hidden />
                            ) : (
                              <span className="block h-4 w-4 rounded-full border-2 border-current opacity-40" aria-hidden />
                            )}
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>

            <div className="space-y-4 pt-1">
              <Button type="submit" size="xl" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden /> Creating vendor account…
                  </>
                ) : (
                  <>
                    Register as Vendor <ArrowRight aria-hidden />
                  </>
                )}
              </Button>
              <p className="text-center text-[12px] leading-relaxed text-muted-foreground">
                After registration you&apos;ll be able to fill in your complete business details
                (GST, address, logo, etc.) from the vendor dashboard.
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
