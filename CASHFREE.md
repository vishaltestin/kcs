# Cashfree Online Payments — Setup & Operations Guide

Checkout is **online-only**: every order is paid through Cashfree (UPI, cards,
netbanking, wallets, EMI) and an order is confirmed only after the money is
verified. There is no "place order without paying" path.

## How it works

```
Checkout form ──► placeOrderAction ──► local order (UNPAID, no stock, no invoice)
                                              │
                                              ▼
                                    Cashfree "create order" (server)
                                              │ payment_session_id
                                              ▼
                        Browser opens Cashfree hosted checkout
                                              │ customer pays
                        ┌─────────────────────┴─────────────────────┐
                        ▼                                           ▼
            /checkout/return?order_id=…              /api/payments/cashfree/webhook
            (customer redirect)                     (server-to-server, HMAC-signed)
                        │                                           │
                        └──────── verifyCashfreePayment ────────────┘
                                              │ PAID + SUCCESS payment?
                                              ▼
                          confirmOrderPayment (idempotent):
                          reserve stock → issue invoice → PENDING → PAID
```

Key properties:

- **Untrusted inputs are re-verified.** The return redirect and the webhook both
  call Cashfree's API before anything is fulfilled. Whichever runs first wins;
  the other is a no-op (`confirmOrderPayment` claims the flip atomically).
- **Cashfree order ids are single-attempt.** Every retry mints a fresh id
  (`<order>-R…`) plus a fresh session for the same local order —
  `createPaymentSessionForOrder` checks for an existing payment first, so
  retrying can never double-charge.
- **Idempotent checkout.** Re-submitting the same cart replays the original
  order (fresh session) instead of creating a second one.
- **Stock + invoice happen on payment**, so abandoned checkouts never block
  inventory or burn invoice numbers. If stock runs out between checkout and
  payment, the payment is still recorded and the shortage is flagged on the
  order for the team (alternatives or refund).
- **Revenue counts PAID orders only** (admin + vendor dashboards, charts,
  "Spent" in the profile).

## 1. Get sandbox keys

