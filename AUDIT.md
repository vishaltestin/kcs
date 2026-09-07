# KCS G-Mart — Production Audit & Improvement Plan

Audit date: 2026-09-06 · Scope: entire application (159 source files)

## Findings

### CRITICAL — Data isolation & correctness

| # | Finding | Location | Severity |
|---|---------|----------|----------|
| C1 | **Wishlist has zero user isolation** — Zustand store persisted to localStorage under one global key (`kcs-wishlist`). No DB table, no userId scoping. A's wishlist appears for B on the same browser. Also never cleared on logout. | `src/store/wishlist.ts`, `wishlist-button.tsx` | Critical |
| C2 | **Product card hover bug** — `ProductCarousel` sets `group` on the carousel root; `ProductCard` overlay uses `group-hover:`. Tailwind `group-hover` matches ANY hovered ancestor with `group` → hovering the carousel triggers every card's overlay simultaneously. | `carousels.tsx:24`, `product-card.tsx:44` | High |
| C3 | Cart store shares the same localStorage-isolation weakness as wishlist (global key, no clearing on logout). | `src/store/cart.ts` | High |
| C4 | Place Order + Submit Review need end-to-end verification (validation → DB → success states). | `actions/orders.ts`, `actions/reviews.ts` | High |

### ARCHITECTURE — Auth, admin, SEO

| # | Finding | Notes |
|---|---------|-------|
| A1 | Custom session auth instead of **Auth.js** (requested). Session table + hashed tokens currently works, but Auth.js is required: credentials provider, JWT sessions, avatar dropdown, `auth()` helper. | `lib/auth/session.ts` |
| A2 | **Admin uses dialogs for large tasks** — 468-line `product-form-dialog.tsx`, plus category/brand/blog dialogs. Required: dedicated pages `/admin/products/new`, `/admin/products/[id]/edit`, etc. | `components/admin/*` |
| A3 | Admin listings are plain tables — no **TanStack Table** (sorting, column visibility, faceted filters, bulk actions). | `app/admin/*/page.tsx` |
| A4 | Admin sidebar is custom — must use the **official shadcn Sidebar** (CLI). | `admin-sidebar.tsx` |
| A5 | Admin dashboard has no charts. Need **recharts**: revenue/orders trends, status breakdown, top categories, user growth. | `app/admin/page.tsx` |
| A6 | **No SEO fields** in schema (products/categories/blogs): metaTitle, metaDescription, metaKeywords, OG fields. `generateMetadata` exists on detail pages but only derives from title/introtext. | `prisma/schema.prisma` |
| A7 | Navbar shows "Hello, {firstName} Logout" prominently — replace with **avatar icon + dropdown menu**. | `navbar-client.tsx:172-199` |

### UI/UX — Polish

| # | Finding |
|---|---------|
| U1 | Toasts render top-center (`<Toaster richColors position="top-center">`) — move to bottom-right. |
| U2 | `cursor-pointer` missing on many interactive elements (buttons default to `cursor: default` in newer shadcn/Tailwind v4). Needs a global rule. |
| U3 | Cramped spacing across cards (`p-3` footers), sections, admin pages (`p-4` main), forms (`space-y-4`), tables. Needs systematic spacing scale: more padding, larger gaps, consistent radii/shadows. |
| U4 | Product card: `truncateText(name, 7)` + `min-h` hacks; overlay CTA duplicates mobile button; pricing hierarchy OK but badge/CTA spacing needs premium polish. |
| U5 | Admin form dialogs use native `<form action>` instead of RHF + Zod + shadcn Form (storefront forms already do). |
| U6 | `.product-card:hover img` / `.card-image:hover img` legacy CSS in globals.css conflicts with Tailwind-level hover control — consolidate. |

### What's already solid (preserve)

- Server Actions for ALL mutations, server-side data fetching, RSC-first pages
- Prisma 7 + MySQL (MariaDB driver adapter), strict TypeScript clean
- Zod validation + rate limiting on actions; ActionResult typed payloads
- Price recomputation server-side at checkout (never trusts client)
- Auth guards (requireAdmin/assertAdmin) on all admin surfaces
- Suspense skeletons, empty states, error pages

## Progress

- [x] **Phase 1 — Critical fixes & quick wins** (DONE, E2E-verified 2026-09-06)
  - [x] C1/C3: Wishlist is now DB-backed (`WishlistItem` table, `@@unique([userId, productId])`), strictly scoped by authenticated userId; guest localStorage wishlist merges into the account on sign-in (ownerId guard prevents cross-account merges); logout resets wishlist+cart stores; account-switch leakage impossible. Verified with 2 accounts.
  - [x] C2: Hover bug fixed with Tailwind named groups (`group/carousel`).
  - [x] C4: Place Order verified E2E — tier pricing recomputed server-side (₹689×60 + ₹899×12 = ₹52,128, free shipping ≥₹1,000), order-success page renders. Submit Review verified E2E — pending moderation → admin approves → public visibility; unapproved reviews never leak.
  - [x] U1: Toasts bottom-right + close button.
  - [x] U2: Global cursor-pointer rule.
  - [x] A7: Avatar + dropdown (Profile / Admin Console / Sign out) replaces "Hello, name".
