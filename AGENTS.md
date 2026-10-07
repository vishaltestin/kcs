<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# KCS G-Mart — application guide

This file is the canonical description of **what this application is and how it
works**. Read it before changing anything. `CLAUDE.md` imports it, so keep the
facts here and don't duplicate them elsewhere.

## 1. What the app is

**KCS G-Mart** is a corporate-gifting e-commerce storefront and back office for
KCS (Delhi). Customers buy branded merchandise and gift hampers in bulk —
tiered slab pricing, MOQ per product, GST invoices, weight/zone-based shipping,
enquiries and meeting bookings for custom programmes. It is also a
**multi-vendor marketplace**: a platform-owned vendor plus admin-onboarded
sellers, each with its own portal and public storefront, and each order split
into per-vendor sub-orders.

Three audiences, three surfaces:

| Surface | Route | Who |
| --- | --- | --- |
| Storefront | `/`, `/product`, `/category`, `/cart`, `/checkout`, `/wishlist`, `/profile`, `/sellers`, `/blog`, `/about-us`, `/why-us`, `/contact-us`, `/faq` | Anyone; some routes require sign-in |
| Admin console | `/admin/**` | `ADMIN` — products, variants, categories, brands, orders, vendors, shipping, blogs, home tiles/bands, enquiries, meetings, subscribers, users, reviews |
| Vendor portal | `/vendor/**` | `VENDOR` — own products, own sub-orders, profile/settings |

> **Demo deployment.** This instance is a demonstration store: the catalogue is
> sample data and no real order should be placed. The demo warning is shown in
> **exactly one place** — `<DemoNotice />` rendered by `src/app/(shop)/layout.tsx`
> directly above the navbar. Do not re-add it to the product page, checkout,
> order-success or anywhere else.

## 2. Stack

- **Next.js 16.3** (App Router, Turbopack, RSC-first) + **React 19**, TypeScript `strict`.
- **Prisma 7** + `@prisma/adapter-mariadb` driver adapter on **MySQL/MariaDB** (`src/lib/db.ts`).
- **Auth.js v5 / next-auth 5.0.0-beta.32** — Credentials provider, JWT session strategy, bcrypt password hashes.
- **Tailwind CSS v4** + **shadcn/ui** primitives (Radix via the `radix-ui` package), `lucide-react` icons, `sonner` toasts, `recharts` charts, `cmdk`, `embla-carousel`, `@tanstack/react-table`.
- **Zod 4** + **React Hook Form** for validation/forms; **Zustand 5** for the persisted cart/wishlist.
- **pdfkit** for invoice PDFs, **sharp** for image processing.

## 3. Commands

```bash
npm run dev            # dev server (Turbopack) → http://localhost:3000
npm run build          # production build (in-process Turbopack)
npm run start          # serve the production build
npm run lint           # eslint (eslint-config-next)

npx prisma migrate deploy   # apply migrations
npx prisma generate         # regenerate the client
npx tsx prisma/seed.ts      # seed catalogue / users / orders / reviews
npx prisma studio           # browse the DB
./scripts/bootstrap.sh [--dev|--reset-db]   # deps → MariaDB → migrate → seed → build
```

`npm ci` runs `postinstall: prisma generate`, which **requires `DATABASE_URL`** —
create `.env` from `.env.example` first or the install fails at the last step.

### Environment (`.env`, see `.env.example`)

