"use client";

import { useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Alert } from "@/components/ui/alert";
import { preLoginCheckAction } from "@/actions/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { isSubmitting } = form.formState;

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);

    // 1. Pre-flight: rate limit, schema check, unverified-account gate.
    const check = await preLoginCheckAction(values.email, values.password);
    if (!check.ok) {
      setFormError(check.message);
      toast.error(check.message);
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
    //    session (navbar, wishlist, etc.).
    toast.success("Signed in!");
    window.location.href = nextPath;
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Use your registered email address</CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        {formError && (
          <Alert variant="destructive" className="mb-4">
            {formError}
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
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
                      <Input type="email" placeholder="you@company.com" className="pl-9" autoComplete="email" {...field} />
                    </div>
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
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-9 pr-10"
                        autoComplete="current-password"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Sign In
            </Button>
          </form>
        </Form>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
