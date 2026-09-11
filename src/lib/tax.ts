/**
 * GST helpers. Listed prices are GST-INCLUSIVE, so tax is carved out of the
 * line total for the invoice rather than added on top.
 *
 *   taxable = inclusive × 100 / (100 + rate)
 *   tax     = inclusive − taxable
 *
 * Intra-state supply (buyer in the seller's state) splits the tax into
 * CGST + SGST; inter-state supply charges IGST. The buyer's state is taken
 * from the GSTIN prefix when given, otherwise from the billing state.
 */

/** GST state codes (first two digits of a GSTIN). */
export const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
};

const STATE_ALIASES: Record<string, string> = {
  "new delhi": "07",
  "delhi ncr": "07",
  "nct of delhi": "07",
  orissa: "21",
  pondicherry: "34",
  uttaranchal: "05",
  "jammu and kashmir": "01",
  "andaman and nicobar islands": "35",
  "dadra and nagar haveli": "26",
  "daman and diu": "26",
};

function normaliseState(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Resolve a free-text state name to its two-digit GST code (null if unknown). */
export function stateCodeFromName(state: string | null | undefined): string | null {
  if (!state) return null;
  const key = normaliseState(state);
  if (STATE_ALIASES[key]) return STATE_ALIASES[key];
  for (const [code, name] of Object.entries(GST_STATE_CODES)) {
    if (normaliseState(name) === key) return code;
  }
  // Loose match: "Delhi" inside "Delhi (NCT)", "Karnataka State", etc.
  for (const [code, name] of Object.entries(GST_STATE_CODES)) {
    const n = normaliseState(name);
    if (key.includes(n) || n.includes(key)) return code;
  }
  return null;
}

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function isValidGstin(value: string | null | undefined): boolean {
  return !!value && GSTIN_REGEX.test(value.trim().toUpperCase());
}

/** Place-of-supply code: GSTIN prefix wins, else the state name. */
export function resolvePlaceOfSupply(gstNo: string | null | undefined, state: string | null | undefined): string | null {
  const gst = gstNo?.trim().toUpperCase();
  if (gst && /^[0-9]{2}/.test(gst) && GST_STATE_CODES[gst.slice(0, 2)]) return gst.slice(0, 2);
  return stateCodeFromName(state);
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Split an inclusive amount into taxable value + tax for a given rate (%). */
export function splitInclusive(inclusive: number, ratePct: number): { taxable: number; tax: number } {
  const rate = Math.max(0, Number(ratePct) || 0);
  const taxable = round2((inclusive * 100) / (100 + rate));
  return { taxable, tax: round2(inclusive - taxable) };
}

export type TaxLine = { lineTotal: number; gstRate: number };

export type TaxSummary = {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  interState: boolean;
};

/**
 * Aggregate the tax across order lines. `interState` decides CGST/SGST vs IGST.
 * Shipping is treated as a taxable service at 18% when charged.
 */
export function summariseTax(lines: TaxLine[], interState: boolean, shipping = 0): TaxSummary {
  let taxable = 0;
  let tax = 0;
  for (const line of lines) {
    const split = splitInclusive(line.lineTotal, line.gstRate);
    taxable += split.taxable;
    tax += split.tax;
  }
  if (shipping > 0) {
    const split = splitInclusive(shipping, 18);
    taxable += split.taxable;
    tax += split.tax;
  }
  taxable = round2(taxable);
  tax = round2(tax);
  if (interState) {
    return { taxableAmount: taxable, cgst: 0, sgst: 0, igst: tax, totalTax: tax, interState };
  }
  const half = round2(tax / 2);
  return { taxableAmount: taxable, cgst: half, sgst: round2(tax - half), igst: 0, totalTax: tax, interState };
}

/** Indian-style number to words for invoice totals ("Rupees ... Only"). */
export function amountInWords(amount: number): string {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number) => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`);
  const three = (n: number) => {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return `${h ? ones[h] + " Hundred" : ""}${h && rest ? " " : ""}${rest ? two(rest) : ""}`;
  };
  const words = (n: number): string => {
    if (n === 0) return "Zero";
    const parts: string[] = [];
    const crore = Math.floor(n / 10_000_000);
    const lakh = Math.floor((n % 10_000_000) / 100_000);
    const thousand = Math.floor((n % 100_000) / 1000);
    const rest = n % 1000;
    if (crore) parts.push(`${three(crore)} Crore`);
    if (lakh) parts.push(`${three(lakh)} Lakh`);
    if (thousand) parts.push(`${three(thousand)} Thousand`);
    if (rest) parts.push(three(rest));
    return parts.join(" ");
  };
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  return `Rupees ${words(rupees)}${paise ? ` and ${two(paise)} Paise` : ""} Only`;
}
