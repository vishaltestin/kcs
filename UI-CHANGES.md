# KCS G-Mart — UI Enhancement Summary

Scope: premium storefront restyle across every component, same brand palette
(#C31C18 red · #B91C1C deep red · #444444 charcoal · #FCB819 amber · #42A2FF blue),
same page structure. **60 files changed, 4 new.** No routes, data contracts or URL
params were altered.

## The place-order bug (fixed)

**Symptom:** clicking *Place Order* made the whole page flash to a skeleton.

**Root causes**
1. `checkout-form.tsx` dispatched the server action from RHF's `onSubmit` outside a
   React transition, so `isPending` was unreliable and React treated it as a blocking update.
2. On success, `router.push('/order-success/…')` triggered the shared `(shop)/loading.tsx`
   full-page skeleton.

**Fixes**
- Dispatch wrapped in `startTransition`; new `isRedirecting` state keeps the button in
  its busy state ("Placing your order…" → "Order placed — opening confirmation…") and the
  form `fieldset` disabled until the success page takes over.
- Dedicated lightweight `order-success/[orderNumber]/loading.tsx`.
- Same `startTransition` pattern applied to all other RHF + `useActionState` forms
  (login, signup, review, enquiry, contact, meeting, 4 profile forms).

Verified with Playwright (`/home/user/shots/order.mjs`): during a throttled submit the URL
stays on `/checkout`, the form stays rendered, no skeleton appears, only the button changes.

## Design system (src/app/globals.css)

- oklch palette + brand tokens (`bg-brand-charcoal`, `text-brand-amber`, `bg-success` …)
- Utilities: `eyebrow`, `hairline`, `dot-grid`, `no-scrollbar`, `scrollbar-thin`,
  `container` (1400px), `animate-fade-up`, `animate-ring`, marquee; `prefers-reduced-motion` respected
- Card idiom: `rounded-2xl bg-card ring-1 ring-foreground/[0.07]` + hover lift/shadow
- Dark panels: charcoal + dot-grid + blurred red glow; amber eyebrows on dark
- Buttons: new `dark` / `glass` variants and `xl` size; every submit shows a busy label

## What changed, by area

| Area | Highlights |
|---|---|
| Navbar / mega menu | Utility strip with USPs, pill search with `/` shortcut + live suggestions, mega menu with category columns + festive promo tile, active trigger state, compact mobile brand row (logo · wishlist · cart · menu), mobile promo strip |
| Cart drawer / mobile nav | Sheet-based, item rows with qty steppers, free-shipping progress, clean nav sheet with welcome card |
| Home | Hero grid with charcoal "trusted partner" panel + 9 quick categories, value strip, category/feature/bestseller carousels with circular arrows, video section, testimonials, dark CTA |
| Product card | Discount / NEW / BESTSELLER badges, MOQ chip, wishlist heart, hover quick-add bar on desktop, compact quick-add button on mobile, "You save" line |
| Listing / category | Header band with breadcrumb + count pill, sticky filter sidebar, pill filter chips, sheet filters on mobile, circular pagination |
| PDP | Gallery with lightbox, "Starting at" price card with % off + You save, bulk pricing slab table with "9% lower" badges and upsell nudge, ringed trust badges, WhatsApp CTA, specs, reviews with rating tile, star-picker review form, "Pairs well with" grid |
| Cart / Checkout / Order success | Numbered icon-badge sections, sticky order summary, step indicator, secure pill, status timeline on confirmation, support card |
| Account (`/profile`) | Charcoal hero with avatar + stats (orders / in-progress / spent), sticky side-nav, `ProfilePanel` cards with footer action bar for Account · Company · Addresses · Security, status-chip order list; `?tab=` deep links; `Suspense`-wrapped |
| Dialogs | Bulk enquiry (charcoal perks aside + form), Book a meeting (image aside + 3-step date/time/details flow) |
| Auth | `rounded-3xl` cards in a split layout, busy submits |
| Content pages | About / Why-us / Blog / Contact / Wishlist restyled; `StatusPage` for 404 / error / 403 |
| Blog detail (`/blog/[slug]`) | Editorial header band (eyebrow, big title, author avatar, date, read time), hero image, drop-cap article body, sticky charcoal "Put it into practice" aside with quote + book-a-meeting CTAs, "Why teams choose KCS" card, share row, related posts |
| Admin console | Shared `PageHeader` / `Panel` / `StatCard` / `StatusBadge` primitives (`components/admin/ui.tsx`); charcoal sidebar brand block + grouped nav with red active state + "View storefront" footer button; sticky header with breadcrumb, avatar chip and store link; dashboard with dated eyebrow, charcoal "Needs attention" strip (amber eyebrow, pill links), glowing KPI tiles, gradient area/bar sales trend, donut with centre total + rounded segments; data-table shell with tracked uppercase heads, ringed panel, pill pagination; `Card` lift scoped via `[data-slot="sidebar-inset"]` in `globals.css` |
| Footer | Newsletter card with success state, payment icons |

## Edge-case hardening (functional, not visual)

| Where | Fix |
|---|---|
| Listing URL params | `?cats=` / `?brands=` keep only positive safe integers (previously `?brands=abc` or `?brands=1e99` threw a Prisma validation error → 404 page); `?page=` is finite/≥1/≤10000 on product, blog and category listings |
| `getFilteredProducts` / `getBlogPosts` | Defensive id filtering + search trimmed to 100 chars + `perPage` capped; out-of-range `?page=999` now snaps to the last real page (was "Showing 11977–43 of 43") |
| PDP add-to-cart | Quote-only products (₹0 price) can't be added — button shows "Price on request"; typed quantity sanitised (NaN / 0 / decimals → valid MOQ multiple) |
| Cart store | `addProduct` / `updateQuantity` clamp to finite integers ≥ MOQ |
| `placeOrderAction` | Merges duplicate product lines, falls back to `basePrice` when no tiers, rejects ₹0 items ("available on enquiry only"), enforces MOQ from the lowest tier server-side, retries on `orderNumber` unique-collision and returns a friendly failure instead of a 500 |

Verified with curl against `next start`: 20 anonymous routes + 23 authenticated admin/shop routes all render without error pages; bad ids/slugs show the branded not-found page; anonymous checkout/profile/admin redirect to `/login?next=…`; XSS in `?q=` is escaped.

## Quality gates

- `tsc --noEmit` → clean
- `next lint` → **0 errors** (was 7 pre-existing errors; remaining 17 warnings are pre-existing `next/image` advisories)
- `next build --webpack` → compiles, all routes
- Playwright screenshots at 1440 and 390 for home, listing, PDP, cart, checkout, order success, profile, dialogs, mega menu, mobile nav, blog detail, admin dashboard / orders / new product (`/home/user/shots/after-*.png`; `before-*.png` for comparison)

## Not done / notes

- Changes are uncommitted in the working tree (`git status`), as requested.
- Admin inner forms (image picker, rich editors, action selects) keep their stock shadcn look — they inherit the new tokens/buttons but their internals were not redrawn. Carousel arrow buttons are stock.
- `notFound()` inside a dynamic page (bad product/blog/category slug) renders the branded 404 with HTTP 200 — Next.js streaming behaviour, unchanged from the original.
- The `N` badge overlapping some screenshots is the Next.js dev indicator, not part of the UI.
