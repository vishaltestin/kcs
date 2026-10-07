import "server-only";

import crypto from "node:crypto";

/**
 * Cashfree Payment Gateway client — server-side only. The secret key must
 * never reach the browser, so every call here runs in a Server Action, a
 * Route Handler or a server component.
 *
 * Flow (online-only checkout):
 *   1. `placeOrderAction` creates the local order UNPAID, then calls
 *      `createCashfreeOrder` and hands the `paymentSessionId` to the browser.
 *   2. The browser opens the Cashfree hosted checkout
 *      (`launchCashfreeCheckout`); Cashfree redirects back to
 *      `/checkout/return?order_id={order_id}` after the attempt.
 *   3. The return page AND the `/api/payments/cashfree/webhook` handler both
 *      call `verifyCashfreePayment` (the only trusted "money arrived" signal)
 *      and then `confirmOrderPayment`, which is idempotent — whichever runs
 *      first wins, the other is a no-op.
 *
 * Each Cashfree order id is single-attempt: re-creating an existing id
 * answers 409 `order_already_exists` (even for ACTIVE orders), so every
 * retry rotates to a FRESH id plus a fresh `payment_session_id` via
 * `createPaymentSessionForOrder` (Cashfree's own retry guidance: a new,
 * unique order id per payment attempt).
 *
 * Docs: https://www.cashfree.com/docs/payments/online/web/redirect
 */

export class CashfreeError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "CashfreeError";
  }
}

type CashfreeEnv = "sandbox" | "production";

/** Pinned PG API version — 2023-08-01 is the long-stable surface. */
const API_VERSION = "2023-08-01";

const BASE_URL: Record<CashfreeEnv, string> = {
  sandbox: "https://sandbox.cashfree.com/pg",
  production: "https://api.cashfree.com/pg",
};

function getConfig() {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secret = process.env.CASHFREE_SECRET_KEY?.trim();
  if (!appId || !secret) {
    throw new CashfreeError(
      "Online payment is not configured yet. Please contact us to complete your order.",
    );
  }
  const env: CashfreeEnv = process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
  return { appId, secret, env, baseUrl: BASE_URL[env] };
}

export function isCashfreeConfigured(): boolean {
  return Boolean(process.env.CASHFREE_APP_ID?.trim() && process.env.CASHFREE_SECRET_KEY?.trim());
}

/** Public site URL used for Cashfree return/notify URLs. */
export function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

async function cfFetch<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const { appId, secret, baseUrl } = getConfig();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": API_VERSION,
        "x-client-id": appId,
        "x-client-secret": secret,
      },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
  } catch (error) {
    throw new CashfreeError(
      `Could not reach the payment gateway (${error instanceof Error ? error.message : "network error"}). Please try again.`,
    );
  }
  const data = (await res.json().catch(() => null)) as {
    message?: string;
    code?: string;
  } | null;
  if (!res.ok) {
    throw new CashfreeError(
      data?.message ?? `Payment gateway error (HTTP ${res.status}). Please try again.`,
      res.status,
      data?.code,
    );
  }
  return data as T;
}

/** Cashfree wants a plain 10-digit mobile number for INR orders. */
export function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const ten = digits.length > 10 ? digits.slice(-10) : digits;
  if (!/^[6-9]\d{9}$/.test(ten)) {
    throw new CashfreeError("A valid 10-digit mobile number is required for online payment.");
  }
  return ten;
}

export interface CreateCashfreeOrderInput {
  orderId: string;
  amount: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  note?: string;
}

interface CashfreeCreateOrderResponse {
  cf_order_id: string;
  order_id: string;
  order_status: string;
  payment_session_id: string;
}

/**
 * Creates the Cashfree order. `orderId` must be unique per attempt —
 * Cashfree rejects a duplicate id with 409 `order_already_exists`, so
 * retries rotate the id first (see `createPaymentSessionForOrder`); the
 * local order number never changes.
 */
