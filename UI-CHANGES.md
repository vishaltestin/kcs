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

## Round 3 — feedback fixes

| # | Feedback | What changed | Where |
|---|----------|--------------|-------|
| 1 | "Received NaN for the `value` attribute" in admin add-product | `NumberField` keeps a string draft while typing (so `749.` / empty / `-` never becomes `NaN`) and emits `undefined` when empty so zod's "required" message shows instead. No refs read during render (React Compiler lint clean). | `src/components/admin/number-field.tsx`, used by product / brand / category forms |
| 2, 3 | Gallery images only accepted typed paths; wanted a better upload experience | New drag-and-drop `ImagePicker` (main image) and `GalleryUploader` (multi-file, up to 12, XHR progress bar, thumbnails, drag-to-reorder-free "Star to make main", remove/clear). Files still live on local disk (`public/uploads`) — no external service. Server pipeline: `sharp` auto-rotate, strip metadata, cap at 1600 px, convert to WebP q82 (animated GIF kept). Accepts JPG/PNG/WebP/AVIF/GIF ≤ 12 MB. | `src/components/admin/image-picker.tsx`, `src/app/api/uploads/route.ts`, `product-form.tsx` Images card |
| 4 | Some products have no bulk pricing | Per-product **pricing mode**: `SINGLE` (one flat unit price, order from 1 pc), `BULK` (existing tiers / MOQ / slab table) or `ENQUIRY` (no public price). Admin form shows three radio cards and adapts the tier editor; the server normalises tiers per mode. Storefront: single → plain price, qty from 1, no slab table or MOQ chip; enquiry → "Price on request" panel with **Request a quote** + WhatsApp, no cart button; cards show "from ₹ / pc" only for bulk. `placeOrder` rejects enquiry products. Seed demos: `borosil-trek-steel-bottle` (single), `diwali-prestige-gift-hamper` (enquiry). | `prisma/schema.prisma` (+ migration `add_pricing_mode`), `src/lib/validations/admin.ts`, `src/actions/admin/products.ts`, PDP components, `product-card.tsx`, `products-table.tsx`, `prisma/seed.ts` |
| 5, 6 | Cart sidebar too busy; remove "You've unlocked free shipping 🎉" | Sidebar reduced to: line items (thumb, name, qty stepper, line total), subtotal, two buttons. Free-shipping progress bar and the celebratory banner removed from the sidebar **and** the cart page. Shipping is still shown as a plain row at checkout. | `src/components/layout/cart-sidebar.tsx`, `src/app/(shop)/cart/page.tsx` |
| 7 | Category page: distinguish parent vs child | Each parent is a "trunk" card (image, name, count, View all) with its sub-categories on a dashed tree branch to the right (connector lines + icon tiles). Top jump-list of parents with child counts. Special categories keep the tile layout. | `src/app/(shop)/category/page.tsx` |
| 8 | Search can't find categories | `searchSuggestions` now returns products **and** matching categories and brands. The header suggestion panel has a Products column plus a Categories list (→ category page) and Brand chips (→ filtered listing). Result prices respect pricing mode. | `src/lib/queries/catalog.ts`, `src/actions/search.ts`, `navbar-client.tsx` |
| 9 | Blurry images | `next.config.ts`: `qualities [75, 85, 90]`, AVIF+WebP, denser `deviceSizes` / `imageSizes`, 30-day cache. Cards/carousels render at q85, PDP gallery + lightbox at q90 with accurate `sizes` so the browser fetches the right width instead of upscaling a small variant. New uploads are stored at up to 1600 px. **Note:** the bundled seed photos are themselves small (all 68 product images are 500×500, banners 581×511), so they can only get so sharp — re-uploading higher-resolution originals through the new pipeline is the real fix. | `next.config.ts`, `product-card.tsx`, `product-gallery.tsx`, `carousels.tsx` |
| 10 | Sticky header with slide-in | Desktop: once you scroll past 160 px the nav row sticks and slides in a condensed strip (small logo, search button, cart with total); reverts under 120 px (hysteresis, rAF-throttled, no layout thrash). Mobile: brand row is sticky. The `<nav>` wrapper is `display: contents` so `position: sticky` works against the viewport. `/` focuses search (typing-aware). Suggestions panel sits above the sticky bar. | `src/components/layout/navbar-client.tsx` |
| 11 | Toasts look odd | Replaced dark/green `richColors` toasts with a light branded card: white surface, 3 px left accent (red / green / amber / blue), icon tile, title + description, top-right. | `src/components/ui/sonner.tsx`, `.kcs-toast*` in `globals.css` |
| 12 | Favicon | **Deferred** at your request. | — |
| 13 | FAQ page missing | New `/faq`: banner hero, sticky topic nav + contact card, 5 sections / 23 Q&As in accordions (first open), FAQPage JSON-LD, closing CTA (contact + WhatsApp). Linked from top bar, footer and mobile nav (was `/#faq`). | `src/app/(shop)/faq/page.tsx`, `src/lib/faq.ts`, `src/components/shared/faq-accordion.tsx`, footer / mobile nav |

