import "server-only";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * Signup phone-OTP state, stored on `PendingRegistration`.
 *
 * The account does NOT exist until the OTP verifies — registration only
 * creates a PendingRegistration row holding everything needed to finish
 * signup. One row per email; a new request for the same email replaces
 * the previous state. Codes are 6 digits, bcrypt-hashed at rest, valid
 * for 10 minutes, and limited to 5 verify attempts before a fresh code
 * is required.
 */

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export function generateOtpCode(): string {
  const buf = crypto.getRandomValues(new Uint32Array(1));
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 6);
}

export async function getPendingRegistration(email: string) {
  return db.pendingRegistration.findUnique({ where: { email } });
}

/** Replace any previous pending signup for this email with fresh OTP state. */
export async function upsertPendingRegistration(params: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  passwordHash: string;
  plainPassword?: string;
  codeHash: string;
  role: "CUSTOMER" | "VENDOR";
  vendorName?: string;
}) {
  const { codeHash, email, firstName, lastName, phone, passwordHash, plainPassword, role, vendorName } = params;
  const fresh = {
    firstName,
    lastName,
    phone,
    passwordHash,
    plainPassword: plainPassword ?? null,
    codeHash,
    role,
    vendorName: vendorName ?? null,
    attempts: 0,
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    lastSentAt: new Date(),
  };
  await db.pendingRegistration.upsert({
    where: { email },
    create: { email, ...fresh },
    update: fresh,
  });
}

/** Store a freshly-sent replacement code on an existing pending signup. */
export async function refreshPendingCode(
  id: string,
  codeHash: string
): Promise<void> {
  await db.pendingRegistration.update({
    where: { id },
    data: {
      codeHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
      lastSentAt: new Date(),
    },
  });
}

export type VerifyPendingResult =
  | { ok: true; pending: NonNullable<Awaited<ReturnType<typeof getPendingRegistration>>> }
  | { ok: false; error: string; exhausted?: boolean };

/**
 * Checks the code against the pending signup's hash. On success the row is
 * intentionally left in place — the caller deletes it in the same
 * transaction that creates the user.
 */
export async function verifyPendingCode(
  email: string,
  code: string
): Promise<VerifyPendingResult> {
  const pending = await getPendingRegistration(email);
  if (!pending)
    return {
      ok: false,
      error: "No pending signup found for this email. Please register again.",
    };
  if (pending.expiresAt < new Date())
    return {
      ok: false,
      error: "That code has expired. Please request a new one.",
    };
  if (pending.attempts >= OTP_MAX_ATTEMPTS)
    return {
      ok: false,
      error: "Too many wrong attempts. Please request a new code.",
      exhausted: true,
    };

  const matches = await bcrypt.compare(code, pending.codeHash);
  if (!matches) {
    const remaining = OTP_MAX_ATTEMPTS - (pending.attempts + 1);
    await db.pendingRegistration.update({
      where: { id: pending.id },
      data: { attempts: { increment: 1 } },
    });
    return {
      ok: false,
      error:
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
          : "Too many wrong attempts. Please request a new code.",
      exhausted: remaining <= 0,
    };
  }

  return { ok: true, pending };
}

/** Seconds until a resend is allowed again (0 = allowed now). */
export function resendCooldownSeconds(lastSentAt: Date): number {
  const elapsed = (Date.now() - lastSentAt.getTime()) / 1000;
  return Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed));
}

// ─── Phone-first verification (current signup flow) ──────────────────────────
// The OTP is verified BEFORE any account data exists, so state is keyed by
// phone on `PhoneVerification`. A correct code stamps `verifiedAt`; signup
// requires a fresh stamp and deletes the row in the same transaction that
// creates the user (single-use).

/** How long a verified phone stays usable for completing signup. */
export const VERIFIED_PHONE_TTL_MINUTES = 30;

export async function getPhoneVerification(phone: string) {
  return db.phoneVerification.findUnique({ where: { phone } });
}

/** Replace any previous OTP state for this phone with a fresh code. */
export async function upsertPhoneVerification(phone: string, codeHash: string): Promise<void> {
  const fresh = {
    codeHash,
    attempts: 0,
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
    lastSentAt: new Date(),
    verifiedAt: null,
  };
  await db.phoneVerification.upsert({
    where: { phone },
    create: { phone, ...fresh },
    update: fresh,
  });
}

export type VerifyPhoneResult = { ok: true } | { ok: false; error: string; exhausted?: boolean };

/** Checks the code; on success stamps `verifiedAt` for signup to consume. */
export async function verifyPhoneCode(phone: string, code: string): Promise<VerifyPhoneResult> {
  const pending = await getPhoneVerification(phone);
  if (!pending) {
    return { ok: false, error: "No code was sent to this number yet. Tap Send OTP first." };
  }
  // NOTE: no early-return for verifiedAt — the code is always checked, so a
  // second person can't ride an existing verification with a random code.
  if (pending.expiresAt < new Date()) {
    return { ok: false, error: "That code has expired. Please request a new one." };
  }
  if (pending.attempts >= OTP_MAX_ATTEMPTS) {
    return {
      ok: false,
      error: "Too many wrong attempts. Please request a new code.",
      exhausted: true,
    };
  }

  const matches = await bcrypt.compare(code, pending.codeHash);
  if (!matches) {
    const remaining = OTP_MAX_ATTEMPTS - (pending.attempts + 1);
    await db.phoneVerification.update({
      where: { id: pending.id },
      data: { attempts: { increment: 1 } },
    });
    return {
      ok: false,
      error:
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
          : "Too many wrong attempts. Please request a new code.",
      exhausted: remaining <= 0,
    };
  }

  await db.phoneVerification.update({
    where: { id: pending.id },
    data: { verifiedAt: new Date() },
  });
  return { ok: true };
}

/** The verification row, only if verified recently enough to sign up with. */
export async function getVerifiedPhone(phone: string) {
  const row = await getPhoneVerification(phone);
  if (!row?.verifiedAt) return null;
  if (row.verifiedAt.getTime() < Date.now() - VERIFIED_PHONE_TTL_MINUTES * 60_000) return null;
  return row;
}
