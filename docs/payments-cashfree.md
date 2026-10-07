# Cashfree Payments — Developer Guide

**Audience:** developers working in this codebase. For setup keys, sandbox
testing and go-live, see [`CASHFREE.md`](../CASHFREE.md) (operator guide).
This document explains **how the integration works, why it is shaped this
way, and what was verified against Cashfree's official docs** (audit:
2026-10-07, see §9).

**One-line summary:** checkout is online-only. A local order is an unpaid
*quote* until `verifyCashfreePayment` confirms real money at Cashfree; only
then do stock, invoice and the `PENDING → PAID` flip happen — exactly once,
no matter which confirmation path runs first.

---

## 1. Architecture & trust model

```
Checkout form ──► placeOrderAction ──► local order (UNPAID, no stock, no invoice)
                                              │
                                              ▼
                                    Cashfree "create order" (server)
                                              │ payment_session_id
                                              ▼
                        Browser opens Cashfree hosted checkout (cashfree-js)
                                              │ customer pays / abandons
        ┌──────────────────┬──────────────────┴──────────────────┐
        ▼                  ▼                                     ▼
/checkout/return     /api/payments/cashfree/webhook      retryPaymentAction
(customer redirect)  (server-to-server, HMAC-signed)     ("Pay Again" buttons)
/checkout/return     ─┐
webhook              ─┼──► verifyCashfreePayment ──► confirmOrderPayment (idempotent)
retry action         ─┘         │ PAID + SUCCESS payment?      │ reserve stock →
                                                             issue invoice → PAID
```

Trust rules (do not weaken these):

1. **The redirect and the webhook are untrusted.** Both re-verify against
   Cashfree's API before anything is fulfilled. A forged
   `/checkout/return?order_id=…` hit can never confirm an order.
2. **One funnel.** Every success path ends in `confirmOrderPayment`, which
   claims the `PENDING → PAID` flip with an atomic conditional update — the
   loser of a webhook-vs-redirect race is a no-op (`alreadyPaid`).
3. **Secrets stay server-side.** `src/lib/cashfree.ts` starts with
   `import "server-only"`. The browser only ever sees the single-use
   `payment_session_id`.
4. **Money first, fulfilment second.** Stock reservation and invoice numbers
   happen inside the confirm transaction — abandoned checkouts hold no stock
   and burn no invoice numbers.

---

## 2. The money flow, step by step

| Step | What happens | Code |
| --- | --- | --- |
| 1. Place order | `placeOrderAction` validates the cart, creates the local order (`PENDING`, items snapshotted, totals frozen), then calls `createCashfreeOrder` with `orderId = orderNumber` and returns `{ orderNumber, paymentSessionId }`. The Cashfree call is deliberately *outside* the DB transaction (network I/O). If it throws, the order stays `PENDING` and the customer retries later. | `src/actions/orders.ts`, `src/lib/cashfree.ts` |
| 2. Open checkout | The browser calls `launchCashfreeCheckout(orderNumber, paymentSessionId)` → `load({ mode })` → `checkout({ paymentSessionId, redirectTarget: "_self" })`. Cashfree takes over the tab. The pending order number is stashed in `sessionStorage` so the success page can clear exactly that cart. | `src/lib/cashfree-client.ts`, `src/components/shop/clear-cart-on-success.tsx` |
| 3a. Return | Cashfree redirects to `/checkout/return?order_id={order_id}` after *every* attempt (success, failure, or drop — the redirect alone says nothing). The page polls `verifyCashfreePayment` up to 4× over ~10s (Cashfree can redirect before the order flips to `PAID`), then confirms or bounces to `/payment-failed/<order>?reason=…`. | `src/app/(shop)/checkout/return/page.tsx` |
| 3b. Webhook | Cashfree POSTs `PAYMENT_SUCCESS_WEBHOOK` / `PAYMENT_FAILED_WEBHOOK` / `PAYMENT_USER_DROPPED_WEBHOOK` to `notify_url`. Signature verified → success events re-verified via API → confirm. This catches payments where the customer closed the tab before the redirect ran. | `src/app/api/payments/cashfree/webhook/route.ts` |
| 3c. Retry | "Pay Again" buttons call `retryPaymentAction` (rate-limited) → `createPaymentSessionForOrder`, which **verifies first**: money already there → confirm + `alreadyPaid` (no new charge possible); otherwise mint a fresh id + session and relaunch checkout. | `src/actions/payments.ts`, `src/components/shop/retry-payment-button.tsx` |
| 4. Confirm | `confirmOrderPayment` reserves stock, allocates the invoice number, flips parent + sub-orders to `PAID`, stamps `cfPaymentId`/`paidAt`. If stock ran out meanwhile, the money is still recorded and a `stock short: …` stamp is appended to order notes for the fulfilment team (alternatives or refund) — a paid customer never sees an error. | `src/lib/order-payments.ts` |

