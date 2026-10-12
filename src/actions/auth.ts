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
  getPhoneVerification,
  upsertPhoneVerification,
  verifyPhoneCode,
  getVerifiedPhone,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/otp";
import { sendOtpWhatsApp } from "@/lib/whatsapp";

import { loginSchema, signupSchema, vendorSignupSchema, type LoginInput, type SignupInput, type VendorSignupInput } from "@/lib/validations/auth";
import type { ActionResult } from "@/types";
import { str } from "@/lib/form";

/**
 * Authentication server actions.
 *
 * Signup flow (customer + vendor) — phone-first OTP:
 *   1. User enters mobile → requestPhoneOtpAction sends a WhatsApp code
 *      (state on PhoneVerification, keyed by phone — no account data yet)
 *   2. User enters code → verifyPhoneOtpAction marks the phone verified
 *   3. User fills the rest → signupAction/vendorSignupAction re-check the
 *      verification server-side and create the account immediately
 *
 * The legacy email-keyed flow (verifyOtpAction/resendOtpAction +
 * PendingRegistration) is kept for in-flight signups and /verify-phone.
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

// ─── Phone-first OTP (current signup flow) ──────────────────────────────────

type RequestPhoneOtpResult = ActionResult<{
  maskedPhone: string;
  cooldownSeconds: number;
  devOtp?: string;
}>;

/**
 * Step 1: send a WhatsApp code to a phone number. No account data is needed
 * (or stored) yet — this same action serves first-send and resend, with the
 * server enforcing the cooldown.
 */
export async function requestPhoneOtpAction(phoneRaw: string): Promise<RequestPhoneOtpResult> {
  const ipAllowed = rateLimit(await limitKey("otp-request"), 5, 60_000);
  if (!ipAllowed) {
    return { ok: false, message: "Too many attempts. Please try again in a minute." };
  }

  const phone = normalizePhone(phoneRaw);
  if (!phone) {
    return { ok: false, message: "Enter a valid 10-digit mobile number." };
  }

  // Per-number throttle so a single number can't be spammed with codes.
  if (!rateLimit(accountKey("phone-otp", phone), 3, 10 * 60_000)) {
    return { ok: false, message: "Too many codes sent to this number. Please try again later." };
  }

  const existingUser = await db.user.findFirst({ where: { phone }, select: { id: true } });
  if (existingUser) {
    return { ok: false, message: "This number is already registered. Try signing in instead." };
  }

  const existing = await getPhoneVerification(phone);
  if (existing) {
    const cooldown = resendCooldownSeconds(existing.lastSentAt);
    if (cooldown > 0) {
      return {
        ok: true,
        message: existing.verifiedAt ? "This number is already verified." : "Verification code already sent.",
        data: { maskedPhone: maskPhone(phone), cooldownSeconds: cooldown },
      };
    }
  }

  const code = generateOtpCode();
  const sent = await sendOtpWhatsApp(phone, code);
  if (!sent.ok) {
    return { ok: false, message: sent.error };
  }

  await upsertPhoneVerification(phone, await hashOtpCode(code));

  return {
    ok: true,
    message: "Code sent to your WhatsApp.",
    data: {
      maskedPhone: maskPhone(phone),
      cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
      ...(sent.dev ? { devOtp: code } : {}),
    },
  };
}

/**
 * Step 2: check the code. A correct code marks the phone verified for
 * VERIFIED_PHONE_TTL_MINUTES, during which signup must complete.
 */
export async function verifyPhoneOtpAction(phoneRaw: string, codeRaw: string): Promise<VerifyOtpResult> {
  const ipAllowed = rateLimit(await limitKey("otp-verify"), 30, 60_000);
  if (!ipAllowed) {
    return { ok: false, message: "Too many attempts. Please try again in a minute." };
  }

  const phone = normalizePhone(phoneRaw);
  const code = codeRaw.trim();
  if (!phone) {
    return { ok: false, message: "Enter a valid 10-digit mobile number." };
  }
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, message: "Enter the 6-digit code." };
  }

  const existingUser = await db.user.findFirst({ where: { phone }, select: { id: true } });
  if (existingUser) {
    return { ok: false, message: "This number is already registered. Try signing in instead." };
  }

  const result = await verifyPhoneCode(phone, code);
  if (!result.ok) {
    return { ok: false, message: result.error };
  }
  return { ok: true, message: "Number verified!" };
}

