"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { isRecordNotFound } from "@/lib/prisma-errors";
import { assertVendor } from "@/lib/auth/guards";
import { vendorProfileSchema } from "@/lib/validations/admin";
import type { ActionResult } from "@/types";
import { str } from "@/lib/form";

/**
 * Vendor portal — self-service profile updates. Legal/compliance fields
 * (GSTIN, PAN, legal name, state code) stay admin-managed.
 */
export async function vendorUpdateProfileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { vendor } = await assertVendor();

  const parsed = vendorProfileSchema.safeParse({
    name: str(formData.get("name")),
    phone: str(formData.get("phone")),
    address: str(formData.get("address")),
    city: str(formData.get("city")),
    state: str(formData.get("state")),
    pincode: str(formData.get("pincode")),
    logo: str(formData.get("logo")),
    description: str(formData.get("description")),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const d = parsed.data;
  try {
    await db.vendor.update({
      where: { id: vendor.id },
      data: {
        name: d.name,
        phone: d.phone || null,
        address: d.address || null,
        city: d.city || null,
        state: d.state || null,
        pincode: d.pincode || null,
        logo: d.logo || null,
        description: d.description || null,
      },
    });
  } catch (error) {
    if (isRecordNotFound(error)) return { ok: false, message: "Vendor account not found." };
    throw error;
  }

  revalidatePath("/vendor");
  revalidatePath("/vendor/settings");
  revalidatePath(`/sellers/${vendor.slug}`);
  revalidatePath("/admin/vendors");
  return { ok: true, message: "Profile updated." };
}
