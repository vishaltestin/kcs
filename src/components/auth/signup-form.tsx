"use client";

import { useActionState, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, Phone, User } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signupAction } from "@/actions/auth";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import type { ActionResult } from "@/types";

type SignupResult = ActionResult<{ verifyUrl: string | null }>;

export function SignupForm() {
  const [state, formAction, isPending] = useActionState<SignupResult | null, FormData>(
    signupAction,
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Account created!");
      if (state.data?.verifyUrl) setVerifyUrl(state.data.verifyUrl);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const onSubmit = (values: SignupInput) => {
    const formData = new FormData();
    formData.set("firstName", values.firstName);
    formData.set("lastName", values.lastName);
    formData.set("mobile", values.mobile);
    formData.set("email", values.email);
    formData.set("password", values.password);
    formData.set("passwordConfirmation", values.passwordConfirmation);
    formAction(formData);
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-xl">Sign up</CardTitle>
        <CardDescription>It takes less than a minute</CardDescription>
      </CardHeader>

      <CardContent className="px-0">
        {state && !state.ok && (
          <Alert variant="destructive" className="mb-4">
            {state.message}
          </Alert>
        )}

        {verifyUrl && (
          <Alert className="mb-4 border-green-600 text-green-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            <AlertDescription className="text-green-700">
              Account created! In production a verification email would be sent. In development you
              can verify directly:{" "}
              <a href={verifyUrl} className="font-semibold underline">
                Verify my email
              </a>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
                        <Input placeholder="Priya" className="pl-9" autoComplete="given-name" {...field} />
                      </div>
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
                      <Input placeholder="Sharma" autoComplete="family-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
                      <Input type="tel" placeholder="9876543210" className="pl-9" autoComplete="tel" {...field} />
                    </div>
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
                        placeholder="Min. 8 characters"
                        className="pl-9 pr-10"
                        autoComplete="new-password"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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

            <FormField
              control={form.control}
              name="passwordConfirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Create Account
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
