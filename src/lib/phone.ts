/**
 * Phone helpers — pure, safe to use from both client and server code.
 *
 * We store one canonical shape: E.164 ("+919876543210"). Users type all
 * kinds of formats ("98765 43210", "09876543210", "+91 98765 43210"), so
 * normalization is forgiving:
 *  - strips spaces, dashes, parentheses
 *  - a bare 10-digit number starting 6-9 is an Indian mobile → "+91…"
 *  - a leading 0 on a 10-11 digit number is dropped (trunk prefix)
 *  - anything starting "+" is kept; 8–15 digits total (E.164 limits)
 */

export function normalizePhone(input: string): string | null {
  let p = input.trim().replace(/[\s\-().]/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2); // international dialing form
  if (!p.startsWith("+")) {
    if (p.startsWith("0")) p = p.slice(1);
    if (/^[6-9]\d{9}$/.test(p)) p = "91" + p; // assume India for bare mobiles
    p = "+" + p;
  }
  return /^\+[1-9]\d{7,14}$/.test(p) ? p : null;
}

/** "+91 ••••• 43210" — for the "we sent a code to …" screen */
export function maskPhone(phone: string): string {
  if (phone.length <= 7) return phone;
  return `${phone.slice(0, 3)} ••••• ${phone.slice(-4)}`;
}