1. Sign in to [merchant.cashfree.com](https://merchant.cashfree.com/) and switch
   to **Sandbox / Test** mode.
2. Go to **Developers → API Keys** and copy the **App ID** and **Secret Key**.
3. No real money moves in sandbox — use it to run test payments end to end.

## 2. Configure the environment

```bash
cp .env.example .env   # if you haven't already
```

Fill in:

```env
CASHFREE_APP_ID="your_sandbox_app_id"
CASHFREE_SECRET_KEY="your_sandbox_secret_key"
CASHFREE_ENV="sandbox"
NEXT_PUBLIC_CASHFREE_ENV="sandbox"
```

Keep `CASHFREE_ENV` and `NEXT_PUBLIC_CASHFREE_ENV` in sync (`sandbox` ↔
`sandbox`, `production` ↔ `production`). `NEXT_PUBLIC_APP_URL` must be the
public URL Cashfree redirects back to (for local testing see §5).

## 3. Install, migrate, run

```bash
npm install
npx prisma migrate deploy   # applies 20261006120000_cashfree_payments
npm run dev
```

(The `postinstall` step runs `prisma generate`, so the new `PaymentStatus`
fields are available to TypeScript immediately.)

## 4. Test a payment (sandbox)

1. Sign in with the demo customer (`demo@kcsgmart.in` / `Demo@12345`), add
   products to the cart, and go through checkout.
2. "Proceed to Secure Payment" opens Cashfree's test checkout. Use Cashfree's
   published test instruments (see
   [Cashfree test data](https://www.cashfree.com/docs/payments/online/integration-guide/test-data);
   as of writing, card `4111 1111 1111 1111` with any future expiry/CVV and
   OTP `123456` succeeds).
3. After payment you land on the order-success page showing **Paid online**;
   stock is reserved and the invoice is issued. Check:
   - `/profile?tab=orders` — order listed, no "Payment pending" pill;
   - `/admin/orders` — Payment column shows **PAID**;
   - the invoice download works.
4. To test failure: abandon the Cashfree tab (or use a failing test card) —
   you land on `/payment-failed/<order>`, the order stays **PENDING**, stock
   is untouched, and "Pay Again" mints a fresh session for the same order.
5. Test the double-submit guard: rapidly click Pay twice — one order, one
   charge.

## 5. Webhooks in local development

Cashfree must reach `notify_url` (`<APP_URL>/api/payments/cashfree/webhook`)
over **public HTTPS**, so on `localhost` the webhook can't arrive. That's OK:

- the return-URL verification still confirms paid orders during local testing;
- for full end-to-end webhook testing, expose your dev server
  (e.g. `ngrok http 3000`), set `NEXT_PUBLIC_APP_URL` to the public URL, and
  re-run checkout.

The webhook is a dumb safety net by design: signature-verified, then
re-checked against Cashfree's API. A signature failure is logged and answered
`401`; a verification failure returns `5xx` so Cashfree retries delivery.

## 6. Go-live checklist

- [ ] Production keys from the Cashfree dashboard (**Production** mode).
- [ ] `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY` = production values.
- [ ] `CASHFREE_ENV="production"` **and** `NEXT_PUBLIC_CASHFREE_ENV="production"`.
- [ ] `NEXT_PUBLIC_APP_URL="https://<your-domain>"` (no trailing slash).
- [ ] Run a ₹1–₹10 live payment, then refund it from the Cashfree dashboard
      (refunds are manual in v1 — see below).
- [ ] Confirm the webhook arrives (Cashfree dashboard → Developers → Webhooks
      shows delivery logs). `notify_url` is sent on every order, so no
      dashboard webhook configuration is strictly required.

## Operations notes

- **Unpaid orders** sit in `PENDING` / `PENDING`. They hold no stock and have
  no invoice. Customers can pay from their orders page at any time; there is
  no automatic cancellation in v1 (add a cron later if abandoned carts pile up).
- **Refunds (v1: manual).** Issue refunds from the Cashfree dashboard, then set
  the order to `REFUNDED` via `PaymentStatus` in Prisma Studio (or a future
  admin action) and cancel the order so stock is restored.
- **Stale Cashfree ids** are handled automatically: every retry rotates to a
  fresh Cashfree id (`<order>-R…`) while the local order number never changes.
  The superseded id is terminated best-effort so a stale checkout tab can't
  complete payment against it.
- **Invoices** are downloadable by customers only after payment (admins stay
  exempt for records/refunds).
- **Paid at Cashfree but the app says "incomplete"?** Usually a timing race
  (the return page retries verification 4× over ~10s before giving up) or an
  unreachable webhook. Rescue the order from Profile → Orders → Complete
  payment — the verify-first check confirms it without charging again.

## Files

| File | Role |
| --- | --- |
| `src/lib/cashfree.ts` | Server-only PG client (create/verify orders, webhook HMAC) |
| `src/lib/order-payments.ts` | `confirmOrderPayment`, `createPaymentSessionForOrder`, failure marking |
| `src/lib/cashfree-client.ts` | Browser launcher for the hosted checkout |
| `src/actions/orders.ts` | Checkout: creates the UNPAID order + first session |
| `src/actions/payments.ts` | `retryPaymentAction` for unpaid orders |
| `src/app/api/payments/cashfree/webhook/route.ts` | Signed server-to-server notifications |
| `src/app/(shop)/checkout/return/page.tsx` | Post-payment verification + redirect |
| `src/app/(shop)/payment-failed/[orderNumber]/page.tsx` | Failure/abandon page with safe retry |
| `src/components/shop/retry-payment-button.tsx` | "Pay Again" button |
| `src/components/shop/clear-cart-on-success.tsx` | Empties the cart only after paid success |
| `prisma/migrations/20261006120000_cashfree_payments/` | `paymentStatus`, `cashfreeOrderId`, `cfPaymentId`, `paidAt` |