---

## 3. Retry & idempotency design

Three facts drive the design (all per Cashfree's official docs — see §9):

- **An order id is single-attempt.** Re-creating an existing id returns
  `409 order_already_exists`, *regardless of ACTIVE/PAID/EXPIRED*. Cashfree's
  FAQ instructs: *"Generate a new, unique order ID for each payment attempt."*
- Therefore **every attempt rotates the id**: `createPaymentSessionForOrder`
  terminates the superseded id best-effort (so a stale tab can't pay on it)
  and creates `<orderNumber>-R<time36>` (charset `[A-Za-z0-9_-]`, ≤ 45
  chars). The **local order number never changes** — return URL and webhook
  both resolve through the stored `cashfreeOrderId`.
- **Verify-first makes retries charge-safe**: PAID remotely → confirm
  locally, no session minted. As a backstop, Cashfree auto-refunds duplicate
  successful payments against the same order id.

Double-submit protection is layered: the checkout form keeps one idempotency
key per cart payload (`checkout-form.tsx`), and `placeOrderAction` replays an
existing local order (`replayCheckout`) instead of creating a second one.

---

## 4. Cashfree API surface we use

Pinned version: **`2023-08-01`** (`API_VERSION` in `src/lib/cashfree.ts`) —
a long-stable surface still documented by Cashfree. All calls use
`x-client-id` / `x-client-secret` / `x-api-version` against
`https://sandbox.cashfree.com/pg` (sandbox) or `https://api.cashfree.com/pg`
(production), selected by `CASHFREE_ENV`.

| Call | Endpoint | Used for |
| --- | --- | --- |
| `createCashfreeOrder` | `POST /orders` | Mint order + `payment_session_id`. Sends `order_amount` (≤2 dp, ≥ ₹1), `customer_details`, `order_meta.return_url` (with Cashfree's `{order_id}` placeholder), `order_meta.notify_url`, `order_note` (≤200 chars). |
| `getCashfreeOrder` | `GET /orders/{id}` | Status check. Handles `ACTIVE` / `PAID` / `EXPIRED` / `TERMINATED` / `TERMINATION_REQUESTED`. |
| `getCashfreePayments` | `GET /orders/{id}/payments` | Find the `SUCCESS` payment (`cf_payment_id`, amount, method). |
| `terminateCashfreeOrder` | `PATCH /orders/{id}` `{"order_status":"TERMINATED"}` | Best-effort kill of a superseded id on retry. Never throws. |
| `verifyCashfreePayment` | (composition of the two GETs) | **The** trusted "money arrived" check: `order_status == PAID` **and** a `SUCCESS` payment exists. |
| `launchCashfreeCheckout` | `@cashfreepayments/cashfree-js` | `load({ mode })` + `checkout({ paymentSessionId, redirectTarget: "_self" })`. Mode follows `NEXT_PUBLIC_CASHFREE_ENV` — keep it in sync with `CASHFREE_ENV`. |

Field constraints worth knowing (enforced by Cashfree):

- `order_id`: 3–45 chars, `[A-Za-z0-9_-]` only. Our format `KCS-YYYYMMDD-XXXX`
  (≈17 chars) plus `-R…` rotation suffix stays well inside.
- `customer_phone`: plain 10-digit mobile for INR (`normalizeIndianPhone`
  strips country codes and validates `^[6-9]\d{9}$`).
- `notify_url`: must be public HTTPS in production (plain HTTP tolerated
  only in sandbox) — hence webhooks can't reach `localhost`; see
  `CASHFREE.md` §5 for the ngrok flow.
- `order_amount`: ≥ 1 (₹1 minimum), up to two decimals.

---

## 5. Webhooks

- **Endpoint:** `POST /api/payments/cashfree/webhook` (`runtime = "nodejs"`,
  `dynamic = "force-dynamic"`). Sent per-order via `notify_url`, so no
  dashboard webhook configuration is required (delivery logs still visible
  in the Cashfree dashboard).
- **Events:** `PAYMENT_SUCCESS_WEBHOOK` → re-verify + confirm;
  `PAYMENT_FAILED_WEBHOOK` → `markOrderPaymentFailed` (only `PENDING →
  FAILED`; customer can still retry, which returns the order to `PENDING`);
  `PAYMENT_USER_DROPPED_WEBHOOK` + anything else → acknowledged, order stays
  retryable. Unknown/cancelled/already-paid orders are acknowledged without
  work.
- **Signature:** `base64(HMAC_SHA256(secretKey, timestamp + rawBody))`
  compared (timing-safe) against `x-webhook-signature`. Two gotchas, both
  handled:
  1. The body must be the **raw text** (`req.text()`) — parsing to JSON
     first can rewrite `170.00` → `170` and break the HMAC.
  2. `x-webhook-timestamp` is **milliseconds** since epoch, not seconds.
     The 5-minute replay window normalises either unit.
- **Retries:** verification failures answer `5xx` so Cashfree redelivers
  (watch `x-webhook-attempt`); signature failures answer `401` and are
  logged. Confirm-then-crash is safe because confirmation is idempotent.

---

## 6. Failure modes & recovery

The failed page (`payment-failed/[orderNumber]`) explains each outcome; the
`reason` param is set by the return page:

| `reason` | Meaning | Recovery |
| --- | --- | --- |
| `incomplete` | Not paid after the verify retries (failed / dropped / still pending). | "Pay Again" — verify-first, then a fresh id + session. |
| `verify` | Gateway unreachable during verification. | Same retry; if money was debited, verify-first confirms without charging. |
| `confirm` | Paid, but local confirmation threw (e.g. DB blip). | Retry **only confirms, never re-charges** (verify-first → `alreadyPaid`). Shows "don't pay again" copy. |
| `cancelled` | Local order was cancelled. | Support path (possible refund). |

Support playbook: order stuck `PENDING` but customer claims payment →
Profile → Orders → Complete payment (verify-first rescues it). Cashfree
dashboard → Developers → API logs / Webhooks shows the gateway-side truth.
App-side breadcrumbs: `[checkout-return]`, `[cashfree-webhook]`,
`[retryPaymentAction]` server logs.

## 7. Data model

On `Order` (migration `20261006120000_cashfree_payments`):

| Column | Meaning |
| --- | --- |
| `paymentStatus` | `PENDING` (unpaid quote) → `PAID` (money verified) / `FAILED` (definitive gateway failure; retry returns it to `PENDING`). Mirrored to sub-orders. Revenue, dashboards and "Spent" count `PAID` only. |
| `cashfreeOrderId` | Current Cashfree id (first attempt: the order number; later: `<order>-R…`). The join key for return URL + webhook lookups. |
| `cfPaymentId` / `paidAt` | Gateway payment id + confirmation time, stamped at confirm. |

## 8. Testing checklist (sandbox)

1. Happy path: demo customer → checkout → test card `4111 1111 1111 1111`,
   any future expiry/CVV, OTP `123456` → success page shows **Paid online**,
   stock reserved, invoice downloadable.
2. Failure: abandon the Cashfree tab or use a failing instrument → failed
   page, order `PENDING`, stock untouched → "Pay Again" completes it.
3. Double-submit: rapid double Pay → one local order, one charge.
4. Rescue: pay, then close the tab *before* the redirect completes → order
   still confirms via webhook (needs public URL — ngrok) or via the next
   "Pay Again"/return visit (verify-first).
5. Stale-tab: open "Pay Again" in tab B, then try to complete the old
   checkout in tab A → blocked (old id terminated).
6. Dashboards: `/admin/orders` Payment column, vendor payouts and profile
   "Spent" only move on `PAID`.

## 9. Audit log — verified against official docs (2026-10-07)

Each row was checked against Cashfree's current documentation (API
reference + integration guides + FAQ). Verdicts:

| # | Claim in our integration | Official source | Verdict |
| --- | --- | --- | --- |
| 1 | Base URLs `sandbox.cashfree.com/pg`, `api.cashfree.com/pg`; auth via `x-client-id` + `x-client-secret`, version via `x-api-version` | Create Order API reference (headers + environments) | ✅ Correct |
| 2 | Pin `x-api-version: 2023-08-01` | Still a documented version (webhook payloads + reference keep 2023-08-01 examples; newer `2025-01-01`/`2026-01-01` exist but nothing we use requires them) | ✅ Correct, no upgrade needed |
| 3 | `return_url` carries Cashfree's `{order_id}` placeholder; per-order `notify_url` | Create Order reference (`OrderMeta`): *"must contain a placeholder {order_id}… Cashfree will replace the placeholder"*; `notify_url` = webhook URL (HTTPS required in production) | ✅ Correct |
| 4 | Amount ≤2 dp; customer `customer_id` + 10-digit `customer_phone` | Create Order reference (`order_amount`: *"upto two decimals"*; customer phone examples) | ✅ Correct |
| 5 | Paid ⟺ `order_status == PAID` **and** a `SUCCESS` payment in `GET …/payments` | Reference: `PAID` = *"Order is PAID with one successful transaction"*; payments list exposes `payment_status` incl. `SUCCESS`/`FAILED`/`USER_DROPPED` | ✅ Correct (belt and braces) |
| 6 | SDK: `load({ mode })` + `checkout({ paymentSessionId, redirectTarget: "_self" })` from `@cashfreepayments/cashfree-js` | "Hosted Web Checkout" integration guide — exact call shape | ✅ Correct |
| 7 | Webhook HMAC = `base64(HMAC_SHA256(secret, timestamp + rawBody))`, raw body, `x-webhook-signature` | Webhook signature docs + PG Payment Webhooks reference | ✅ Correct |
| 8 | Webhook event names + `data.order.order_id` payload path | PG Payment Webhooks reference payloads (`PAYMENT_SUCCESS_WEBHOOK`, … for version 2023-08-01) | ✅ Correct |
| 9 | Non-2xx → Cashfree redelivers (our `5xx` on unverified) | Webhook delivery model (`x-webhook-attempt` header, retried-delivery analytics in dashboard) | ✅ Correct |
| 10 | Old code: same-id re-create mints a fresh session | Orders & Payments FAQ: duplicate id → **`409 order_already_exists` regardless of ACTIVE/PAID/EXPIRED**; *"Generate a new, unique order ID for each payment attempt"* | ❌ **Was wrong → fixed**: every attempt now rotates to a fresh id (+ best-effort `PATCH … TERMINATED` of the old one) |
| 11 | Old code: webhook timestamp treated as seconds | Official header examples are 13-digit **milliseconds** (`1746426425612`, …) — the old check rejected *every* webhook | ❌ **Was wrong → fixed**: ms normalised (seconds still tolerated) |
| 12 | Old code: id sliced to 50 chars, note to 500 | Reference: `order_id` 3–**45** chars; `order_note` 3–**200** chars | ⚠️ Latent (our values are short) → fixed to 45 / 200 |
| 13 | Old comments: "sessions expire after ~30 min" | No such TTL in the official docs (default `order_expiry_time` is long; we don't set it) | ⚠️ Unverifiable claim → reworded to single-attempt semantics |

## 10. Maintenance notes & known limitations

- **Upgrading `API_VERSION`:** diff the new version's webhook payloads and
  error codes first; our parsing only touches `type`, `data.order.order_id`,
  `order_status`, and the payments list, so minor versions are low-risk.
  Never chase `latest` implicitly — the pin is deliberate.
- **Key rotation:** swap `CASHFREE_APP_ID`/`CASHFREE_SECRET_KEY` (+ the
  `NEXT_PUBLIC_CASHFREE_ENV`/`CASHFREE_ENV` pair when changing envs) and
  redeploy; no code changes, no stored credentials anywhere.
- **Watch the logs:** `[cashfree-webhook] rejected: bad signature` at volume
  means wrong secret or clock skew; `[checkout-return] order not paid after
  retries` at volume means a settlement-lag or connectivity problem.
- **Known limitations (v1):** refunds are manual (Cashfree dashboard, then
  set `REFUNDED`/cancel locally); no auto-cancellation of abandoned `PENDING`
  orders (add a cron if they pile up); a payment completed on a stale tab in
  the seconds before its termination lands would need manual reconciliation
  (return/webhook lookups key on the current id only) — vanishingly rare,
  and Cashfree's duplicate-payment auto-refund covers true double charges.

## 11. References

- Create Order API reference — `https://www.cashfree.com/docs/api-reference/payments/latest/orders/create-order`
- Payment webhooks reference — `https://www.cashfree.com/docs/api-reference/payments/latest/payments/webhooks`
- Hosted web checkout guide — `https://www.cashfree.com/docs/payments/online/web/redirect`
- Terminate Order (v2023-08-01) — `https://www.cashfree.com/docs/api-reference/payments/previous/v2023-08-01/orders/terminate`
- Orders & Payments FAQ (409/duplicates) — `https://www.cashfree.com/docs/help/payments/orders-and-payments/orders-and-payments`
- Test data (sandbox cards) — `https://www.cashfree.com/docs/payments/online/integration-guide/test-data`
