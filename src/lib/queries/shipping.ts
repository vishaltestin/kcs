import "server-only";

import { db } from "@/lib/db";
import { DEFAULT_SHIPPING_CONFIG, DEFAULT_ZONES, type ShippingConfig, type Zone } from "@/lib/shipping";

/**
 * DB-backed shipping configuration. Zones/rates are seeded on first use from
 * the defaults so a fresh install always has a working rate card.
 */

export async function getStoreSettings() {
  return db.storeSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

/**
 * Seeds the default rate card on first use.
 *
 * The count-then-create version raced: two concurrent first requests could
 * both see 0 zones and both insert. Each zone is now upserted on its unique
 * `code` inside a transaction, so concurrent callers converge on one row set
 * (an existing zone — including any admin edits — is left untouched).
 */
export async function ensureDefaultZones(): Promise<void> {
  await db.$transaction(async (tx) => {
    for (const [i, zone] of DEFAULT_ZONES.entries()) {
      const existing = await tx.shippingZone.findUnique({
        where: { code: zone.code },
        select: { id: true },
      });
      if (existing) continue;
      await tx.shippingZone.create({
        data: {
          code: zone.code,
          name: zone.name,
          states: zone.states,
          etaDays: zone.etaDays,
          sortOrder: i,
          rates: { create: zone.rates.map((r) => ({ uptoGrams: r.uptoGrams, price: r.price })) },
        },
      });
    }
    await tx.storeSetting.upsert({
      where: { id: 1 },
      update: { extraPer500g: Object.fromEntries(DEFAULT_ZONES.map((z) => [z.code, z.extraPer500g])) },
      create: { id: 1, extraPer500g: Object.fromEntries(DEFAULT_ZONES.map((z) => [z.code, z.extraPer500g])) },
    });
  });
}

export async function getShippingConfig(): Promise<ShippingConfig> {
  await ensureDefaultZones();
  const [settings, zones] = await Promise.all([
    getStoreSettings(),
    db.shippingZone.findMany({
      where: { isActive: true },
      include: { rates: { orderBy: { uptoGrams: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const extra = (settings.extraPer500g ?? {}) as Record<string, number>;
  const mapped: Zone[] = zones.map((z) => ({
    code: z.code,
    name: z.name,
    states: Array.isArray(z.states) ? (z.states as string[]) : [],
    etaDays: z.etaDays,
    rates: z.rates.map((r) => ({ uptoGrams: r.uptoGrams, price: Number(r.price) })),
    extraPer500g: Number(extra[z.code] ?? 0),
  }));
  return {
    zones: mapped.length > 0 ? mapped : DEFAULT_SHIPPING_CONFIG.zones,
    freeShippingThreshold: Number(settings.freeShippingThreshold),
    volumetricDivisor: settings.volumetricDivisor || 5000,
  };
}

/** Admin view: all zones incl. inactive, with ids for editing. */
export async function getAdminShippingZones() {
  await ensureDefaultZones();
  const [settings, zones] = await Promise.all([
    getStoreSettings(),
    db.shippingZone.findMany({ include: { rates: { orderBy: { uptoGrams: "asc" } } }, orderBy: { sortOrder: "asc" } }),
  ]);
  const extra = (settings.extraPer500g ?? {}) as Record<string, number>;
  return {
    settings: {
      freeShippingThreshold: Number(settings.freeShippingThreshold),
      volumetricDivisor: settings.volumetricDivisor,
      sellerName: settings.sellerName,
      sellerGstin: settings.sellerGstin ?? "",
      sellerPan: settings.sellerPan ?? "",
      sellerAddress: settings.sellerAddress ?? "",
      sellerStateCode: settings.sellerStateCode,
      sellerEmail: settings.sellerEmail ?? "",
      sellerPhone: settings.sellerPhone ?? "",
      invoicePrefix: settings.invoicePrefix,
    },
    zones: zones.map((z) => ({
      id: z.id,
      code: z.code,
      name: z.name,
      states: Array.isArray(z.states) ? (z.states as string[]) : [],
      etaDays: z.etaDays,
      isActive: z.isActive,
      extraPer500g: Number(extra[z.code] ?? 0),
      rates: z.rates.map((r) => ({ uptoGrams: r.uptoGrams, price: Number(r.price) })),
    })),
  };
}
