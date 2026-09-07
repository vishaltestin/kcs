"use server";

import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getSessionUser } from "@/lib/auth/session";
import {
  changePasswordSchema,
  updateAddressSchema,
  updateCompanySchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateAddressInput,
  type UpdateCompanyInput,
  type UpdateProfileInput,
} from "@/lib/validations/auth";
import type { ActionResult } from "@/types";
import { str, strOpt } from "@/lib/form";

/**
 * Profile server actions — all require an authenticated session.
 */

async function requireUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id ?? null;
}

export async function updateProfileAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, message: "You must be signed in." };

  const parsed = updateProfileSchema.safeParse({
    firstName: str(formData.get("firstName")),
    lastName: str(formData.get("lastName")),
    phone: str(formData.get("phone")),
  } satisfies UpdateProfileInput);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.user.update({ where: { id: userId }, data: parsed.data });
  return { ok: true, message: "Profile updated successfully." };
}

export async function updateCompanyAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, message: "You must be signed in." };

  const parsed = updateCompanySchema.safeParse({
    companyName: str(formData.get("companyName")),
    gstNo: str(formData.get("gstNo")),
    panNo: str(formData.get("panNo")),
  } satisfies UpdateCompanyInput);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.user.update({ where: { id: userId }, data: parsed.data });
  return { ok: true, message: "Company details updated." };
}

export async function updateAddressAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, message: "You must be signed in." };

  const parsed = updateAddressSchema.safeParse({
    billingAddress: str(formData.get("billingAddress")),
    billingCity: str(formData.get("billingCity")),
    billingState: str(formData.get("billingState")),
    billingPincode: str(formData.get("billingPincode")),
    sameAsBilling: str(formData.get("sameAsBilling")) === "true",
    shippingAddress: str(formData.get("shippingAddress")),
    shippingCity: str(formData.get("shippingCity")),
    shippingState: str(formData.get("shippingState")),
    shippingPincode: str(formData.get("shippingPincode")),
  } satisfies UpdateAddressInput);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { sameAsBilling, ...fields } = parsed.data;

  await db.user.update({
    where: { id: userId },
    data: {
      billingAddress: fields.billingAddress,
      billingCity: fields.billingCity,
      billingState: fields.billingState,
      billingPincode: fields.billingPincode,
      ...(sameAsBilling
        ? {
            shippingAddress: fields.billingAddress,
            shippingCity: fields.billingCity,
            shippingState: fields.billingState,
            shippingPincode: fields.billingPincode,
          }
        : {
            shippingAddress: fields.shippingAddress || null,
            shippingCity: fields.shippingCity || null,
            shippingState: fields.shippingState || null,
            shippingPincode: fields.shippingPincode || null,
          }),
    },
  });

  return { ok: true, message: "Address updated successfully." };
}

export async function changePasswordAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "You must be signed in." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: str(formData.get("currentPassword")),
    newPassword: str(formData.get("newPassword")),
    confirmPassword: str(formData.get("confirmPassword")),
  } satisfies ChangePasswordInput);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { ok: false, message: "Account not found." };

  const valid = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
  if (!valid) {
    return {
      ok: false,
      message: "Current password is incorrect.",
      fieldErrors: { currentPassword: ["Incorrect password."] },
    };
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return { ok: true, message: "Password changed successfully." };
}
