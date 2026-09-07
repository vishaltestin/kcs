"use server";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/session";
import { limitKey, rateLimit } from "@/lib/rate-limit";

import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/validations/auth";
import { SITE } from "@/lib/constants";
import type { ActionResult } from "@/types";
import { str } from "@/lib/form";

/**
 * Authentication server actions.
 */

/**
 * Pre-flight check before the client calls Auth.js `signIn("credentials")`.
 *
 * The actual password verification happens inside the Auth.js credentials
 * `authorize()` (see src/lib/auth/auth.ts) — this action never receives or
 * checks the password. Its jobs: rate limiting, schema validation, and
 * gating unverified accounts with a specific message (authorize() only
 * returns a generic failure).
 *
 * Returns `{ ok: true }` when the client should proceed to signIn — which
 * includes the "user not found" case so that a direct probe cannot
 * distinguish a missing account from a wrong password.
 */
export async function preLoginCheckAction(
  email: string,
  password: string
): Promise<ActionResult> {
  const allowed = rateLimit(await limitKey("login"), 10, 60_000);
  if (!allowed) {
    return { ok: false, message: "Too many attempts. Please try again in a minute." };
  }

  const parsed = loginSchema.safeParse({ email, password } satisfies LoginInput);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) {
    return { ok: true, message: "" };
  }

  if (!user.emailVerifiedAt) {
    return {
      ok: false,
      message: "Please verify your email address before signing in. Check your inbox for the verification link.",
    };
  }

  return { ok: true, message: "" };
}

export async function signupAction(
  _prev: ActionResult<{ verifyUrl: string | null }> | null,
  formData: FormData
): Promise<ActionResult<{ verifyUrl: string | null }>> {
  const allowed = rateLimit(await limitKey("signup"), 5, 60_000);
  if (!allowed) {
    return { ok: false, message: "Too many attempts. Please try again in a minute." };
  }

  const parsed = signupSchema.safeParse({
    firstName: str(formData.get("firstName")),
    lastName: str(formData.get("lastName")),
    mobile: str(formData.get("mobile")),
    email: str(formData.get("email")),
    password: str(formData.get("password")),
    passwordConfirmation: str(formData.get("passwordConfirmation")),
  } satisfies SignupInput);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      message: "An account with this email already exists. Try signing in instead.",
      fieldErrors: { email: ["Email already registered."] },
    };
  }

  const verificationToken = generateToken();
  await db.user.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email,
      phone: parsed.data.mobile,
      passwordHash: await hashPassword(parsed.data.password),
      verificationToken,
    },
  });

  // In production wire this to a transactional email provider. In development
  // the verification URL is returned so the flow can be completed end-to-end.
  const verifyUrl = `${SITE.url}/verify/${verificationToken}`;

  return {
    ok: true,
    message: "Account created! Verify your email address to sign in.",
    data: {
      verifyUrl: process.env.NODE_ENV === "production" ? null : verifyUrl,
    },
  };
}

export async function verifyEmailToken(token: string): Promise<{ success: boolean; message: string }> {
  if (!token || token.length < 32) {
    return { success: false, message: "This verification link is invalid." };
  }

  const user = await db.user.findUnique({ where: { verificationToken: token } });
  if (!user) {
    return { success: false, message: "This verification link has already been used or is invalid." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date(), verificationToken: null },
  });

  return { success: true, message: "Your email has been verified. You can sign in now." };
}
