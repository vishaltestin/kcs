"use server";

import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { accountKey, limitKey, rateLimit, rateLimitReset } from "@/lib/rate-limit";
import { normalizePhone, maskPhone } from "@/lib/phone";
import {
  generateOtpCode,
  hashOtpCode,
  getPendingRegistration,
  upsertPendingRegistration,
  refreshPendingCode,
  verifyPendingCode,
  resendCooldownSeconds,
} from "@/lib/otp";
import { sendOtpWhatsApp } from "@/lib/whatsapp";

import { loginSchema, signupSchema, vendorSignupSchema, type LoginInput, type SignupInput, type VendorSignupInput } from "@/lib/validations/auth";
import type { ActionResult } from "@/types";
import { str } from "@/lib/form";

/**
 * Authentication server actions.
 *
 * Signup flow (customer + vendor):
 *   1. User fills form → signupAction validates, generates OTP, sends via WhatsApp,
 *      stores everything in PendingRegistration (no User row yet)
 *   2. User enters OTP → verifyOtpAction confirms code, creates User (and Vendor
 *      for vendor signups), deletes PendingRegistration
 */

export type PreLoginResult =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
      /** Signup exists but the WhatsApp OTP was never completed. */
      needsPhoneVerification?: boolean;
    };

/**
 * Pre-flight check before the client calls Auth.js `signIn("credentials")`.
 *
 * Throttled twice: per IP (an office NAT sharing one address must not lock
 * everyone out of *different* accounts, hence the generous per-IP allowance)
 * and per account (so distributing an attack across IPs still can't grind a
 * single account's password indefinitely). A correct password clears the
 * account's bucket.
 *
 * Nothing here may reveal whether an email exists. Verification state is only
 * disclosed *after* the password has been verified, so an enumeration probe
 * gets the same generic answer as a wrong password.
 */
export async function preLoginCheckAction(
  email: string,
  password: string
): Promise<PreLoginResult> {
  const ipAllowed = rateLimit(await limitKey("login"), 30, 60_000);
  if (!ipAllowed) {
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

  const normalizedEmail = parsed.data.email.toLowerCase();
  const perAccount = accountKey("login", normalizedEmail);
  if (!rateLimit(perAccount, 10, 5 * 60_000)) {
    return {
      ok: false,
      message: "Too many sign-in attempts for this account. Please try again in a few minutes.",
    };
  }

  const user = await db.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    // An abandoned signup is only disclosed when there is no account yet AND
    // the address actually has a pending registration — checking the password
    // is impossible in that case (the account does not exist), so this is the
    // one hint we allow. It reveals nothing that a signup attempt wouldn't.
    const pending = await getPendingRegistration(normalizedEmail);
    if (pending) {
      return {
        ok: false,
        message:
          "Your mobile number hasn't been verified yet. Enter the 6-digit code we sent to your WhatsApp to finish creating your account.",
        needsPhoneVerification: true,
      };
    }
    return { ok: true, message: "" };
  }

  // From here the account exists. Verify the password before saying anything
  // about its state — an unverified-account hint without a correct password
  // is an enumeration oracle.
  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) return { ok: true, message: "" };

  rateLimitReset(perAccount);

  if (!user.emailVerifiedAt) {
    return {
      ok: false,
      message: "Please verify your email address before signing in. Check your inbox for the verification link.",
    };
  }

  return { ok: true, message: "" };
}

// ─── Customer Signup ────────────────────────────────────────────────────────

type SignupOtpResult = ActionResult<{
  otpRequired: boolean;
  email: string;
  maskedPhone: string;
  devOtp?: string;
}>;

export async function signupAction(
  _prev: SignupOtpResult | null,
  formData: FormData
): Promise<SignupOtpResult> {
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
  const phone = normalizePhone(parsed.data.mobile);
  if (!phone) {
    return {
      ok: false,
      message: "Enter a valid mobile number.",
      fieldErrors: { mobile: ["Enter a valid mobile number."] },
    };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      message: "An account with this email already exists. Try signing in instead.",
      fieldErrors: { email: ["Email already registered."] },
    };
  }

  // Check if a code was just sent — don't spam WhatsApp
  const existingPending = await getPendingRegistration(email);
  if (existingPending) {
    const cooldown = resendCooldownSeconds(existingPending.lastSentAt);
    if (cooldown > 0) {
      return {
        ok: true,
        message: "Verification code already sent.",
        data: {
          otpRequired: true,
          email,
          maskedPhone: maskPhone(existingPending.phone),
        },
      };
    }
  }

  // Generate OTP and send via WhatsApp
  const code = generateOtpCode();
  const sent = await sendOtpWhatsApp(phone, code);
  if (!sent.ok) {
    return { ok: false, message: sent.error };
  }

  const [passwordHash, codeHash] = await Promise.all([
    hashPassword(parsed.data.password),
    hashOtpCode(code),
  ]);

  await upsertPendingRegistration({
    email,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone,
    passwordHash,
    codeHash,
    role: "CUSTOMER",
  });

  return {
    ok: true,
    message: "Verification code sent to your WhatsApp.",
    data: {
      otpRequired: true,
      email,
      maskedPhone: maskPhone(phone),
      ...(sent.dev ? { devOtp: code } : {}),
    },
  };
}

// ─── Vendor Signup ──────────────────────────────────────────────────────────

