import "server-only";

/**
 * WhatsApp delivery via the FueledInbox REST API (template message).
 *
 * Uses the account's approved OTP template with a single body variable
 * {{1}} = the OTP code. All three env vars must be set for real delivery:
 *
 *   WACRM_BASE_URL           e.g. https://wacrm.your-domain.com
 *   WACRM_API_KEY            wacrm_live_…  (needs the messages:send scope)
 *   WACRM_OTP_TEMPLATE_ID    id of the APPROVED OTP template
 *
 * For local development without credentials, set ALLOW_DEV_OTP=true — the
 * code is then logged to the server console and returned to the caller so
 * the full flow stays testable. Never set ALLOW_DEV_OTP in a real deployment.
 */

export type SendOtpResult =
  | { ok: true; dev: boolean }
  | { ok: false; error: string };

const TIMEOUT_MS = 10_000;

export async function sendOtpWhatsApp(
  phone: string,
  code: string
): Promise<SendOtpResult> {
  const base = process.env.WACRM_BASE_URL?.replace(/\/+$/, "");
  const apiKey = process.env.WACRM_API_KEY;
  const templateId = process.env.WACRM_OTP_TEMPLATE_ID;

  if (!base || !apiKey || !templateId) {
    if (process.env.ALLOW_DEV_OTP === "true") {
      console.warn(`[otp] DEV MODE — WhatsApp not configured. Code for ${phone}: ${code}`);
      return { ok: true, dev: true };
    }
    console.error("[otp] WACRM_* env vars are not configured — cannot send OTP");
    return {
      ok: false,
      error: "Mobile verification isn't configured on this server yet. Please contact support.",
    };
  }

  try {
    const res = await fetch(`${base}/api/v1/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        phone,
        template_id: templateId,
        template_params: [code],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[otp] FueledInbox send failed (${res.status}): ${body.slice(0, 300)}`);
      return {
        ok: false,
        error: "We couldn't send the WhatsApp code. Please try again in a moment.",
      };
    }
    return { ok: true, dev: false };
  } catch (e) {
    console.error("[otp] FueledInbox send error:", e);
    return {
      ok: false,
      error: "We couldn't reach the messaging service. Please try again in a moment.",
    };
  }
}
