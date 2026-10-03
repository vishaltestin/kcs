# KCS G-Mart — Claude project instructions

@AGENTS.md

`AGENTS.md` is the canonical, up-to-date description of this application and is
imported above. Read it before making changes; the summary below is only a
signpost, so when the two disagree, trust `AGENTS.md`.

## Quick orientation

**What this is:** KCS G-Mart — a corporate-gifting e-commerce storefront plus
back office (bulk/tiered pricing, GST invoices, weight-zone shipping, enquiries,
meetings) and a multi-vendor marketplace with `/admin` and `/vendor` consoles.

**Stack:** Next.js 16 App Router + React 19 (TypeScript `strict`), Prisma 7 on
MySQL/MariaDB via `@prisma/adapter-mariadb`, Auth.js v5 (Credentials + JWT,
bcryptjs hashes), Tailwind v4 + shadcn/ui, Zod + React Hook Form, Zustand for the
persisted cart/wishlist, pdfkit for invoices.

**Non-negotiables when editing:**

- Mutations go through **server actions** in `src/actions/**` and return the
  typed `ActionResult`; reads live in `src/lib/queries/**`. No REST writes.
- Keep `src/lib/auth/config.ts` **edge-safe** — `src/proxy.ts` (Next 16's
  renamed middleware) imports it. Use the client helpers from `next-auth/react`
  for sign-in/out, not the server actions.
- Respect the **cart ownership rules** in `src/store/cart.ts`: a guest cart is
  adopted when the customer signs in (otherwise the
  `/checkout → /login → /checkout` trip empties the basket), but a cart owned by
  a *different* account is wiped. `CartSidebar` calls `setOwner` on every mount.
- The demo warning lives in **one place only** — `<DemoNotice />` above the
  navbar in the storefront layout. Don't add another one.
- Signup creates no user until the WhatsApp OTP is verified
  (`PendingRegistration` → `verifyOtpAction` → `User`).

**Commands:** `npm run dev` · `npm run build` · `npm run lint` ·
`npx prisma migrate deploy` · `npx tsx prisma/seed.ts` ·
`./scripts/bootstrap.sh`. `npm ci` needs a `.env` with `DATABASE_URL` because of
the `postinstall: prisma generate` step.