Round 3 gates: `tsc` clean · `eslint` 0 errors (17 pre-existing warnings) · `next build --webpack` OK · probe 20/20 + `/faq` · end-to-end upload test (2400×1800 PNG → 1600×1200 WebP, 11 KB) · admin new-product form with empty/partial prices → no console warnings.

## Round 4 — invoices, courier tracking, variants, weight-based shipping

Everything below is server-authoritative: the client only *previews* prices/shipping, `placeOrderAction` recomputes prices, MOQ, stock, weight, zone, shipping and GST from the database before writing the order.

### Deploy checklist

1. `npx prisma migrate deploy` — migration `20260908120000_variants_shipping_invoices` (new tables `ProductOption`, `ProductVariant`, `VariantPrice`, `ShippingZone`, `ShippingRate`, `StoreSetting`; new columns on `Product`, `Order`, `OrderItem`). Existing rows are safe: products default to `gstRate 18`, `hasVariants false`; orders keep working and get an invoice number lazily on first download.
2. `npm install` — new dependency `pdfkit` (+ `@types/pdfkit`). `next.config.ts` lists it in `serverExternalPackages` (it reads font metrics from disk; bundling breaks it).
3. Fonts for the PDF are checked in at `src/lib/invoice-assets/` (DejaVu Sans, has the ₹ glyph) with the logo — no system fonts needed.
4. Fresh demo data: `npx prisma db seed` (wipes and reseeds; now includes store settings with sample GSTIN `07AAACK1234A1Z5`, 7 zones, 4 apparel products with 70 colour × size variants, 5 demo orders — 2 shipped with courier data, all invoiced).
5. In **Admin → Shipping & Tax**, replace the sample seller details (legal name, GSTIN, PAN, address, state) with the real ones before going live — they print on every invoice.