// ─── Customer Signup ────────────────────────────────────────────────────────

export type SignupResult = ActionResult<{ email: string }>;

/**
 * Creates the account immediately — the phone MUST already be verified via
 * the OTP step. The verification row is re-checked here and consumed in the
 * same transaction; the client's "verified" flag is never trusted.
 */
export async function signupAction(
  _prev: SignupResult | null,
  formData: FormData
): Promise<SignupResult> {
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

  const verified = await getVerifiedPhone(phone);
  if (!verified) {
    return {
      ok: false,
      message: "Please verify your mobile number with the OTP first.",
      fieldErrors: { mobile: ["Verify this number with the OTP first."] },
    };
  }

  const [emailTaken, phoneTaken] = await Promise.all([
    db.user.findUnique({ where: { email }, select: { id: true } }),
    db.user.findFirst({ where: { phone }, select: { id: true } }),
  ]);
  if (emailTaken) {
    return {
      ok: false,
      message: "An account with this email already exists. Try signing in instead.",
      fieldErrors: { email: ["Email already registered."] },
    };
  }
  if (phoneTaken) {
    return {
      ok: false,
      message: "This number is already registered. Try signing in instead.",
      fieldErrors: { mobile: ["This number is already registered."] },
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await db.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email,
        phone,
        passwordHash,
        // The phone OTP was verified moments ago — the account is verified.
        emailVerifiedAt: new Date(),
      },
    });
    // Single-use verification, plus hygiene for legacy email-keyed rows.
    await tx.phoneVerification.deleteMany({ where: { phone } });
    await tx.pendingRegistration.deleteMany({ where: { email } });
  });

  return {
    ok: true,
    message: "Your account is ready — signing you in!",
    data: { email },
  };
}

// ─── Vendor Signup ──────────────────────────────────────────────────────────

export async function vendorSignupAction(
  _prev: SignupResult | null,
  formData: FormData
): Promise<SignupResult> {
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

  const verified = await getVerifiedPhone(phone);
  if (!verified) {
    return {
      ok: false,
      message: "Please verify your mobile number with the OTP first.",
      fieldErrors: { phone: ["Verify this number with the OTP first."] },
    };
  }

  const [emailTaken, phoneTaken] = await Promise.all([
    db.user.findUnique({ where: { email }, select: { id: true } }),
    db.user.findFirst({ where: { phone }, select: { id: true } }),
  ]);
  if (emailTaken) {
    return {
      ok: false,
      message: "An account with this email already exists. Try signing in instead.",
      fieldErrors: { email: ["Email already registered."] },
    };
  }
  if (phoneTaken) {
    return {
      ok: false,
      message: "This number is already registered. Try signing in instead.",
      fieldErrors: { phone: ["This number is already registered."] },
    };
  }

  const baseSlug = parsed.data.vendorName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
  let slug = baseSlug || `vendor-${Date.now().toString(36)}`;
  let counter = 1;
  while (await db.vendor.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await db.$transaction(async (tx) => {
    const vendor = await tx.vendor.create({
      data: {
        name: parsed.data.vendorName,
        slug,
        email,
        phone,
        status: "ACTIVE",
      },
    });

    await tx.user.create({
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email,
        phone,
        passwordHash,
        plainPassword: parsed.data.password,
        role: "VENDOR",
        emailVerifiedAt: new Date(),
        vendorId: vendor.id,
      },
    });

    await tx.phoneVerification.deleteMany({ where: { phone } });
    await tx.pendingRegistration.deleteMany({ where: { email } });
  });

  return {
    ok: true,
    message: "Your vendor account is ready — signing you in!",
    data: { email },
  };
}

// ─── OTP Verification ───────────────────────────────────────────────────────

type VerifyOtpResult = ActionResult;

/**
 * LEGACY email-keyed verification (PendingRegistration) — kept for signups
 * started before the phone-first flow, completed via /verify-phone.
 */
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

