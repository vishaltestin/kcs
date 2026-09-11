"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/guards";
import { isRecordNotFound } from "@/lib/prisma-errors";
import { shippingZoneSchema, storeSettingsSchema, type ShippingZoneInput } from "@/lib/validations/admin";
import type { ActionResult } from "@/types";

/**
 * Admin — store settings (seller / invoice identity + free-shipping rule) and
 * the zone-based shipping rate card.
 */

const REVALIDATE = ["/admin/shipping", "/cart", "/checkout"];

function revalidateAll() {
  for (const path of REVALIDATE) revalidatePath(path);
}

export async function updateStoreSettingsAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await assertAdmin();

  const raw = {
    sellerName: String(formData.get("sellerName") ?? ""),
    sellerGstin: String(formData.get("sellerGstin") ?? ""),
    sellerPan: String(formData.get("sellerPan") ?? ""),
    sellerAddress: String(formData.get("sellerAddress") ?? ""),
    sellerStateCode: String(formData.get("sellerStateCode") ?? ""),
    sellerEmail: String(formData.get("sellerEmail") ?? ""),
    sellerPhone: String(formData.get("sellerPhone") ?? ""),
    invoicePrefix: String(formData.get("invoicePrefix") ?? ""),
    freeShippingThreshold: Number(formData.get("freeShippingThreshold") ?? 0),
    volumetricDivisor: Number(formData.get("volumetricDivisor") ?? 5000),
  };

  const parsed = storeSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;
  const data = {
    sellerName: d.sellerName,
    sellerGstin: d.sellerGstin || null,
    sellerPan: d.sellerPan || null,
    sellerAddress: d.sellerAddress || null,
    sellerStateCode: d.sellerStateCode,
    sellerEmail: d.sellerEmail || null,
    sellerPhone: d.sellerPhone || null,
    invoicePrefix: d.invoicePrefix,
    freeShippingThreshold: d.freeShippingThreshold,
    volumetricDivisor: d.volumetricDivisor,
  };

  await db.storeSetting.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  revalidateAll();
  return { ok: true, message: "Store settings saved." };
}

/** Create or update a zone (rates are replaced wholesale). */
export async function saveShippingZoneAction(input: ShippingZoneInput): Promise<ActionResult<{ id: number }>> {
  await assertAdmin();

  const parsed = shippingZoneSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const z = parsed.data;

  const codeClash = await db.shippingZone.findFirst({
    where: { code: z.code, ...(z.id ? { id: { not: z.id } } : {}) },
    select: { id: true },
  });
  if (codeClash) return { ok: false, message: `Zone code ${z.code} is already in use.`, fieldErrors: { code: ["Already in use."] } };

  // A state can only belong to one active zone — later zones win silently
  // would be confusing, so reject overlaps up-front.
  if (z.states.length) {
    const others = await db.shippingZone.findMany({
      where: z.id ? { id: { not: z.id } } : {},
      select: { name: true, states: true },
    });
    const taken = new Map<string, string>();
    for (const o of others) {
      for (const s of Array.isArray(o.states) ? (o.states as string[]) : []) taken.set(s.toLowerCase(), o.name);
    }
    const overlap = z.states.find((s) => taken.has(s.toLowerCase()));
    if (overlap) {
      return {
        ok: false,
        message: `${overlap} is already covered by “${taken.get(overlap.toLowerCase())}”.`,
        fieldErrors: { states: [`${overlap} already belongs to another zone.`] },
      };
    }
  }

  const rates = [...z.rates].sort((a, b) => a.uptoGrams - b.uptoGrams);
  const base = { code: z.code, name: z.name, states: z.states, etaDays: z.etaDays, isActive: z.isActive };

  const zoneId = await db.$transaction(async (tx) => {
    let id = z.id;
    if (id) {
      const updated = await tx.shippingZone.updateMany({ where: { id }, data: base });
      if (updated.count === 0) id = null;
      else await tx.shippingRate.deleteMany({ where: { zoneId: id } });
    }
    if (!id) {
      const count = await tx.shippingZone.count();
      const created = await tx.shippingZone.create({ data: { ...base, sortOrder: count } });
      id = created.id;
    }
    await tx.shippingRate.createMany({ data: rates.map((r) => ({ zoneId: id as number, uptoGrams: r.uptoGrams, price: r.price })) });

    // Per-zone surcharge lives in StoreSetting.extraPer500g (JSON keyed by code).
    const settings = await tx.storeSetting.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
    const extra = { ...((settings.extraPer500g as Record<string, number> | null) ?? {}) };
    extra[z.code] = z.extraPer500g;
    await tx.storeSetting.update({ where: { id: 1 }, data: { extraPer500g: extra } });
    return id;
  });

  revalidateAll();
  return { ok: true, message: z.id ? "Zone updated." : "Zone created.", data: { id: zoneId } };
}

export async function deleteShippingZoneAction(id: number): Promise<ActionResult> {
  await assertAdmin();
  const count = await db.shippingZone.count();
  if (count <= 1) return { ok: false, message: "Keep at least one zone — edit it instead." };
  try {
    const zone = await db.shippingZone.delete({ where: { id } });
    const settings = await db.storeSetting.findUnique({ where: { id: 1 } });
    if (settings?.extraPer500g && typeof settings.extraPer500g === "object") {
      const extra = { ...(settings.extraPer500g as Record<string, number>) };
      delete extra[zone.code];
      await db.storeSetting.update({ where: { id: 1 }, data: { extraPer500g: extra } });
    }
  } catch (error) {
    if (isRecordNotFound(error)) return { ok: false, message: "Zone not found — it may have been removed." };
    throw error;
  }
  revalidateAll();
  return { ok: true, message: "Zone deleted." };
}

export async function toggleShippingZoneAction(id: number, isActive: boolean): Promise<ActionResult> {
  await assertAdmin();
  try {
    await db.shippingZone.update({ where: { id }, data: { isActive } });
  } catch (error) {
    if (isRecordNotFound(error)) return { ok: false, message: "Zone not found." };
    throw error;
  }
  revalidateAll();
  return { ok: true, message: isActive ? "Zone enabled." : "Zone disabled." };
}