export async function vendorSignupAction(
  _prev: SignupOtpResult | null,
  formData: FormData
): Promise<SignupOtpResult> {
  const allowed = rateLimit(await limitKey("vendor-signup"), 5, 60_000);
  if (!allowed) {
    return { ok: false, message: "Too many attempts. Please try again in a minute." };
  }

  const parsed = vendorSignupSchema.safeParse({
    vendorName: str(formData.get("vendorName")),
    firstName: str(formData.get("firstName")),
    lastName: str(formData.get("lastName")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    password: str(formData.get("password")),
    passwordConfirmation: str(formData.get("passwordConfirmation")),
  } satisfies VendorSignupInput);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) {
    return {
      ok: false,
      message: "Enter a valid mobile number.",
      fieldErrors: { phone: ["Enter a valid mobile number."] },
    };
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return {
      ok: false,
      message: "An account with this email already exists. Try signing in instead.",
      fieldErrors: { email: ["Email already registered."] },
    };
  }

  // Check if a code was just sent — don't spam WhatsApp
  const existingPending = await getPendingRegistration(email);
  if (existingPending) {
    const cooldown = resendCooldownSeconds(existingPending.lastSentAt);
    if (cooldown > 0) {
      return {
        ok: true,
        message: "Verification code already sent.",
        data: {
          otpRequired: true,
          email,
          maskedPhone: maskPhone(existingPending.phone),
        },
      };
    }
  }

  // Generate OTP and send via WhatsApp
  const code = generateOtpCode();
  const sent = await sendOtpWhatsApp(phone, code);
  if (!sent.ok) {
    return { ok: false, message: sent.error };
  }

  const [passwordHash, codeHash] = await Promise.all([
    hashPassword(parsed.data.password),
    hashOtpCode(code),
  ]);

  await upsertPendingRegistration({
    email,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone,
    passwordHash,
    plainPassword: parsed.data.password,
    codeHash,
    role: "VENDOR",
    vendorName: parsed.data.vendorName,
  });

  return {
    ok: true,
    message: "Verification code sent to your WhatsApp.",
    data: {
      otpRequired: true,
      email,
      maskedPhone: maskPhone(phone),
      ...(sent.dev ? { devOtp: code } : {}),
    },
  };
}

// ─── OTP Verification ───────────────────────────────────────────────────────

type VerifyOtpResult = ActionResult;

export async function verifyOtpAction(
  email: string,
  code: string
): Promise<VerifyOtpResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  if (!trimmedCode || trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
    return { ok: false, message: "Enter the 6-digit code." };
  }

  // Idempotent: if account already exists, just point to sign-in
  const existingUser = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existingUser) {
    return { ok: true, message: "Your account is already verified. You can sign in." };
  }

  const result = await verifyPendingCode(normalizedEmail, trimmedCode);
  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  const { pending } = result;

  if (pending.role === "VENDOR" && pending.vendorName) {
    // Create vendor + user in a transaction
    const baseSlug = pending.vendorName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 120);
    let slug = baseSlug;
    let counter = 1;
    while (await db.vendor.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    await db.$transaction(async (tx) => {
      const vendor = await tx.vendor.create({
        data: {
          name: pending.vendorName!,
          slug,
          email: pending.email,
          phone: pending.phone,
          status: "ACTIVE",
        },
      });

      await tx.user.create({
        data: {
          firstName: pending.firstName,
          lastName: pending.lastName,
          email: pending.email,
          phone: pending.phone,
          passwordHash: pending.passwordHash,
          plainPassword: pending.plainPassword,
          role: "VENDOR",
          emailVerifiedAt: new Date(),
          vendorId: vendor.id,
        },
      });

      await tx.pendingRegistration.delete({ where: { id: pending.id } });
    });
  } else {
    // Customer signup — just create the user
    await db.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          firstName: pending.firstName,
          lastName: pending.lastName,
          email: pending.email,
          phone: pending.phone,
          passwordHash: pending.passwordHash,
          emailVerifiedAt: new Date(),
        },
      });

      await tx.pendingRegistration.delete({ where: { id: pending.id } });
    });
  }

  return {
    ok: true,
    message: "Mobile number verified — your account is ready. You can sign in now.",
  };
}

// ─── Resend OTP ─────────────────────────────────────────────────────────────

type ResendOtpResult = ActionResult<{ devOtp?: string; maskedPhone: string }>;

export async function resendOtpAction(
  emailRaw: string
): Promise<ResendOtpResult> {
  const email = emailRaw.trim().toLowerCase();

  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    return { ok: false, message: "This account is already verified. You can sign in." };
  }

  const pending = await getPendingRegistration(email);
  if (!pending) {
    return {
      ok: false,
      message: "No pending signup found for this email. Please register first.",
    };
  }

  const cooldown = resendCooldownSeconds(pending.lastSentAt);
  if (cooldown > 0) {
    return {
      ok: false,
      message: `Please wait ${cooldown}s before requesting a new code.`,
    };
  }

  const code = generateOtpCode();
  const sent = await sendOtpWhatsApp(pending.phone, code);
  if (!sent.ok) {
    return { ok: false, message: sent.error };
  }

  await refreshPendingCode(pending.id, await hashOtpCode(code));

  return {
    ok: true,
    message: "A new code is on its way to your WhatsApp.",
    data: {
      maskedPhone: maskPhone(pending.phone),
      ...(sent.dev ? { devOtp: code } : {}),
    },
  };
}