`DATABASE_URL` (percent-encode special characters), `AUTH_SECRET`,
`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `AUTH_TRUST_HOST`,
`SEED_ADMIN_EMAIL|PASSWORD|NAME`, and for WhatsApp OTP:
`WACRM_BASE_URL`, `WACRM_API_KEY`, `WACRM_OTP_TEMPLATE_ID`. In development,
`ALLOW_DEV_OTP="true"` logs OTP codes to the server console and echoes them in
the UI — **never enable in a real deployment**.

## 4. Directory map (actual, not aspirational)

```
src/
├── actions/          # "use server" modules — the ONLY write path
│   ├── auth.ts       # signup, vendor signup, OTP verify, pre-login check
│   ├── orders.ts     # placeOrderAction (checkout)
│   ├── profile.ts    # profile / company / address / password
│   ├── enquiries.ts  # bulk enquiries, contact, newsletter, meetings
│   ├── reviews.ts, wishlist.ts, shipping.ts, search.ts
│   ├── admin/        # admin CRUD (products, orders, vendors, shipping, …)
│   └── vendor/       # vendor portal mutations
├── app/
│   ├── (shop)/       # storefront + its layout (DemoNotice, Navbar, Footer, WishlistProvider)
│   ├── (auth)/       # login, signup, vendor-signup, verify-phone
│   ├── admin/        # admin console (own layout + sidebar)
│   ├── vendor/       # vendor portal
│   └── api/          # only: auth/[...nextauth], uploads, invoice PDF, cashfree webhook
├── components/
│   ├── ui/           # shadcn/ui primitives (CLI-generated)
│   ├── admin/ auth/ vendor/ shop/ layout/ shared/ forms/ home/
├── lib/
│   ├── auth/         # auth.ts (NextAuth), config.ts (edge-safe), session.ts, guards.ts, password.ts
│   ├── queries/      # server-side reads (catalog, orders, admin, vendor, wishlist…)
│   ├── validations/  # Zod schemas shared by actions and forms
│   ├── shipping.ts tax.ts invoice*.ts sub-orders.ts order-mutations.ts inventory.ts
│   ├── phone.ts otp.ts whatsapp.ts rate-limit.ts   # phone verification stack
│   └── db.ts db-url.ts utils.ts constants.ts
├── store/            # Zustand: cart.ts, wishlist.ts, variant-preview.ts
├── proxy.ts          # Next 16 proxy (formerly middleware.ts)
└── types/            # shared types of the client/server boundary
prisma/               # schema.prisma, migrations/, seed.ts
public/images|video   # catalogue media (served through next/image)
```

## 5. Authentication & sessions

**Signup is OTP-gated and creates no user until the OTP is verified.**

1. `/signup` or `/vendor-signup` → `signupAction` / `vendorSignupAction`
   (`src/actions/auth.ts`): rate-limited (5/min/IP), Zod-validated, phone
   normalised (`src/lib/phone.ts`), password hashed with bcryptjs (12 rounds,
   `src/lib/auth/password.ts`). Everything is written to **`PendingRegistration`** —
   there is **no `User` row yet**.
2. A 6-digit code is sent over WhatsApp (`src/lib/whatsapp.ts`, FueledInbox/WACRM);
   with `ALLOW_DEV_OTP=true` it is also logged/returned as `devOtp`.
3. `verifyOtpAction` checks the hashed code (expiry + attempt limit,
   `src/lib/otp.ts`) and only then creates the `User` (plus a `Vendor` row for
   vendor signups), sets `emailVerifiedAt`, deletes the pending row.
4. **Sign-in** (`src/components/auth/login-form.tsx`): `preLoginCheckAction`
   first (per-IP 30/min and per-account 10/5-min limits; unverified accounts get
   a "verify first" message *only after* the password checks out, so it can't be
   used as an account-enumeration oracle), then `signIn("credentials")` from
   `next-auth/react`, which POSTs to `/api/auth/*` and runs `authorize()` in
   `src/lib/auth/auth.ts`.
5. **Sessions are JWTs** (required by the Credentials provider). The token
   carries `id`, `role` and `sessionVersion`. On every server request
   `getSessionUser()` (`src/lib/auth/session.ts`) **re-reads the user from the
   database** and rejects the token if `sessionVersion` no longer matches —
   that's how password changes, role changes and admin resets revoke sessions.
6. **Route protection** has two layers:
   - `src/proxy.ts` (Next 16's renamed middleware) reads the JWT cookie only —
     it can't reach the database — and redirects anonymous traffic on
     `/admin`, `/vendor`, `/profile`, `/checkout`, `/order-success` to
     `/login?next=<path>`. It imports the **edge-safe** `src/lib/auth/config.ts`,
     so never add a Prisma import to that file.
   - Authoritative checks live in the server components/actions:
     `requireUser`, `requireAdmin`, `requireVendor` (redirect) and
     `assertAdmin`, `assertVendor`, `assertAdminOrVendor` (throw) in
     `src/lib/auth/guards.ts`.
7. `(auth)/login` and `(auth)/signup` deliberately do the "already signed in?
   redirect" check **against the database**, not in `proxy.ts`:
   a revoked-but-still-present cookie must not bounce a user off the page they
   need. `ClearStaleSession` quietly signs out a cookie the server no longer
   honours. Do not move that redirect into the proxy.

Session side-effects worth knowing: the JWT strategy means sessions can't be
revoked per-device (only wholesale via `sessionVersion`), and the
`signIn`/`signOut` **server actions** from `next-auth` are intentionally unused
because they are unreliable on Next 16 (nextauthjs/next-auth#13388) — the client
uses `next-auth/react`'s HTTP handlers instead.

## 6. Cart & wishlist — client state ownership rules

Both stores are Zustand + `persist` (localStorage) and carry an **`ownerId`**:
`null` = guest, otherwise the user id that owns the data. These rules are load
bearing — read `src/store/cart.ts` before touching them.

- **Guest cart is adopted on sign-in.** `setOwner(userId)` keeps the items when
  the cart was a guest cart. This is the `/checkout → /login?next=/checkout →
  /checkout` path: `CartSidebar` calls `setOwner` after `getSession()` on **every
  mount**, so a blanket wipe here empties the basket exactly when the customer
  signs in to pay. Don't reintroduce it.
- **A cart owned by a *different* account is wiped** when another account signs
  in on the same browser — one customer's basket must never leak to another.
- Sign-out (`src/components/auth/logout-button.tsx`) resets both the cart and
  wishlist stores before revoking the cookie.
- Cart lines are keyed `productId` or `productId:variantId`; `kcs-cart` is at
  persist `version: 3` with a `migrate` path for older shapes.
- The **guest wishlist is merged** into the account on sign-in
  (`mergeGuestWishlistAction`, `src/components/shop/wishlist-provider.tsx`);
  for signed-in users the database is the source of truth and items owned by
  another account are discarded.
- Prices/stock in the cart are display-only: `placeOrderAction` recomputes
  prices, shipping and tax server-side.

## 7. Data layer & conventions

- **Server Actions are the only write path.** No REST endpoints for mutations —
  the only API routes are `/api/auth/[...nextauth]`, `/api/uploads*` and the
  invoice PDF route.
- Actions validate with Zod (`src/lib/validations/**`), rate-limit where
  relevant (`src/lib/rate-limit.ts`, in-memory — swap for Redis when running
  multiple instances), return a typed `ActionResult<T>`
  (`{ ok, message, data?, fieldErrors? }`, see `src/types/index.ts`) and call
  `revalidatePath` for anything they touched. Views consume them with
  `useActionState` / `useTransition` and Sonner toasts.
- **Reads** go through `src/lib/queries/**` from server components; pass Prisma
  `Decimal`s as plain numbers by converting in the query layer, and keep the
  client boundary serialisable (bound server actions `action.bind(null, id)`,
  never inline closures).
- **Money & pricing**: listed prices are **GST-inclusive**; `Product.basePrice` /
  `baseMrp` denormalise the lowest quantity tier for sorting/filtering, while
  `ProductPrice` / `VariantPrice` rows are the source of truth.
  `pricingMode` is `SINGLE` (flat), `BULK` (MOQ + slab tiers) or `ENQUIRY`
  (quote-only, never enters the cart).
- **Shipping & tax**: weight + destination-zone quotes (`src/lib/shipping.ts`,
  `ShippingZone`/`ShippingRate`, free-shipping threshold in `StoreSetting`),
  inclusive-tax split in `src/lib/tax.ts`, GST invoices rendered with pdfkit
  (`src/lib/invoice-pdf.ts`, fonts/logo in `src/lib/invoice-assets/`).
- **Multi-vendor**: every product belongs to a vendor; checkout splits the cart
  into per-vendor sub-orders (`src/lib/sub-orders.ts`, `src/lib/order-mutations.ts`)
  with pro-rata discount allocation and derived parent status.
- **Style**: comments explain *why*, not *what* — the codebase documents
  non-obvious decisions in block comments, and several of those comments are
  regression notes. Match that voice; don't delete the reasoning.
- **UI**: use existing `src/components/ui` primitives and the design tokens in
  `globals.css` (`display`, `numeral`, `kicker`, `eyebrow`, `container`,
  `bg-surface`, brand colours) rather than inventing new ones.

## 8. Known documentation drift (fix if you touch these docs)

`README.md` is mostly accurate except its **Auth/Highlights** rows, which still
describe an older design — Argon2id hashing and opaque `kcs_session` tokens.
The code uses **bcryptjs** and **Auth.js JWT sessions**. README also links
`MULTIVENDOR.md` (not in the repo) and says `src/stores` (the real path is
`src/store`). This file (`AGENTS.md`) is the accurate one.