export async function createCashfreeOrder(input: CreateCashfreeOrderInput): Promise<{
  paymentSessionId: string;
  cfOrderId: string;
  orderStatus: string;
}> {
  const appUrl = getAppUrl();
  const data = await cfFetch<CashfreeCreateOrderResponse>("/orders", {
    method: "POST",
    body: {
      order_id: input.orderId,
      order_amount: Math.round(input.amount * 100) / 100,
      order_currency: "INR",
      customer_details: {
        customer_id: input.customerId,
        customer_name: input.customerName.slice(0, 100),
        customer_email: input.customerEmail,
        customer_phone: normalizeIndianPhone(input.customerPhone),
      },
      order_meta: {
        // {order_id} is substituted by Cashfree before redirecting back.
        return_url: `${appUrl}/checkout/return?order_id={order_id}`,
        notify_url: `${appUrl}/api/payments/cashfree/webhook`,
      },
      order_note: (input.note ?? `KCS G-Mart ${input.orderId}`).slice(0, 200), // Cashfree allows 3–200 chars.
    },
  });
  if (!data.payment_session_id) {
    throw new CashfreeError("The payment gateway did not return a session. Please try again.");
  }
  return {
    paymentSessionId: data.payment_session_id,
    cfOrderId: data.cf_order_id,
    orderStatus: data.order_status,
  };
}

interface CashfreeOrderResponse {
  cf_order_id: string;
  order_id: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | string;
  order_amount: number;
}

export async function getCashfreeOrder(orderId: string): Promise<CashfreeOrderResponse> {
  return cfFetch<CashfreeOrderResponse>(`/orders/${encodeURIComponent(orderId)}`);
}

interface CashfreePayment {
  cf_payment_id: string;
  order_id: string;
  payment_status: "SUCCESS" | "FAILED" | "CANCELLED" | "USER_DROPPED" | "PENDING" | string;
  payment_amount: number;
  /** Shape: { upi: … } | { card: … } | { netbanking: … } | … */
  payment_method?: Record<string, unknown> | null;
  payment_time?: string;
}

export async function getCashfreePayments(orderId: string): Promise<CashfreePayment[]> {
  return cfFetch<CashfreePayment[]>(`/orders/${encodeURIComponent(orderId)}/payments`);
}

/**
 * Best-effort termination of a superseded Cashfree order id (PATCH
 * /orders/{id} with order_status TERMINATED). Called when a retry rotates
 * to a fresh id, so a stale checkout tab can no longer complete payment on
 * the old id. Never throws — termination failing must not block the retry.
 */
export async function terminateCashfreeOrder(orderId: string): Promise<void> {
  try {
    await cfFetch<unknown>(`/orders/${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      body: { order_status: "TERMINATED" },
    });
  } catch (error) {
    console.warn("[cashfree] terminate superseded order failed", orderId, error);
  }
}

export interface PaymentVerification {
  paid: boolean;
  cfPaymentId: string | null;
  amount: number | null;
  /** e.g. "upi" | "card" | "netbanking" — for logs/support, not stored. */
  method: string | null;
}

/**
 * The single trusted "did the money arrive" check. An order counts as paid
 * only when Cashfree reports order_status PAID *and* a SUCCESS payment
 * exists — return-URL hits and webhooks are untrusted until this passes.
 */
export async function verifyCashfreePayment(cashfreeOrderId: string): Promise<PaymentVerification> {
  const order = await getCashfreeOrder(cashfreeOrderId);
  if (order.order_status !== "PAID") {
    return { paid: false, cfPaymentId: null, amount: null, method: null };
  }
  const payments = await getCashfreePayments(cashfreeOrderId);
  const success = payments.find((p) => p.payment_status === "SUCCESS");
  if (!success) {
    return { paid: false, cfPaymentId: null, amount: null, method: null };
  }
  const method =
    success.payment_method && typeof success.payment_method === "object"
      ? (Object.keys(success.payment_method)[0] ?? null)
      : null;
  return {
    paid: true,
    cfPaymentId: success.cf_payment_id,
    amount: success.payment_amount,
    method,
  };
}

/**
 * Verifies the HMAC signature Cashfree attaches to webhook calls:
 *   signature = base64(HMAC_SHA256(secretKey, timestamp + rawBody))
 * with `x-webhook-signature` / `x-webhook-timestamp` headers. The timestamp
 * (milliseconds since epoch) also bounds replay attacks to a 5-minute
 * window; plain-seconds values are accepted too, defensively.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
): boolean {
  try {
    const { secret } = getConfig();
    if (!signature || !timestamp) return false;
    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) return false;
    // Cashfree sends milliseconds (13 digits); tolerate seconds as well.
    const tsSeconds = ts > 1_000_000_000_000 ? ts / 1000 : ts;
    if (Math.abs(Date.now() / 1000 - tsSeconds) > 5 * 60) return false;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}${rawBody}`)
      .digest("base64");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
