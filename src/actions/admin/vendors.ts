"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { isRecordNotFound } from "@/lib/prisma-errors";
import { assertAdmin } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import {
  vendorSchema,
  vendorUserSchema,
  type VendorInput,
  type VendorUserInput,
} from "@/lib/validations/admin";
import type { ActionResult } from "@/types";
import { str } from "@/lib/form";

/**
 * Admin — vendor onboarding and management.
 *
 * Vendors are created by the admin (no public self-signup in this phase):
 * the vendor record plus the seller's login account are provisioned together.
 */

function parseVendorForm(formData: FormData): VendorInput {
  return {
    name: str(formData.get("name")),
    slug: str(formData.get("slug")),
    legalName: str(formData.get("legalName")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    gstin: str(formData.get("gstin")),
    pan: str(formData.get("pan")),
    address: str(formData.get("address")),
    city: str(formData.get("city")),
    state: str(formData.get("state")),
    pincode: str(formData.get("pincode")),
    stateCode: str(formData.get("stateCode")),
    logo: str(formData.get("logo")),
    description: str(formData.get("description")),
    status: str(formData.get("status")) === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
    sortOrder: formData.get("sortOrder") ? Number(formData.get("sortOrder")) : 0,
  };
}

function parseVendorUserForm(formData: FormData): VendorUserInput {
  return {
    firstName: str(formData.get("firstName")),
    lastName: str(formData.get("lastName")),
    email: str(formData.get("loginEmail")),
    password: str(formData.get("loginPassword")),
  };
}

function revalidateVendors() {
  revalidatePath("/admin/vendors");
  revalidatePath("/sellers");
}

async function findVendorClash(
  data: { name: string; slug: string; email: string },
  exceptId?: string,
): Promise<string | null> {
  const clash = await db.vendor.findFirst({
    where: {
      id: exceptId ? { not: exceptId } : undefined,
      OR: [{ slug: data.slug }, { email: data.email }],
    },
    select: { name: true, slug: true },
  });
  if (!clash) return null;
  return clash.slug === data.slug
    ? "Another vendor already uses this storefront slug."
    : "Another vendor already uses this contact email.";
}

export async function createVendorAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const vendorParsed = vendorSchema.safeParse(parseVendorForm(formData));
  const userParsed = vendorUserSchema.safeParse(parseVendorUserForm(formData));
  if (!vendorParsed.success || !userParsed.success) {
    const fieldErrors = {
      ...vendorParsed.error?.flatten().fieldErrors,
      ...userParsed.error?.flatten().fieldErrors,
    };
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const vendorData = vendorParsed.data;
  const loginData = userParsed.data;

  const vendorClash = await findVendorClash(vendorData);
  if (vendorClash) return { ok: false, message: vendorClash };

  const emailTaken = await db.user.findUnique({
    where: { email: loginData.email.toLowerCase() },
    select: { id: true },
  });
  if (emailTaken) {
    return {
      ok: false,
      message: "A user account with this login email already exists.",
      fieldErrors: { loginEmail: ["This email is already registered."] },
    };
  }

  // Vendor + login provisioned together: the login is pre-verified so the
  // seller can sign in immediately with the credentials the admin hands them.
  await db.$transaction(async (tx) => {
    const vendor = await tx.vendor.create({
      data: {
        name: vendorData.name,
        slug: vendorData.slug,
        legalName: vendorData.legalName || null,
        email: vendorData.email,
        phone: vendorData.phone || null,
        gstin: vendorData.gstin || null,
        pan: vendorData.pan || null,
        address: vendorData.address || null,
        city: vendorData.city || null,
        state: vendorData.state || null,
        pincode: vendorData.pincode || null,
        stateCode: vendorData.stateCode,
        logo: vendorData.logo || null,
        description: vendorData.description || null,
        status: vendorData.status,
        sortOrder: vendorData.sortOrder,
      },
    });
    await tx.user.create({
      data: {
        firstName: loginData.firstName,
        lastName: loginData.lastName,
        email: loginData.email.toLowerCase(),
        passwordHash: await hashPassword(loginData.password),
        role: "VENDOR",
        emailVerifiedAt: new Date(),
        vendorId: vendor.id,
      },
    });
  });

  revalidateVendors();
  revalidatePath("/admin/users");
  return {
    ok: true,
    message: `Vendor "${vendorData.name}" created. Share the login credentials with them securely.`,
  };
}

export async function updateVendorAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing vendor id." };

  const parsed = vendorSchema.safeParse(parseVendorForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await db.vendor.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "Vendor not found." };

  const clash = await findVendorClash(parsed.data, id);
  if (clash) return { ok: false, message: clash };

  const d = parsed.data;
  try {
    await db.vendor.update({
      where: { id },
      data: {
        name: d.name,
        slug: d.slug,
        legalName: d.legalName || null,
        email: d.email,
        phone: d.phone || null,
        gstin: d.gstin || null,
        pan: d.pan || null,
        address: d.address || null,
        city: d.city || null,
        state: d.state || null,
        pincode: d.pincode || null,
        stateCode: d.stateCode,
        logo: d.logo || null,
        description: d.description || null,
        status: d.status,
        sortOrder: d.sortOrder,
      },
    });
  } catch (error) {
    if (isRecordNotFound(error)) return { ok: false, message: "Vendor not found — it may have been removed." };
    throw error;
  }

  revalidateVendors();
  revalidatePath(`/sellers/${existing.slug}`);
  revalidatePath("/vendor");
  revalidatePath("/product");
  revalidatePath("/");
  return { ok: true, message: "Vendor updated." };
}

export async function setVendorStatusAction(
  vendorId: string,
  status: string,
): Promise<ActionResult> {
  await assertAdmin();

  if (status !== "ACTIVE" && status !== "SUSPENDED") {
    return { ok: false, message: "Invalid status." };
  }

  const existing = await db.vendor.findUnique({ where: { id: vendorId } });
  if (!existing) return { ok: false, message: "Vendor not found." };
  if (existing.isDefault && status === "SUSPENDED") {
    return { ok: false, message: "The default vendor (the platform's own catalogue) can't be suspended." };
  }

  try {
    await db.vendor.update({ where: { id: vendorId }, data: { status } });
  } catch (error) {
    if (isRecordNotFound(error)) return { ok: false, message: "Vendor not found — it may have been removed." };
    throw error;
  }

  revalidateVendors();
  revalidatePath(`/sellers/${existing.slug}`);
  revalidatePath("/vendor");
  revalidatePath("/product");
  revalidatePath("/");
  return {
    ok: true,
    message: status === "ACTIVE" ? "Vendor activated." : "Vendor suspended — their products are hidden from the storefront.",
  };
}

/** Issue a fresh password for the vendor's linked login account. */
export async function resetVendorPasswordAction(
  vendorId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const password = str(formData.get("newPassword"));
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return {
      ok: false,
      message: "Password must be 8+ characters with at least one letter and one number.",
      fieldErrors: { newPassword: ["Password is too weak."] },
    };
  }

  const user = await db.user.findFirst({ where: { vendorId } });
  if (!user) return { ok: false, message: "No login account is linked to this vendor." };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password) },
  });

  revalidatePath("/admin/vendors");
  return { ok: true, message: `Password reset for ${user.email}.` };
}
