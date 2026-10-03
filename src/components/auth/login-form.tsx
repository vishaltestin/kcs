"use client";

import { useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { preLoginCheckAction } from "@/actions/auth";
import { safeNextPath } from "@/lib/urls";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const searchParams = useSearchParams();
  // Sanitised: `next=//evil.com` would otherwise be a protocol-relative hop
  // off-site via window.location.assign().
  const nextPath = safeNextPath(searchParams.get("next"));

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);
    setVerifyEmail(null);

    // 1. Pre-flight: rate limit, schema check, unverified-account gate.
    const check = await preLoginCheckAction(values.email, values.password);
    if (!check.ok) {
      setFormError(check.message);
      toast.error(check.message);
      if (!check.needsPhoneVerification) setVerifyEmail(null);
      else setVerifyEmail(values.email.trim().toLowerCase());
      if (check.fieldErrors) {
        for (const [key, messages] of Object.entries(check.fieldErrors)) {
          if (messages?.length) {
            form.setError(key as keyof LoginInput, { message: messages[0] });
          }
        }
      }
      return;
    }

    // 2. Credentials sign-in via the Auth.js HTTP handler (client helper).
    //    redirect:false lets us handle success/error without a full-page
    //    redirect to the error page.
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (!result || result.error) {
      const message = "Invalid email or password.";
      setFormError(message);
      toast.error(message);
      return;
    }

    // 3. Full-page navigation so server components re-render with the new
    //    session (navbar, wishlist, etc.). Vendors and admins without an
    //    explicit destination land in their own console instead of the shop.
    toast.success("Signed in!");
    let target = nextPath;
    if (target === "/") {
      try {
        const session = await getSession();
        const role = session?.user?.role;
        if (role === "VENDOR") target = "/vendor";
        else if (role === "ADMIN") target = "/admin";
      } catch {
        // Session lookup is best-effort — fall back to the home page.
      }
    }
    window.location.assign(target);
  };

  return (
    <Card className="gap-0 rounded-3xl border-none py-0 shadow-[0_28px_56px_-32px_rgb(0_0_0/0.35)] ring-1 ring-foreground/[0.07]">
      <CardContent className="px-6 py-7 md:px-8">
        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {formError}{" "}
              {verifyEmail && (
                <Link
                  href={`/verify-phone?email=${encodeURIComponent(verifyEmail)}`}
                  className="font-semibold underline"
                >
                  Verify now
                </Link>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@company.com" className="h-11 rounded-xl" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        placeholder="••••••••"
                        className="h-11 rounded-xl pr-11"
                        autoComplete="current-password"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="xl" className="mt-2 w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden /> Signing in…
                </>
              ) : (
                <>
                  Sign In <ArrowRight aria-hidden />
                </>
              )}
            </Button>
          </form>
        </Form>

      </CardContent>
    </Card>
  );
}
