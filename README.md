# KCS G-Mart — Corporate Gifting E-Commerce

A modern rebuild of the KCS G-Mart storefront (corporate gifting, bulk pricing,
branded merchandise) with Next.js App Router, TypeScript, Prisma + MySQL and
shadcn/ui. All mutations run through **Server Actions** — no REST endpoints, no
client-side API fetching for writes.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![Prisma](https://img.shields.io/badge/Prisma-7-orange)

## Highlights

| Area | Implementation |
| --- | --- |
| **Framework** | Next.js 16 (App Router, Turbopack, RSC-first) |
| **Language** | TypeScript (`strict`) end to end |
| **Database** | MySQL / MariaDB via Prisma 7 (driver adapter `@prisma/adapter-mariadb`) |
| **Mutations** | React Server Actions only (`src/actions/**`) — with Zod validation, rate limiting and typed `ActionResult` payloads |
| **Forms** | React Hook Form + Zod resolver on the storefront; native `<form action={serverAction}>` + `useActionState` in the admin module |
| **UI** | shadcn/ui (CLI-installed, `src/components/ui`), Tailwind CSS v4 |
| **Auth** | Custom session auth — Argon2id password hashing (via `argon2`), SHA-256 hashed opaque session tokens in HttpOnly cookies, role-based guards (`USER` / `ADMIN`) |
| **Data fetching** | Server components query Prisma directly (`src/lib/queries/**`) |
| **State** | Zustand stores for cart & wishlist (persisted, synced to the server on login) |

## Getting started

### Prerequisites

- Node.js 20+
- MySQL 8 or MariaDB 10.6+ running locally (the bootstrap script installs
  MariaDB on Debian/Ubuntu if it's missing)

### One-shot setup

```bash
./scripts/bootstrap.sh        # deps → MariaDB → DB → migrations → seed → build
./scripts/bootstrap.sh --dev  # same, skip the production build
./scripts/bootstrap.sh --reset-db  # wipe + re-seed the database
```

### Manual setup

```bash
npm ci
cp .env.example .env          # then edit DATABASE_URL + AUTH_SECRET
npx prisma migrate deploy     # apply migrations
npx prisma generate           # generate the client
npx tsx prisma/seed.ts        # demo catalogue, users, orders, reviews…
npm run dev                   # http://localhost:3000
```

### Demo logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@kcsgmart.in` | `Admin@12345` |
| Customer | `demo@kcsgmart.in` | `Demo@12345` |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build (in-process Turbopack, tuned for low-RAM machines) |
| `npm run start` | Serve the production build |
| `npx prisma studio` | Browse the database |
| `npx tsx prisma/seed.ts` | Re-seed demo data |

## Project structure

```
src/
├── actions/            # "use server" modules (the only write path)
│   ├── admin/          # products, categories, brands, blogs, engagements…
│   ├── auth.ts         # login / signup / verify / logout
│   ├── enquiries.ts    # bulk enquiries, contact messages, newsletter
│   ├── orders.ts       # checkout (placeOrderAction)
│   └── profile.ts      # profile, company, address, password updates
├── app/
│   ├── (shop)/         # storefront: home, product, category, cart, checkout,
│   │                   # wishlist, profile, blog, about, why-us, contact, 403
│   ├── (auth)/         # login, signup, verify/[token]
│   └── admin/          # protected admin module (dashboard + 11 CRUD sections)
├── components/
│   ├── admin/          # admin-only client components (dialogs, row actions…)
│   ├── auth/ forms/    # auth forms, public forms (enquiry, review, meeting…)
│   ├── home/ shop/     # marketing sections, catalogue components
│   ├── layout/ shared/ # header, footer, cart sidebar, cards, skeletons…
│   └── ui/             # shadcn/ui primitives (CLI-generated)
├── lib/
│   ├── auth/           # session management, password hashing, guards
│   ├── queries/        # server-side data fetching (catalog, content, admin…)
│   ├── validations/    # Zod schemas shared by actions and forms
│   ├── constants.ts utils.ts rate-limit.ts form.ts
│   └── db.ts           # Prisma client (driver adapter singleton)
├── stores/             # Zustand cart/wishlist stores
└── types/              # shared TypeScript types (ActionResult, views…)
prisma/                 # schema, migrations, seed
public/images|video     # catalogue imagery (served through next/image)
```

## Key design decisions

- **Server Actions for every mutation** — login, checkout, admin CRUD, reviews,
  newsletter… nothing writes through API routes. Actions revalidate affected
  paths via `revalidatePath` and return a typed `ActionResult` consumed by
  `useActionState` or `useTransition` with Sonner toasts.
- **Session auth, not JWT** — opaque 64-char tokens (SHA-256 at rest) in a
  `kcs_session` HttpOnly cookie. `proxy.ts` (Next 16's middleware) bounces
  anonymous traffic cheaply; authoritative role checks run in the admin layout
  and in every admin action (`requireAdmin`).
- **Denormalised first price tier** — `Product.basePrice` / `baseMrp` mirror the
  lowest-quantity tier so listing sort & price filters never need aggregate
  joins. The tier table remains the source of truth; create/update actions keep
  the copy in sync.
- **Serialisable admin payloads** — Prisma `Decimal`s are converted in the
  query layer (`toAdminProduct`) so client dialogs receive plain JSON-safe
  objects. Server actions are passed to client components as bound references
  (`action.bind(null, id)`), never inline closures.
- **URL-driven catalogue state** — filters, sort, search and pagination live in
  the querystring; every catalogue page is server-rendered and shareable.
- **Rate limiting** — in-memory sliding-window limiter keyed by client IP for
  auth, enquiry and review actions.

## Admin module

`/admin` (ADMIN role only) covers: dashboard (revenue, orders, engagement
stats), products (tiered pricing, specs, gallery, flags), categories (nested),
brands, orders (status workflow + detail view), enquiries, meeting bookings,
contact messages, blog posts, users (roles, verification), reviews (approval
queue) and newsletter subscribers.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | `mysql://user:password@host:3306/kcs_gmart` |
| `AUTH_SECRET` | Secret used to derive session token hashing pepper |
| `NEXT_PUBLIC_APP_URL` | Canonical URL used in emails/links |

> `prisma.config.ts` (Prisma 7) reads `DATABASE_URL` via `dotenv`; the client
> uses the MariaDB driver adapter, so `serverExternalPackages` keeps
> `@prisma/client` / `mariadb` external to the server bundle.
