/**
 * Zone + weight-slab shipping engine.
 *
 *  1. Every line contributes `qty × max(actual, volumetric)` grams, where
 *     volumetric = L × W × H (cm³) ÷ divisor (5000 by default) × 1000.
 *  2. The delivery state resolves to a zone (Delhi-NCR / North / West / South /
 *     East / North-East & remote). Unknown states fall back to "Rest of India".
 *  3. The smallest slab whose `uptoGrams` covers the chargeable weight applies;
 *     beyond the largest slab, `extraPer500g[zone]` is added per started 500 g.
 *  4. Orders at or above the free-shipping threshold ship free.
 *
 * Pure functions — the DB-backed loader lives in `@/lib/queries/shipping`.
 */

export type ShipmentLine = {
  quantity: number;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export type ZoneRate = { uptoGrams: number; price: number };

export type Zone = {
  code: string;
  name: string;
  states: string[];
  etaDays: string;
  rates: ZoneRate[];
  extraPer500g: number;
};

export type ShippingConfig = {
  zones: Zone[];
  freeShippingThreshold: number;
  volumetricDivisor: number;
};

export type ShippingQuote = {
  amount: number;
  zone: Zone | null;
  chargeableWeight: number;
  actualWeight: number;
  volumetricWeight: number;
  free: boolean;
  reason: "free-threshold" | "rate-card" | "no-weight" | "no-zone";
  method: string;
};

/** Fallback used when a product has no weight at all (e.g. legacy seed data). */
export const DEFAULT_ITEM_GRAMS = 500;

export const REST_OF_INDIA = "REST";

/** Default zones — seeded once; admin edits them afterwards. */
export const DEFAULT_ZONES: Zone[] = [
  {
    code: "NCR",
    name: "Delhi NCR",
    states: ["Delhi", "New Delhi"],
    etaDays: "1-2",
    rates: [
      { uptoGrams: 500, price: 49 },
      { uptoGrams: 1000, price: 69 },
      { uptoGrams: 2000, price: 99 },
      { uptoGrams: 5000, price: 179 },
      { uptoGrams: 10000, price: 299 },
    ],
    extraPer500g: 20,
  },
  {
    code: "NORTH",
    name: "North India",
    states: ["Haryana", "Punjab", "Uttar Pradesh", "Uttarakhand", "Himachal Pradesh", "Rajasthan", "Chandigarh", "Jammu & Kashmir", "Ladakh"],
    etaDays: "2-4",
    rates: [
      { uptoGrams: 500, price: 69 },
      { uptoGrams: 1000, price: 99 },
      { uptoGrams: 2000, price: 149 },
      { uptoGrams: 5000, price: 269 },
      { uptoGrams: 10000, price: 449 },
    ],
    extraPer500g: 30,
  },
  {
    code: "WEST",
    name: "West & Central",
    states: ["Maharashtra", "Gujarat", "Goa", "Madhya Pradesh", "Chhattisgarh", "Dadra & Nagar Haveli and Daman & Diu"],
    etaDays: "3-5",
    rates: [
      { uptoGrams: 500, price: 79 },
      { uptoGrams: 1000, price: 119 },
      { uptoGrams: 2000, price: 179 },
      { uptoGrams: 5000, price: 329 },
      { uptoGrams: 10000, price: 549 },
    ],
    extraPer500g: 35,
  },
  {
    code: "SOUTH",
    name: "South India",
    states: ["Karnataka", "Tamil Nadu", "Kerala", "Telangana", "Andhra Pradesh", "Puducherry", "Lakshadweep"],
    etaDays: "3-6",
    rates: [
      { uptoGrams: 500, price: 89 },
      { uptoGrams: 1000, price: 129 },
      { uptoGrams: 2000, price: 199 },
      { uptoGrams: 5000, price: 359 },
      { uptoGrams: 10000, price: 599 },
    ],
    extraPer500g: 40,
  },
  {
    code: "EAST",
    name: "East India",
    states: ["West Bengal", "Bihar", "Jharkhand", "Odisha"],
    etaDays: "3-6",
    rates: [
      { uptoGrams: 500, price: 89 },
      { uptoGrams: 1000, price: 129 },
      { uptoGrams: 2000, price: 199 },
      { uptoGrams: 5000, price: 359 },
      { uptoGrams: 10000, price: 599 },
    ],
    extraPer500g: 40,
  },
  {
    code: "NE",
    name: "North-East & Islands",
    states: ["Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Tripura", "Sikkim", "Andaman & Nicobar Islands"],
    etaDays: "5-8",
    rates: [
      { uptoGrams: 500, price: 129 },
      { uptoGrams: 1000, price: 189 },
      { uptoGrams: 2000, price: 289 },
      { uptoGrams: 5000, price: 549 },
      { uptoGrams: 10000, price: 949 },
    ],
    extraPer500g: 60,
  },
  {
    code: REST_OF_INDIA,
    name: "Rest of India",
    states: [],
    etaDays: "4-7",
    rates: [
      { uptoGrams: 500, price: 99 },
      { uptoGrams: 1000, price: 149 },
      { uptoGrams: 2000, price: 229 },
      { uptoGrams: 5000, price: 399 },
      { uptoGrams: 10000, price: 699 },
    ],
    extraPer500g: 45,
  },
];

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  zones: DEFAULT_ZONES,
  freeShippingThreshold: 1000,
  volumetricDivisor: 5000,
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveZone(state: string | null | undefined, zones: Zone[]): Zone | null {
  const key = state ? norm(state) : "";
  if (key) {
    for (const zone of zones) {
      if (zone.states.some((s) => norm(s) === key)) return zone;
    }
    for (const zone of zones) {
      if (zone.states.some((s) => key.includes(norm(s)) || norm(s).includes(key))) return zone;
    }
  }
  return zones.find((z) => z.code === REST_OF_INDIA) ?? zones[zones.length - 1] ?? null;
}

export function volumetricGrams(l: number, w: number, h: number, divisor: number): number {
  if (!(l > 0 && w > 0 && h > 0)) return 0;
  return Math.ceil(((l * w * h) / Math.max(1, divisor)) * 1000);
}

/** Chargeable weight of a single unit: the larger of actual and volumetric. */
export function unitChargeableGrams(line: Omit<ShipmentLine, "quantity">, divisor: number): number {
  const actual = Math.max(0, Math.round(line.weightGrams || 0));
  const vol = volumetricGrams(line.lengthCm, line.widthCm, line.heightCm, divisor);
  return Math.max(actual, vol);
}

export function rateForWeight(zone: Zone, grams: number): number {
  const rates = [...zone.rates].sort((a, b) => a.uptoGrams - b.uptoGrams);
  if (rates.length === 0) return 0;
  const slab = rates.find((r) => grams <= r.uptoGrams);
  if (slab) return Number(slab.price);
  const top = rates[rates.length - 1];
  const extraUnits = Math.ceil((grams - top.uptoGrams) / 500);
  return Number(top.price) + extraUnits * Number(zone.extraPer500g || 0);
}

export function quoteShipping(
  lines: ShipmentLine[],
  destinationState: string | null | undefined,
  subtotal: number,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG,
): ShippingQuote {
  const divisor = config.volumetricDivisor || 5000;
  let actual = 0;
  let volumetric = 0;
  let chargeable = 0;
  for (const line of lines) {
    const qty = Math.max(0, Math.floor(line.quantity));
    const grams = line.weightGrams > 0 ? line.weightGrams : DEFAULT_ITEM_GRAMS;
    const vol = volumetricGrams(line.lengthCm, line.widthCm, line.heightCm, divisor);
    actual += grams * qty;
    volumetric += vol * qty;
    chargeable += Math.max(grams, vol) * qty;
  }
  const zone = resolveZone(destinationState, config.zones);

  if (subtotal > 0 && subtotal >= config.freeShippingThreshold) {
    return {
      amount: 0,
      zone,
      chargeableWeight: chargeable,
      actualWeight: actual,
      volumetricWeight: volumetric,
      free: true,
      reason: "free-threshold",
      method: zone ? `Free standard · ${zone.name}` : "Free standard",
    };
  }
  if (!zone) {
    return { amount: 0, zone: null, chargeableWeight: chargeable, actualWeight: actual, volumetricWeight: volumetric, free: true, reason: "no-zone", method: "Standard" };
  }
  if (chargeable <= 0) {
    return { amount: 0, zone, chargeableWeight: 0, actualWeight: 0, volumetricWeight: 0, free: true, reason: "no-weight", method: `Standard · ${zone.name}` };
  }
  return {
    amount: rateForWeight(zone, chargeable),
    zone,
    chargeableWeight: chargeable,
    actualWeight: actual,
    volumetricWeight: volumetric,
    free: false,
    reason: "rate-card",
    method: `Standard · ${zone.name} · ${zone.etaDays} days`,
  };
}

export function formatGrams(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 2)} kg`;
  return `${Math.round(grams)} g`;
}