- [x] **Phase 2 — Auth.js migration** (DONE, E2E-verified 2026-09-06)
  - [x] Auth.js v5 (`next-auth@5.0.0-beta.32`) with Credentials provider + JWT strategy. `src/lib/auth/config.ts` (edge-safe: no DB imports), `src/lib/auth/auth.ts` (authorize: bcrypt verify + emailVerified gate), `/api/auth/[...nextauth]` route, `src/types/next-auth.d.ts` (Session/JWT augmented with id+role; the `next-auth/jwt` import is load-bearing — without it the module augmentation silently no-ops).
  - [x] Login: RHF/zod form → `preLoginCheckAction` (rate-limit, schema, unverified-account gate, no user enumeration) → client `signIn("credentials", {redirect:false})` → full-page redirect to `?next=`. Server-action signIn/signOut NOT used (broken on Next 16, nextauthjs/next-auth#13388).
  - [x] `session.ts` rewritten on `auth()` (JWT id → fresh db.user lookup); `guards.ts` API unchanged. `proxy.ts` = `NextAuth(authConfig).auth` (JWT-validated, not just cookie presence; protected-prefix bounce with `?next=`, auth-page bounce for signed-in).
  - [x] Logout centralized in `useLogout` hook (signOut + cart/wishlist store reset) — navbar, mobile-nav, admin-header, profile-tabs all use it. `loginAction`/`logoutAction`/`signOutEverywhereAction` removed (stateless JWTs can't revoke other devices).
  - [x] Schema: Session model + User.sessions relation dropped (migration `20260906182048_drop_session_table`); seed demo-session row removed; SESSION_COOKIE/SESSION_TTL_DAYS constants removed; `AUTH_TRUST_HOST=true` added to .env/.env.example.
  - [x] E2E verified: providers/csrf/callback POST → authjs.session-token cookie; admin login → /admin 200; customer → /admin 307 /403; anon → /profile & /admin → /login?next=; authed → /login → /; wrong password → error=CredentialsSignin + session null; unverified user rejected at authorize AND gated by preLoginCheckAction with specific message (verify→login flow re-tested OK); forged/old kcs_session cookies ignored; wishlist toggle strictly per-user through new session (demo row owned by demo id; anon rejected); signout clears cookie; full page sweep 200s; authed navbar shows avatar dropdown, guest shows Sign in.
- [x] **Phase 3 — Admin overhaul** (DONE, E2E-verified 2026-09-06)
  - [x] Official shadcn Sidebar (radix-nova) with grouped nav, active state, collapsible, mobile sheet, sidebar_state cookie; TooltipProvider required app-wide (new radix-nova Tooltip throws without it — wrapped in root layout).
  - [x] recharts dashboard (5 charts: sales trend ComposedChart, orders by status, best sellers, catalogue by category, user growth) + KPI StatCards; Chart* wrappers from ui/chart with `var(--chart-N)` palette.
  - [x] Dedicated CRUD pages (no modals for large tasks): /admin/{products,categories,brands,blogs}/{new,[id]/edit} with Promise params, notFound() guards; old dialog components deleted.
  - [x] RHF+Zod+shadcn forms (product/category/brand/blog) — zodResolver with strictly-required schemas (z.input===z.output); slug auto-gen; ImagePicker; category checkbox tree; useFieldArray for prices/specs (number inputs NaN-guarded); manual management for primitive string arrays (RHF 7.87 useFieldArray rejects string[]); sticky footer; server parse helpers BUILD input only — validation via safeParse in actions (was: .parse() throwing 500s on invalid input — fixed).
  - [x] TanStack Table v9 listings for all 9 entities (products, categories, brands, blogs, orders, users, reviews, enquiries, messages, meetings, subscribers): features-first (dataTableFeatures shared in data-table/features.ts), global filter, column filters, sorting, row selection + bulk actions (ConfirmButton — ConfirmMenuItem can't render outside DropdownMenu), ActionSelect inline status dropdowns, DropdownMenu row actions.
  - [x] Validations refactor: all z.number() (no coerce), required fields, `url().or(literal(""))` for optional images, arrays/booleans explicit — server parse fns supply every field.
  - [x] E2E verified (server-action protocol via React's own encodeReply client): category create+invalid-input(fieldErrors)+update+delete; product create (2 price tiers, 2 specs, 3 categories, 2 gallery images w/ sortOrder) + edit-page prefill + update (prices replaced, specs cleared, flags toggled) + bulk delete (cascades); brand create+delete; blog create (content<50 & missing image rejected with fieldErrors) + delete; order status PENDING→SHIPPED→revert; enquiry/booking status round-trips; markMessageRead toggle both ways; user role promote/demote + verified toggle + self-delete guard; review approve/hide + revert; subscriber delete; customer/anon action calls blocked; all 20 admin routes 200 (engagement pages render full content, no error boundaries); storefront regression sweep all 200.
- [x] **Phase 4 — SEO fields** (DONE, E2E-verified 2026-09-06)
  - [x] Schema: `metaTitle` (70), `metaDescription` (165), `metaKeywords` (255), `ogImage` added to Product, Category, BlogPost (migration `20260906192052_add_seo_fields`); all nullable — NULL means "derive automatically".
  - [x] Validations: SEO block in product/category/blog schemas (strictly-required strings so z.input===z.output holds; max lengths match the column limits); empty strings → NULL via action data mappers (blogs got a `blogPostData` mapper; products/categories map inline).
  - [x] Admin: shared `SeoFields` card (src/components/admin/seo/seo-fields.tsx) rendered in product/category/blog forms — meta title/keywords inputs + meta description textarea with live character counters, OG image via ImagePicker; prefilled on edit pages via `getAdmin{Product,Category,BlogPost}ForEdit` (blog uses full model).
  - [x] Storefront: `generateMetadata` on product/category/blog detail pages uses metaTitle → name, metaDescription → introtext/excerpt → generic fallback, metaKeywords (comma-split), ogImage → main image → none; canonical URLs, OpenGraph (website/article + publishedTime + authors for blog), Twitter summary_large_image cards. `metadataBase` added to root layout (`NEXT_PUBLIC_SITE_URL` env override, defaults to https://kcsgmart.in).
  - [x] E2E verified: product/category/blog updates persist SEO fields (empty → NULL); storefront renders custom title/description/keywords/canonical/og/twitter tags; fallback chains verified on products/blogs without SEO values; og:image falls back to main image; metaTitle >70 chars rejected with fieldErrors; SEO section prefilled on all three edit pages and present on create pages; full admin+storefront sweep 200s. Seed drift from testing restored (Adidas brand/introtext/image/stock/flags, category image+sortOrder, blog cover).
- [x] **Phase 5 — Global polish & responsive pass** (DONE, verified 2026-09-07)
  - [x] U4: Product card redesigned — edge-to-edge image with Tailwind `group/product` zoom (no global CSS), pill discount/NEW badges, `line-clamp-2` names with fixed 2-line min-height (no `truncateText` word-count hack), price + strikethrough MRP + "Min. order N pcs · tiered bulk pricing" hint, single always-visible full-width View Details CTA (dark hover overlay + duplicate mobile button removed — no hover-dependent content), `shadow-sm → hover:shadow-lg` with subtle lift instead of heavy resting shadow; footer padding p-4; radix-nova Card defaults (py/gap/muted footer) explicitly zeroed for the edge-to-edge layout. Wishlist cards share the same treatment.
  - [x] U6: `.product-card:hover img` / `.card-image:hover img` / `.card-image img` legacy CSS removed from globals.css — all card hover/zoom now Tailwind-level via named groups (blog cards use `group/post:scale-105`).
  - [x] U3: Spacing/typography pass — home rhythm gap-16/24 + SectionHeader (pb-4, mb-6/8, tracking-tight, animated view-more arrow, centered variant mb-8/10 + text-4xl on md); product/detail pages py-8→py-10/12 and gap-8→gap-10/12 on md; admin shell p-4/6/8 + PageHeader mb-6/8 with tracking-tight; blog listing/carousel excerpts now line-clamp (full text in DOM); promo tiles gap-6, rounded-lg, frosted CTA; "most trusted" strip lost its `w-[88.5%]` magic width (container-aligned, roomier padding, uppercase tracking header).
  - [x] Responsive verification — mobile nav carries full navigation; DataTables scroll horizontally (`overflow-x-auto` + min-w) instead of hiding columns; grids all have mobile-first breakpoints (cart/checkout lg:3, forms md:2, footer md:4); no fixed pixel widths or unscalable headings found; `truncateText` util removed entirely (CSS line-clamp everywhere).
  - [x] Verified on production build: home/product/category/blog/cart/wishlist/admin sweeps all 200; new card markup present in SSR output (24 cards on /product with badges, MOQ hints, CTAs); old artifacts (bg-black/50 overlay, border-2 rounded-t-2xl, w-[88.5%], resting shadow-lg, ellipsis truncation) confirmed gone.

## Implementation plan (phased)

1. **Phase 1 — Critical fixes & quick wins**: C1/C3 wishlist+cart isolation (DB-backed wishlist, merge-on-login, clear-on-logout), C2 hover bug, U1 toasts, U2 cursor, A7 avatar dropdown, C4 E2E verification of order + review flows.
2. **Phase 2 — Auth.js**: credentials provider + JWT sessions, `auth()` helpers, SessionProvider, keep argon2 verify + email-verification flow, migrate guards/proxy.
3. **Phase 3 — Admin overhaul**: shadcn Sidebar, dedicated CRUD pages (products/categories/brands/blogs), TanStack Table listings, recharts dashboard.
4. **Phase 4 — SEO**: schema fields + migration + admin form fields + generateMetadata wiring.
5. **Phase 5 — Global polish**: spacing/typography pass, product card redesign, responsive verification at all breakpoints.

## Round 2 — Bug fixes, premium UI/UX pass & image uploads (2026-09-07)

### Bugs fixed
- [x] `db.wishlistItem.findMany` undefined — root cause: node_modules reinstall without `prisma generate` (stale client missing the model). Fixed + `postinstall: prisma generate` added to package.json so it can't recur. Wishlist toggle/listing verified working.
- [x] `<li>` inside `<li>` hydration error — admin breadcrumb rendered `BreadcrumbSeparator` (an `<li>`) INSIDE `BreadcrumbItem` (also `<li>`) on every admin page. Separator moved to a Fragment sibling; verified clean via DOM parser on all admin routes.
- [x] Image aspect-ratio warnings — why-us page declared 600×400 props but intrinsic ratios differ (770×438, 473×316, 220×220, 834×443) with only `w-full` CSS → "either width or height modified" warning. Converted to `fill` inside `aspect-[3/2]` containers. Home grid tiles' declared dims corrected to actual (750×656 / 750×317).
- [x] **Place order was silently broken on the client** — `items` (z.array().min(1)) was part of the schema wired into the checkout RHF resolver but never registered as a form field → validation always failed → Place Order button did nothing. Added `checkoutFormSchema` (omit items; server still validates the full payload). Server action + order-success verified E2E.
- [x] Form loading states audited — only submit buttons/disabled steppers show pending state; no full-page blockers.

### UI/UX pass (premium)
- [x] Control heights raised globally: Button default h-8→h-10 (sm h-9, lg h-11, icon size-10), Input h-8→h-10 + px-3.5, Textarea min-h-24, Select trigger h-10; FormItem gap 2.5; Card default spacing scale 4→5.
- [x] Product card redesigned: quick-add button (slides up on hover, always visible on touch) with cart-store integration + toast, BESTSELLER badge, stronger hover lift + image zoom, refined footer.
- [x] Product detail page: sticky purchase panel (lg), SKU/stock/brand chips, price block with per-piece tier hint + savings badge, 4 trust badges (pan-India/GST/quality/manager), structured delivery card, reviews section with rating summary + 2-col grid + empty state.
- [x] Cart sidebar redesigned: header with count + clear, item cards with thumbnails + per-row steppers, free-shipping progress bar (₹1,000 threshold), subtotal/shipping/total breakdown, primary CTA + trust line.
- [x] Profile page redesigned: gradient hero card with avatar initials + stats (orders, lifetime spend), vertical account nav on desktop (scrollable pill tabs on mobile), order rows link to order detail, sign-out in nav, polished empty state.
- [x] Blog detail: author avatar + read-time meta bar, rounded hero with shadow, prose polish, CTA footer card, related cards with zoom + line-clamp.
- [x] Footer redesigned: 3-item trust strip (pan-India/quality/responses), 12-col layout (brand + contact + socials / Company / Shop / Account / newsletter card with payment icons), bottom bar.
- [x] "Most Trusted" strip: card-style charcoal banner, amber eyebrow, responsive 3/5/9-col grid of icon tiles with hover lift + primary fill (no more cramped overflow scroll).
- [x] Responsive pass: all grids mobile-first; trust strip + footer + profile nav verified at sm/md/lg classes; no fixed-width offenders.

### Image uploads
- [x] `POST /api/uploads` — admin-only (session-checked), 5 MB limit, JPG/PNG/WebP/AVIF/GIF whitelist, randomised filenames, stored in `public/uploads/`.
- [x] `GET /api/uploads/[...path]` — serves uploads with correct content-type + immutable cache; path traversal blocked.
- [x] ImagePicker upgraded with Upload tab (drag-drop + preview + "Upload & use"); verified: admin upload 200, customer/anon 403, bad type 415, optimizer serves uploaded paths.

### Verified on production build
- [x] DOM li-in-li scan clean on all admin routes; full storefront+admin sweep 200s; place order E2E (tier pricing correct); server log clean.