| # | Requirement | What changed | Where |
|---|-------------|--------------|-------|
| 1 | Invoice for every order, with and without GST | **Tax model:** prices are GST-inclusive; each product has an HSN code and GST rate (0/5/12/18/28, default 18). At order time every line is back-calculated (`taxable = total / (1 + rate)`) and snapshotted on `OrderItem` (`hsnCode`, `gstRate`, `taxAmount`). Place of supply = GSTIN state code if a GSTIN is given, else billing state; same state as the seller → **CGST + SGST**, otherwise **IGST**. Shipping is taxed as SAC 996812 @ 18 %. Order stores `taxableAmount / cgst / sgst / igst / placeOfSupply / invoiceNumber / invoicedAt`. **Invoice numbers** are sequential per financial year (`KCS/INV/26-27/000001`), allocated inside the order transaction from `StoreSetting.invoiceCounter` (prefix editable). **PDF:** A4, branded header with logo, "TAX INVOICE" (B2B, GSTIN shown) vs "INVOICE" (B2C), bill-to / ship-to, item table with variant + SKU + HSN + rate + taxable + tax split + total, **HSN-wise tax summary**, totals, amount in words, declaration + signatory. Endpoint `GET /api/orders/{orderNumber}/invoice` (`?download=1` for attachment) — owner or admin only (401/403), 409 for cancelled orders. Legacy orders without tax data are rendered as B2C with the 18 % default and numbered on first download. **Buttons:** order-success page (View / Download), profile → My Orders (per order), admin order list (icon) and admin order detail (header). | `src/lib/tax.ts`, `src/lib/invoice.ts`, `src/lib/invoice-pdf.ts`, `src/app/api/orders/[orderNumber]/invoice/route.ts`, `src/actions/orders.ts`, `order-success/[orderNumber]/page.tsx`, `profile-tabs.tsx`, `admin/orders/*` |
| 2 | Courier info on SHIPPED, visible to the customer | Admin order detail has a **Shipment & courier** panel: courier (datalist of 12 Indian couriers + free text), AWB/tracking number, expected delivery date, note for the customer, optional tracking link (auto-built from the courier's tracking URL template when left blank — preview shown live), "Mark order as Shipped" toggle (sets status + `shippedAt`; DELIVERED stamps `deliveredAt`). Order list shows a Shipment column (courier + AWB, or an "Add courier" shortcut). **Customer:** order page gets a charcoal tracking card (courier, copyable AWB, dispatched / expected / delivered dates, service zone + weight, note, **Track shipment** button) and a placeholder before dispatch; profile order rows show courier · AWB · ETA · Track link. | `src/components/admin/orders/shipment-form.tsx`, `src/lib/couriers.ts`, `src/actions/admin/engagements.ts` (`updateShipmentAction`), `orders-table.tsx`, `order-success` page, `profile-tabs.tsx`, `src/components/shared/copy-button.tsx` |
| 3 | Product variants (colour & size) | **Model:** `ProductOption` (axes: name + ordered values) × `ProductVariant` (attributes JSON, label "Black / L", own **SKU**, **stock**, **image**, **price tiers** (`VariantPrice`), optional weight/dimension overrides, active flag). **Admin:** Variants card with a switch → option axes builder (chip input, Enter/comma/paste, presets for Colour/Size/Material/Capacity with suggested values, colour swatches) → "Generate / Refresh variants" (Cartesian product; regenerating keeps SKUs, stock and prices already entered) → table with active checkbox, SKU, stock, price/MRP (single mode) or tier chips (bulk mode), weight; expand a row for the image picker, full tier editor with **Copy to all variants**, and L×W×H overrides. Validation: unique SKUs (also across products), ≥ 1 active variant, tiers per active variant, MOQ rules per pricing mode. Product-level stock/base price mirror the variants for listings. Variants are upserted by id so carts and past order lines keep their reference. **Storefront:** PDP shows option pills (swatches for colours, struck-through when no in-stock combination), "Select your options" until complete, then the variant's price, tiers, SKU, stock and image; cart lines carry `variantId` + label + SKU (cart store v2 migrates old carts); cards show "from ₹…" for variant products; order items store `variantId / variantLabel / sku`. Seed: Adidas tee (4 colours × 5 sizes, one out-of-stock, one inactive, XXL +₹30), Puma polo, uniform polo, jacket-hoodie combo. | `prisma/schema.prisma`, `src/lib/variants.ts`, `src/components/admin/products/variants-editor.tsx`, `product-form.tsx`, `src/actions/admin/products.ts`, `src/lib/queries/admin.ts`, `src/components/shop/variant-selector.tsx`, `product-actions.tsx`, `src/store/cart.ts`, `product-card.tsx`, `src/lib/queries/catalog.ts` |
| 4 | Weight & dimensions → shipping cost | **Per product** (and optionally per variant): packed weight (g) and L×W×H (cm). Chargeable weight per unit = max(actual, volumetric = L×W×H ÷ divisor × 1000 g) — the admin form shows the live chargeable weight while typing. **Rate card:** `ShippingZone` (code, name, list of states/UTs, ETA, active) with `ShippingRate` slabs (up to N g → ₹) and a per-zone surcharge per extra 500 g above the last slab; `StoreSetting` holds the free-shipping threshold and volumetric divisor. Seeded zones: Delhi NCR, North, West & Central, South, East, North-East & Islands, Rest of India (catch-all). Destination state (shipping address, or billing when "same") → zone → slab. **Admin → Shipping & Tax:** zones comparison table (all slabs side by side, enable/disable/delete, add zone) with an edit dialog (state multiselect that shows which zone currently owns each state and rejects overlaps, slab editor, surcharge, ETA) plus the seller/invoice settings form (legal name, GSTIN, PAN, state of supply, address, contacts, invoice prefix with next-number preview, free-shipping threshold, divisor). **Storefront:** cart page and checkout show a live estimate (zone, chargeable weight, ETA, "free above ₹X" hint) that updates as the state is typed (states datalist added); order stores `shippingZone / chargeableWeight / shippingMethod` and prints them on the order page and invoice. Top-bar copy now reads the threshold from settings. | `src/lib/shipping.ts`, `src/lib/queries/shipping.ts`, `src/actions/shipping.ts`, `src/actions/admin/shipping.ts`, `src/app/admin/shipping/page.tsx`, `src/components/admin/shipping/*`, `shipping-estimate-row.tsx`, `use-shipping-estimate.tsx`, `checkout-form.tsx`, `cart/page.tsx`, `navbar.tsx` |

Also: admin breadcrumb no longer links record-id segments (was a 404 prefetch); admin products table shows a variant count badge and "∞" for untracked stock; `product-actions` import path fix.

Round 4 gates: `tsc` clean · `eslint` 0 errors (17 pre-existing warnings) · `next build --webpack` OK · probe 20/20 · Playwright end-to-end: variant selection → cart (2 variants of one tee) → checkout with GSTIN + Karnataka → order placed (IGST, invoice #) → PDF 200/`attachment` (1 page, B2B) · B2C Delhi order (CGST+SGST, ₹49 Delhi NCR slab for 422 g) → PDF · anonymous → 401 · cancelled → 409 · admin shipment form → SHIPPED + tracking visible on customer order page and profile · zone edit (add slab) persists · settings save persists · admin edit of a variant product (add 3XL → refresh → 25 variants → save → stock persists → PDP shows new stock).

## Round 5 — storefront redesign, 1280 px fixes, admin form fixes

### Bug fixes (admin)
- **Numeric inputs ate digits** (`NumberField`): typing into a number box emitted `undefined`, so react-hook-form snapped the field back to its default and the draft was lost. Rewritten: the focused draft is authoritative, the form value is only re-synced on blur, and an empty box emits `emptyValue` (`undefined` → zod "required", or `null` for nullable dimensions). Verified in the browser on product price/stock/weight fields and the variants table.
- **Variant products could not be saved** without a clear reason: nested zod errors were reported against collapsed rows and hidden. The product form now has an `onInvalid` handler (toast "Can't save yet" + `Section › row N › field: message` + scroll to the offending section), the variants table shows the first problem per row plus a summary, and the server action returns `validationFailure` with path pointers.

### Variant pricing modes (`Product.variantPricing`)
- **SHARED** (default for new products): the product's price list applies to every variant, optionally shifted per variant by `ProductVariant.priceDelta` (₹; MRP shifts too). Admin table shows "Adjust ₹" + "Effective price" per variant.
- **CUSTOM**: each variant keeps its own price tiers (falls back to the product tiers when empty) — this is the Round-4 behaviour. "Copy to all variants" helper retained.
- One resolver (`resolveVariantTiers` in `src/lib/variants.ts`) is used by the storefront mapper, order placement and the admin save, so the PDP, cart, order and invoice always agree.
- **Deploy:** run `prisma migrate deploy` (migration `20260911080000_variant_shared_pricing`). Existing variant products are migrated to **CUSTOM**, so their current price tables are untouched; new products default to **SHARED**.

### Storefront redesign (every `(shop)` page + shared/layout components; admin untouched)
Feedback was that the Round 1–4 look read as generic: the same eyebrow-label + rounded card with a hairline ring + charcoal dot-grid panel + pill chips repeated on every page. Round 5 keeps the brand colours, page structure and content, and replaces the repeated patterns with an editorial system:
- **Type**: Fraunces (variable optical size, `--font-display`) for headlines, prices and folio numbers; Plus Jakarta Sans stays for UI/body. New utilities in `globals.css`: `display`, `kicker` (italic serif lead-in that replaces the eyebrow), `numeral` (tabular serif figures), `rule-top` (hairline with a short red tick), `studio` (warm neutral product backdrop).
- **Layout language**: cards are replaced by hairline-divided lists, numbered folios (`01`, `01.2`), sticky "Contents" indexes, stat `dl`s with big numerals and ink-dark (`brand-ink`) split panels instead of charcoal dot-grid blocks. Pills are gone from quick filters / jump lists / sibling chips (now underlined tabs, numbered lists or plain links).
- **Pages**: home (hero, value strip, promos, corporate gifting, drinkware, journal), /product (header tabs, de-carded filters), /product/[slug] (price block, trust list, delivery note, two-column reviews with inline form, related), /category (folio index + category spreads + special programmes + drinkware promo), /category/[slug] (split header, sibling tabs), cart, checkout (numbered sections), order-success, profile (masthead + numbered side nav + orders list), wishlist, blog, blog/[slug] (masthead + meta dl + sticky rail), faq (contents + numbered accordion), about-us, why-us, contact-us, 403/status pages, empty states, pagination, skeletons.
- **Components**: navbar (mega-menu typography), mobile nav, cart sidebar, footer (dark ink, editorial columns), newsletter form, product card (studio tile + serif price), product gallery/specs/actions/variant selector/bulk table/review card, section header, content banner, video section, book-a-meeting + bulk-enquiry dialogs.
- **1280 px** (the size the client reviews on): header rows no longer wrap — top-bar third promise hides below 1360 px, contact/wishlist/cart cluster is `shrink-0`, mini search collapses to an icon, nav gaps tightened; home grid, listing grids and the category index use widths that fit 1280 without horizontal overflow (checked at 1280 / 1440 / 390).

### Quality gates (final code)
- `tsc --noEmit` 0 errors · `next lint` 0 errors (15 pre-existing warnings) · `next build --webpack` EXIT 0.
- 20/20 HTTP probes (bad slugs, junk params, XSS query, auth redirects, 403).
- Playwright sweep of all storefront pages + PDP → cart → checkout → order-success → profile at 1280/1440/390: no ≥400 responses, no page errors, no console errors.
- Admin NumberField probe and SHARED-pricing end-to-end (new product M ₹500 / XXL ₹530, order KCS-20260911-KAJY 10 × ₹939 with CGST/SGST ₹223.57 each) both pass.

## Round 6 — font revert, un-cropped imagery, admin pricing crash, search dropdown

### 1. Font restored (no Fraunces)
The Round 5 serif display face was rejected. `layout.tsx` loads **Plus Jakarta Sans only** again; `--font-display` now resolves to `--font-sans`, so the `display` / `kicker` / `numeral` utilities keep working as *weight + tracking roles* of the one family (extra-bold, tight leading; small tracked uppercase kicker; tabular numerals). The italic hero word and italic pull-quote were removed with it. Structure and colours unchanged.

### 2. Images are no longer cut
Cause: every editorial image used `fill` + `object-cover` inside a frame whose ratio didn't match the source (380×265 promo art, 750×656 grid art, 1180×245 strips, 380×255 blog covers, square product cut-outs), so titles and products were sliced off. Fixes:
- **`FramedImage`** (`src/components/shared/framed-image.tsx`): shows the whole picture (`object-contain`) over a heavily blurred wash of itself, so the frame stays a continuous surface with no letterbox bars. Used for: home hero grid tiles (their baked-in titles are now the caption — the duplicate overlay caption is gone), the Trade-Schemes strip, "Popular Gifting Categories" tiles (frames now match the art's 380:265 ratio), blog tiles / lead / cover, Why-Us and About images.
- **Product imagery** (cards, wishlist, gallery thumbs, cart page, cart sidebar, checkout, order-success, search/mega-menu thumbs, variant chip): square `studio` plates with `object-contain` + padding and `mix-blend-multiply`, so white-background cut-outs sit on the warm plate without a visible white square — nothing is cropped.
- **Category tiles / index** (`/category`): square plates, contained. **Category hero** (`/category/[slug]`): the square category cut-out sits on a plate beside the copy instead of being stretched across a 19 rem-tall panel.
- **Drinkware band** (home + `/category`): the 1180×245 strip is shown whole as a panoramic header with the copy beneath (previously only the middle sky was visible).
- **Showreel band**: the empty navy poster strip is replaced by a real still from the film (`/images/video-poster.jpg`, 3:2, extracted from `procter-promo-video.mp4`) in its own frame with the play control; the mobile "banner strip" under the header (a cropped slice of the hero banner) is removed; the mega-menu feature tile uses a text-free photo.
- `next.config.ts`: `qualities` gains `30` for the blurred wash source (tiny). Seed/DB: the "Drinkware Gift Set — Trio" product used the 1180×245 banner as its product image — pointed at a real square product shot (`prisma/seed.ts` + a one-line data fix).

### 3. Admin crash fixed + edge cases (`src/lib/variants.ts`, `variants-editor.tsx`, `product-form.tsx`)
Reported: edit product → Single → Bulk → Add tier → type a price → `TypeError: Cannot read properties of undefined (reading 'toString')` at `variants.ts` `num()` via `resolveVariantTiers` ← `VariantRows` (error boundary).
Root cause: a freshly added tier row is `{ minQuantity, price: undefined, mrp: undefined }` and the SHARED "effective price" preview re-ran the resolver on it, which assumed every field was a number/Decimal.
- `resolveVariantTiers` is now null-safe: `coerceNumber()` treats `undefined`/`null`/`""`/`"-"`/NaN as 0, accepts Decimal-like objects and strings, skips falsy rows, clamps `minQuantity ≥ 1`, and treats `mrp < price` as `mrp = price`; `variant.prices` / `priceDelta` are optional.
- Editor: the preview only uses finished tiers (finite `price > 0`); the per-variant Δ badge and BULK tier chips tolerate half-typed values; "Add tier" suggests the next slab from the largest *finished* min-qty (no more `NaN`); the pricing-mode switch drops empty rows, sets an empty table for ENQUIRY and clears stale `prices`/`variants` errors; switching to CUSTOM seeds only from finished tiers.
- Verified with `shots/r6-admin-repro.mjs` on the SHARED variant tee (20 variant rows): the reported sequence plus clearing price/min-qty, typing `-5` into MRP, adding/removing tiers with a half-typed table, Enquiry → Bulk → Single, Shared → Custom → Shared, and a `-30` adjustment — no page errors, no error boundary. Unit cases for the resolver (undefined/strings/nulls/NaN/Decimal-like) all pass.

### 4. Search dropdown
The side column is reserved only when there are **category** matches; brands alone become a short chip row under the products, and a products-only result stretches edge to edge — no hollow right-hand panel.

### Quality gates (final code)
`tsc --noEmit` 0 errors · `eslint` 0 errors (15 pre-existing warnings) · `next build --webpack` EXIT 0 · probe 15×200 / 4×302 / 1×404 (expected) · Playwright storefront sweep at 1280/1440/390 incl. PDP → cart → checkout → profile → order-success and both search states: no ≥400, no page/console errors; every image on home, /category, /category/drinkwares, /blog, /product loads (0 incomplete).
