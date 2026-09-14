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

## Round 7 — variant data safety, bigger media popups, visible variant photos, cursor affordance, product handbook

### 1. Turning variants off no longer deletes them (`actions/admin/products.ts`, `variants-editor.tsx`, `orders.ts`)

**Reported:** a product has variants today, not tomorrow — flipping the switch off and saving wiped every variant
(SKU, stock, image, weight, price tables) with no way back.

- `updateProductAction` now treats the switch as a **visibility toggle**: while `hasVariants` is false it skips the
  whole option/variant sync (no `productOption.deleteMany`, no variant upsert/delete), so the stored rows survive
  untouched. `Product.hasVariants` still drives the storefront (`catalog.ts` already maps `p.hasVariants ? … : []`),
  so the product simply sells as a single-price item from its own price/stock fields, and switching back on restores
  every row exactly.
- Permanent deletion is now its own confirmed action: `deleteProductVariantsAction(id)` (order lines keep their
  snapshots; only `OrderItem.variantId` nulls out, which is already `onDelete: SetNull`). The editor shows an amber
  panel while the switch is off — “N variants are hidden, not deleted” — with **Delete variants permanently** →
  inline confirm → immediate action + toast.
- Same class of loss fixed for pricing strategy: `normaliseVariantPrices` no longer empties the per-variant tier
  tables when the product switches to **SHARED**. The resolver ignores them while shared (so the storefront, cart,
  order and invoice are unchanged), but switching back to **CUSTOM** finds the tables intact. Every
  `variantPricing === "CUSTOM"` rule in `productSchema` is already conditional, so retained rows can’t fail validation.
- `placeOrder` resolves a cart line’s variant only while `product.hasVariants` is true — a stale cart entry can no
  longer be priced off a hidden variant table.
- **Verified** by driving the real actions end to end (`createProductAction` → hide → snapshot → purge → delete) with a
  temporary dev-only route: after hiding, `variantCount 2 / optionCount 1`, both SKUs, both stock values, the variant
  image and the tier counts were still in MySQL; `productStock` moved to the product’s own field (0) and
  `hasVariants` false; the purge then returned “2 variants and their option axes deleted” with counts at 0. The probe
  route and the test product were removed afterwards (`leftoverProducts 0`).

### 2. Media popups are actually big (`dialog.tsx` note, `product-gallery.tsx`, `video-section.tsx`, `image-picker.tsx`)

Root cause: `DialogContent` ends with `sm:max-w-sm` (384 px). Tailwind sorts `sm:` utilities after the unprefixed ones,
so callers writing `max-w-[min(96vw,1100px)]` / `max-w-3xl` were silently capped at 384 px — the PDP lightbox, the home
showreel and the admin image-library picker were all tiny. Confirmed with the project’s own `cn`: the merged class
string kept `sm:max-w-sm` and dropped the caller’s width; with `sm:` on both sides the base is merged away instead.

- Lightbox: `w-[min(96vw,1400px)] sm:max-w-[min(96vw,1400px)]`, `p-0 gap-0`, and the stage is now height-driven
  (`h-[min(78svh,940px)]`, `object-contain`) instead of a 4:3 box inside a 384 px dialog. Bigger arrows/dots, Esc hint line.
- Home showreel dialog: `w-[min(96vw,1320px)] sm:max-w-[min(96vw,1320px)]`; the `<video>` uses
  `h-auto max-h-[86svh] w-full` (letterbox instead of distortion, no fixed `aspect-video` fighting the viewport).
- Image picker + gallery picker dialogs: `max-w-3xl` → `sm:max-w-3xl`.
- Documented the rule in `dialog.tsx` so the next caller doesn’t lose the same fight.
- Production CSS verified to contain `max-width:min(96vw,1400px)` and `max-width:min(96vw,1320px)`.

### 3. Variant images are impossible to miss (`variant-selector.tsx`, `product-gallery.tsx`, `product-actions.tsx`, new `store/variant-preview.ts`)

- **New store** `useVariantPreview` (zustand, in-memory, keyed by product id): the channel between the purchase panel
  and the media stage, so no prop drilling through server components and no extra client boundary.
- Selecting a variant puts **its own photo on the gallery stage and in the lightbox** — pinned as frame 0 (with a
  “selected variant” pill on the stage, in the lightbox and on the thumbnail), and the reset happens during render
  (React’s “adjust state when a prop changes” pattern, no cascading-render lint error).
- Option axes whose values each carry a distinct photo render as **image tiles** (7.5 rem plate, contained image,
  hover zoom, tick badge, name + “out” state) instead of 40 px swatches; the decision is made from the whole variant
  list so the layout can’t jump mid-choice. A Size axis whose values all resolve to the same colour photo stays a
  compact pill row.
- The selected-variant card next to the price grew from a 48 px chip to an 96 px plate, clickable to pin it to the gallery.
- Admin variant rows: `size-9` thumb → `size-14` contained plate; an empty one is now an “Add image” button that opens
  the row where the `ImagePicker` lives.

### 4. Hand cursor on everything clickable (`globals.css`, `dropdown-menu.tsx`, `select.tsx`, `command.tsx`)

shadcn ships `cursor-default` on menu rows, and a utility always beats `@layer base`, so the global rule could not win.
Replaced at the source: 4 dropdown rows (item / checkbox item / radio item / sub-trigger), 3 select parts (item + both
scroll buttons), 1 command row. The base rule also grew to cover `[role="menuitemcheckbox"]`,
`[role="menuitemradio"]`, `[data-slot="command-item"]`, all `[data-sidebar="menu-button|menu-sub-button|menu-action|trigger|rail"]`,
`select`, checkbox/radio/file/range inputs and checkbox/radio labels; `[role="option"]`/`[role="menuitem"]` now skip
`data-disabled`, and a companion rule gives disabled controls `cursor: not-allowed`.

### 5. Product handbook — no demo needed to hand over the console (`products/product-guide.tsx`, `admin/guides/product`, `seo-fields.tsx`)

- New module holds the documentation as data: `PRODUCT_FORM_GUIDES` (10 sections), `PRODUCT_GUIDE_CHAPTERS`
  (order lifecycle, when-a-quote-is-right, launch checklist) and `SectionGuide`, a `<details>` panel with
  labelled points, a worked-figures table and a “watch out” line. No JS, no new dependency.
- Every card on `/admin/products/{new,[id]/edit}` gets its strip (Basics, Categories, Images, Content, Pricing,
  Tax & shipping, Variants, Specifications, Visibility, SEO — the SEO one renders through a new optional
  `footer` on the shared `SeoFields` card, so category/blog forms are untouched).
- `/admin/guides/product` prints the same object expanded, with a numbered contents index, per-section anchors and a
  print hint — one source of truth, so the form and the handbook can’t disagree. Linked from both product page
  headers and the admin sidebar (Catalog → “Product guide”).
- Content was written against the code, not the README: GST carve-out maths (`taxable = total × 100 ÷ (100 + rate)`,
  CGST/SGST when place of supply = `sellerStateCode`, IGST otherwise, freight at 18 %), tier→“from” price and
  tier→MOQ rules, stock semantics (`0` = untracked), the upload pipeline (EXIF rotate → 1600 px → WebP q82),
  volumetric weight at divisor 5000, 500 g fallback, invoice numbering `prefix/25-26/000123`, and what the switch-off
  behaviour from §1 means for the storefront.

### Quality gates (final code)

`tsc --noEmit` 0 errors · `eslint .` 0 errors, 15 warnings (the same pre-existing set) · `next build --webpack`
EXIT 0 (`/admin/guides/product` in the route table). Runtime sweep on the production server: 16 routes 200
(storefront incl. PDP/category/blog/faq/cart/checkout + `/admin`, `/admin/products`, `/admin/guides/product`,
order edit) · PDP renders 14 variant radios, colour photos in the tile branch · compiled CSS carries the new
`max-width` utilities and the cursor rules · `cn()` merge check proves the `sm:max-w-sm` cap is gone.
(`npm run build` with the default Turbopack runner is OOM-killed on this 2 GB box — that is environmental, not code.)

---

# Round 8 — home page ported to the reference design

**Ask:** “my senior want the home page design like in this site” → the live kcsgmart front page, whose
source (`github.com/vishal32004/kcsgmart`, Next 14.2.7 + Tailwind v3) was cloned to `/home/user/ref-kcsgmart`
and read class-by-class. This round replaces the Round 5/6 editorial restyle **on the home page only** with
the reference’s flat, dense, boxed language — while keeping our data layer and every fix the client asked for
in rounds 0–7.

**Files:** `src/app/(shop)/page.tsx` (rewritten), `src/components/shared/carousels.tsx` (re-styled),
`src/components/home/video-section.tsx` (rewritten), `src/app/globals.css` (mosaic + strip + play button).
`section-header.tsx`, `product-card.tsx`, `framed-image.tsx` and every other page are untouched — the rails get
their own flat header (`RailHeader`) and the boxed card is applied by the home carousel, so category / product
/ PDP pages keep the styling they were signed off with.

## What was copied

- **Rhythm:** `<main className="mt-5 flex flex-col gap-20">`, section order trusted-strip → mosaic → New →
  Featured → Best Sellers → promo grid → video band → story → blogs → brands → drinkware band.
- **Trusted strip:** flat `bg-brand-charcoal` (`#444444`) bar, `rounded-[5px]`, one small centred
  `font-extrabold` white title, nine 40 px lucide icon tiles in a horizontally scrolling rail. `.most-trusted`
  carries the reference’s hover contract: tile → amber `#fcb819`, label → `#b91c1c`, icon `translateY(-4px)`,
  plus the 7 px translucent scrollbar that tells mobile users the rail scrolls.
- **Mosaic:** the reference’s `.parent` 4×3 grid with the banner slider in the 2×2 `.div1`, 1 rem gutters,
  squared cells, `overflow: hidden` and a slow `transform 1s` 1.05 zoom on the artwork.
- **Rails:** bare `text-3xl font-bold` title over a `border-b pb-3` hairline with uppercase “View More” +
  `MoveRight`; four boxed white cards per view (`bg-card p-2.5 shadow-lg → hover:shadow-xl`); the reference’s
  full-height white edge bars that fade in on rail hover replace our floating round buttons.
- **Promo grid:** `grid md:grid-cols-3` of the six Featured-cat tiles, each with the `w-3/4` white label bar
  sitting over the bottom of the image and turning red on hover.
- **Video band:** full-bleed film still, centred white headline, `.play-modal` circle (border ring, red on
  hover) opening the dialog.
- **Story / blogs / brands / drinkware:** two-column `md:flex-row gap-8` with `Button variant="link"`
  “Visit Products”; 3-up blog rail with a 233 px image, bold title and uppercase “Read More”; centred
  `h3` brands row of 6-up 150×150 `border-2` logo tiles; full-bleed drinkware band with uppercase overlay copy
  and a `rounded-[5px] bg-primary hover:bg-brand-blue` SHOP NOW.

## What was deliberately *not* copied

| Reference behaviour | Here |
| --- | --- |
| “View More”, promo and SHOP NOW links point at `href="#"` | real routes (`/product?filter=…`, `/category/…`) — all 17 verified 200 |
| product photos hot-linked from `www.kcsgmart.in/photos/…` | our own `public/` assets only (0 external `src=` on the page) |
| `.parent img { width:100%; height:100% }` with `object-fit` commented out → artwork stretched | cells sized by their own artwork ratio, so the mosaic assembles to the same shape with no crop and no letterbox (the 581×511 banner lands within ~2 px of its 2×2 slot) |
| `truncateText(name, 7)` titles, hover-only “View Details” | full names; CTA also reachable by tap, not just hover |
| `w-[88.5%]` strip (breaks container alignment) | `container` like every other band |
| `<Image width={3840} q={75}>` per product card | our `ProductCard` image sizing |
| `w-fll`, `basis-1/`, alternating `red-700`/`red-600` promo hovers, “utensilss” | fixed; hover red comes from `--primary` |
| client-side `react-query` + `axios` against a `server.js` | our Prisma server components (no client data layer) |
| its own 4-value USP strip / hero stats we had added in Round 5 | dropped — the reference has no such band; the four points moved into the story column as an icon list |

## Quality gates (final code)

`tsc --noEmit` 0 errors · `eslint .` 0 errors, 15 warnings (the same pre-existing set) · `next build --webpack`
EXIT 0, 37 static pages, no `next/image` warnings. Production-server sweep: 17 public routes 200 (home,
`/product` + the three rail filters, 12 category slugs the mosaic/promo bands link to, blog, cart, wishlist,
FAQ, why-us, about, login, signup) and 8 admin routes 200 while logged in (`/admin`, products list/new/edit,
`/admin/guides/product`, orders, enquiries). Compiled CSS carries `.parent`/`.div1…8`, the `.most-trusted`
hover contract and `.play-modal`. This sandbox has no browser, so nothing above is a screenshot: what was checked
here is the compiled markup (all eleven sections present, mosaic cells div1–div8 in order, boxed rail cards, promo
label bars, no external image hosts, no `href="#"` in home content), the compiled CSS and the route statuses.
The visual pass itself happens in the live preview.

**Still open (not home-page):** `src/components/layout/footer.tsx` renders the four social icons as
`href="#"`. Store settings have no social URLs to bind yet, so they were left alone this round.

---

# Round 9 — home page polish + admin-editable promo bands

Five items from the client's review of the Round 8 port. All uncommitted.

## 1. "Most Trusted" strip — hover colour, and heading spacing (`globals.css`, `page.tsx`)

**Wrong:** the reference's rule painted the hovered label `#b91c1c` — dark red on the `#444444`
bar, i.e. almost invisible (it was already poor in the source design; copying it faithfully was a
mistake). Now the hovered tile — icon *and* label — goes to the site's amber `--brand-amber`
(`#FCB819`, ~5.7:1 on charcoal), picks up a 7 % white pill and keeps the reference's `translateY(-4px)`
icon lift. `:focus-visible` mirrors `:hover` so the keyboard path is not invisible either, and tiles
got `padding: 6px 10px` + `border-radius: 8px` so the pill has something to wrap.
The strip title moved off the bar's top edge (`my-2` → `pt-4 pb-1`).

## 2. Mosaic hover snapped instead of gliding (`globals.css`)

`.parent img` transitioned `transform` only, but Tailwind v4's `scale-*` utilities animate the
standalone **`scale`** property — so the artwork jumped. Confirmed in the compiled CSS
(`.scale-105{… scale:var(--tw-scale-x) …}`). The rule now transitions both:
`transition: transform 1s ease-in-out, scale 1s ease-in-out`.

## 3. Rail headers — title was tight on the rule (`page.tsx`)

`RailHeader`: `pb-3` → `pb-4`, `gap-2` → `gap-3`, and the heading got `leading-[1.35]` (was the
default 1.25 on a 3xl bold), so descenders no longer touch the hairline.

## 4. Carousel arrows no longer sit on the cards (`carousels.tsx`)

The reference's full-height `bg-[rgba(255,255,255,.8)]` bars were reproduced exactly, and they
covered the first and last card on hover. Now: 36 px circles, always visible (nothing appears on
hover, so nothing pops over a card), `inset-y-0 my-auto` at the rail's vertical centre, and pushed
**into the page gutter** at `lg` (`left-1 md:-left-3 lg:-left-4`; the container has 40 px of
gutter) — outside the card row entirely. Below `md`, where there is no gutter to borrow, they tuck
against the edge instead. One `RAIL_ARROW` pair feeds the product, blog and brand rails, and
`disabled:invisible` still hides them when a rail cannot scroll further.

## 5. Filter checkboxes ticked instantly (`product-filters.tsx`)

**Symptom:** ticking a category/brand/price box took half a second or more to show, and the same to
untick. **Cause:** state was 100 % URL-driven — `router.push` to a dynamic listing, so the box only
reflected the click once the server had re-rendered the page, and the click itself blocked the
transition.

- Each click parks an optimistic value for its param; the checkbox, the chips row and the "Refine (n)"
  badge read from it immediately.
- The override is dropped as soon as the URL carries what it asked for — compared per param, so a
  server-side normalisation can't strand it. The check runs during render (React's "adjust state when
  a value changes" pattern), not in an effect, which is what the `react-hooks` rule wants here.
- Navigation moved into `startTransition`, so the click is never blocked while the listing loads.
- "Clear all" is optimistic too. Kept `push` (not `replace`) so the back button still unwinds filters,
  and the URL remains the single source of truth — listings are still server-rendered and shareable.

## 6. Search box — the bare `/` badge explained itself (`navbar-client.tsx`)

It was a keyboard-shortcut hint with no explanation: pressing `/` anywhere on the site focuses the
search field (the handler in this same file ignores it while typing in another field). A lone `/` in a
box is meaningless to a shopper, so it now reads `/ to search`, only shows while the field is empty,
and carries a `title` tooltip spelling it out. The shortcut itself is unchanged.

## 7. Home page promo bands are now admin content (`HomeBanner`)

"Best Price & High Quality / Drinkwares for Corporate Gifts" was hard-coded; the client expects to
rewrite it every season, so both full-bleed bands are now rows in the database.

- **`prisma/schema.prisma`** — `HomeBanner`: one row per `slot` (`drinkware`, `video`) with `eyebrow`,
  `title`, `subtitle`, `ctaLabel`, `ctaHref`, `image`, `videoUrl` (video slot only) and `isActive`.
  Migration `20260914120000_home_bands` creates it **and inserts the copy the design shipped with**, so
  the fields arrive pre-filled and no deploy is needed to change a headline. `prisma/seed.ts` recreates
  the two rows on a fresh seed.
- **`src/lib/home-bands.ts`** — the single source of truth both sides read: slot list, defaults,
  `HOME_BAND_LIMITS` (kept next to the column widths), `resolveHomeBands()` and `toHomeBandFormValue()`.
  Rules: no row → defaults; `isActive: false` → the band is not rendered at all; an empty field → that
  field's default (a blank `image` falls back to the bundled file, so the strip is never an empty box).
- **`/admin/home-bands`** ("Home Bands" in the sidebar, Content & People) — one panel per band, prefilled,
  with the shared `ImagePicker` for artwork, a "Show on the home page" switch, and a how-it-works panel
  (empty ≠ hole, hide ≠ delete, live on save, and: text baked into the artwork must be edited in the
  artwork). Follows the existing `StoreSettingsForm` shape — `useActionState` + `ActionResult.fieldErrors`
  + toast, no new dependency.
- **`src/actions/admin/home-bands.ts`** — `updateHomeBandAction`: `assertAdmin()` → zod → `upsert` on
  `slot` (a band can be rewritten, never duplicated) → empty strings to NULL → `revalidatePath("/")` +
  the admin list, so saving is live without a rebuild. `ctaHref`/`videoUrl` accept only an internal path
  or an `https?://` URL, which also rejects `javascript:` links.
- Storefront: `page.tsx` fetches `getHomeBands()` in the same `Promise.all` and renders
  `{bands.video && <VideoSection band={…} />}` / `{bands.drinkware && <DrinkwareSection band={…} />}`;
  `video-section.tsx` takes the band as a prop instead of constants (copy, still, film source, CTA).
  The drinkware band also gained the optional support line, since there is now a field for it.

## Quality gates (final code)

`tsc --noEmit` 0 errors · `eslint .` 0 errors, 15 pre-existing warnings · `next build --webpack` EXIT 0
(38 static pages, `/admin/home-bands` in the route table, no `next/image` warnings). Production-server
sweep: 18 storefront routes 200 (`/checkout` 302 = empty-cart redirect, as before) and 7 admin routes
200 authenticated, including the new band editor. Compiled CSS verified to carry
`transition:transform 1s ease-in-out,scale 1s ease-in-out` and the amber `:hover`/`:focus-visible`
tile rules. **Band round-trip tested for real:** an admin-session request through
`updateHomeBandAction` wrote a new title/eyebrow/CTA, the built home page served it on the next request
with no rebuild, the empty `image` fell back to the bundled strip, `isActive:false` removed the band
while every other section stayed (0 stray markup), and a bad `ctaHref` came back as field errors
instead of writing. The probe route used for that test was deleted and the rows restored to their
shipped copy. Interaction-level checks that need a real cursor — the mosaic glide, the gutter arrows,
the instant checkbox — are verified in code, build and CSS only; the visual pass is on the preview.

---

# Round 10 — drinkware band spacing + framing

**Feedback:** "too much space in text and button, content going too much close to border".

**Cause 1 — the spacing.** The overlay was `absolute inset-0 grid place-items-center gap-4` with four
children. `place-items-center` sets `align-items`, leaving `align-content: normal` → **stretch**, so the
four auto rows each grew to a quarter of the band and the eyebrow / headline / line / button were pushed
~90px apart instead of sitting on a real rhythm. Replaced with one flex column (`gap-2`, button `mt-1.5`)
so the block holds its own height: 10.5/12px eyebrow → headline → one support line → 13px button.

**Cause 2 — the edges.** `px-5` with the band's height coming from `h-[350px] lg:h-auto` meant the copy
was centred inside a box only ~212px tall at 1024px, i.e. touching the top and bottom edges. Now `px-6
md:px-10 py-7 lg:py-8` gives the block its own margin, and at `lg` and up the band takes the artwork's own
ratio (`lg:aspect-[1180/245] lg:h-auto`), which is the one frame in which `object-cover` crops nothing —
the bundled art is a panorama with bottle groups at both edges touching the top, so any other crop shaves
a cap off (checked against the actual file, not assumed). Below `lg` it stays a 300px box, as before.

**Guard for editable copy:** headline and support line are `line-clamp-2` (eyebrow `line-clamp-1`), so
something long written in the admin stays inside the band rather than pushing past the scrim.

Type went down a step (headline `1.3rem → 1.7rem → 1.95rem`, was up to `2.3rem`) because the reference's
size was chosen for a two-line-tall box with nothing else in it; with an eyebrow, a support line and a
button in the same column it no longer fit.

Gates: `tsc --noEmit` 0 · `eslint` clean on the touched file · `next build --webpack` EXIT 0 (38 pages).
Home renders the band from the DB row (`Drinkwares for Corporate Gifts`, `Best Price & High Quality`,
`Shop Now`), and the new classes are in the served HTML. Authorisation re-checked while I was in there:
`/admin` and `/admin/home-bands` → 200 for the admin user, **307** for the customer demo, 302 → `/login`
for anonymous.

---

# Round 11 — video: YouTube/Vimeo embeds + a real upload path

**Feedback:** "there is no option to upload video or even better allow youtube video embed."

**What was actually there.** A YouTube renderer already existed — `src/components/shop/video.tsx` — but it
was wired to exactly one place (the product gallery), its regex understood only two URL shapes
(`watch?v=` / `youtu.be`), and the home page's showreel band ignored it entirely: `video-section.tsx`
hard-rendered `<video src={band.videoUrl ?? "/video/procter-promo-video.mp4"}>`. So pasting a YouTube link
into the band's video field produced a broken media element. Meanwhile `/api/uploads` is an image factory —
everything goes through `sharp().resize(1600).webp()` and only five image mimes are accepted — so "upload a
video" had no path at all, and `public/uploads/` could not have served a video properly even if one got
written: the static route buffered whole files and ignored `Range`, which is how a browser seeks.

**1. One source parser — `src/lib/video.ts` (new).** `parseVideoSource()` returns a discriminated union
(`youtube` | `vimeo` | `file`) and understands `youtube.com/watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`,
`/live/`, `m.youtube.com`, `youtube-nocookie.com`, `vimeo.com/<id>`, `player.vimeo.com/video/<id>`, any path
starting with `/`, and any URL ending in mp4/webm/ogg/ogv/mov/m4v. A start offset in `?t=90`, `?t=1m30s`,
`?start=45` or `#t=1:30` is parsed into seconds and carried into the embed. Unparseable → `null`, which is
what the validation uses to reject junk; the *renderer* stays permissive and hands unknown strings to the
file player, so an extensionless CDN link keeps working the way it did before.

**2. `Video` upgraded, one component for every surface.** YouTube embeds now use
`youtube-nocookie.com/embed/<id>?rel=0&modestbranding=1[&start=N]` (no tracking domain, no unrelated
related-videos at the end of our reel), Vimeo uses `player.vimeo.com/video/<id>?dnt=1`, iframes are
`loading="lazy"` with `referrerPolicy` and a real `title`, and the box owns its 16:9 ratio so the PDP and
the band frame identically. `autoPlay` is opt-in and only the band asks for it (it opens on a click).
`src/components/shop/product-gallery.tsx` now passes `title={name + " product video"}`.

**3. The home band uses it.** `video-section.tsx` renders `<Video>` inside the dialog instead of `<video>`,
with the artwork still as the poster. The dialog keeps the box inside the viewport with
`max-w-[calc(86svh*16/9)]` — width capped by the height budget, so a 16:9 embed can never overflow a short
screen the way the old `max-h` trick did.

**4. Upload path, honestly bounded.** `POST /api/uploads/video` (new, admin-only) takes one MP4/WebM/OGG/MOV
up to 40 MB, ignores the browser's mime claim in favour of sniffing the container's magic bytes (`ftyp` /
EBML / `OggS`) so a renamed file is refused, and writes a randomised name under `public/uploads/`.
`GET /api/uploads/[...path]` now streams video with `Accept-Ranges` and single-`Range` support (206 with
`Content-Range`, suffix ranges, 416 past EOF, legal 200 fallback for multi-range) — images are untouched,
still read in one block. Errors are written as sentences because each one has a different fix: a body that
never parsed says "your host capped the request (Vercel: 4.5 MB)", an `EROFS` write says "this filesystem is
read-only, use a YouTube link or commit the file into `public/video/`".

**5. The field itself — `src/components/admin/video-field.tsx` (new), used by both forms.** A URL input, an
*Upload a file* button with real XHR progress, *Clear*, and a live preview of what the value means: a
YouTube thumbnail (`mqdefault` — always present, never letterboxed) with "YouTube · <id> · starts at 90s",
or "Vimeo · <id> — embedded player, nothing stored here", or "Video file · plays in our own player". A value
that is none of those gets an amber note saying it will still be saved and passed to the browser's player,
rather than a silent maybe. Band form and product form share it, so a product's Content card now uploads and
previews too.

**6. Validation follows.** `videoSource(label)` in `src/lib/validations/admin.ts` accepts blank, anything
`parseVideoSource` understands, or a plain `http(s)` URL, capped at 300 chars — the width of
`HomeBanner.videoUrl`. This *relaxes* `Product.video` (previously `z.string().url()`, which rejected a
`/video/clip.mp4` path even though the player handled it) and tightens it in one respect: `ftp://` no longer
passes. No migration needed — the columns were already free-text URLs.

**7. Guidance where it will be read.** The admin guide's media section ("Videos", new "Links beat files"),
the Home Bands panel ("The film can live elsewhere") and both field hints now say the same thing: a YouTube
or Vimeo link is the option that survives a deploy and costs no bandwidth; an uploaded file lands in
`public/uploads/`, which an ephemeral host wipes on the next build.

**Gates.** 17 URL cases + 7 behaviour assertions on the real `parseVideoSource`/`withAutoplay`/
`parseStartOffset` (run with `tsx`, scratch file then deleted) · `tsc --noEmit` 0 · `eslint` 0 errors (1
pre-existing react-hook-form warning in `product-form.tsx`) · `next build --webpack` EXIT 0, 39 pages,
`ƒ /api/uploads/video` in the route table · served checks: PDP with `?t=1m30s` SSRs
`<iframe src="…/youtube-nocookie.com/embed/<id>?rel=0&modestbranding=1&start=90" … title="Adidas Dry-Fit
Round Neck T-Shirt product video">`; home page keeps its band copy and the stored link reaches the client
component; 403 anonymous / 400 non-multipart / 400 no file / 415 wrong mime / 415 not-really-a-video /
200 + path on a real 400 KB upload; range reads returned 206 with byte-identical payloads at offsets 0, 1000
and 399000, plus 416 past EOF; image serving unchanged; 11 admin routes 200, customer demo 307 → `/403`,
13 public routes 200 (`/checkout` 302 = empty-cart redirect, as before). Test rows and the uploaded probe
file were cleaned up afterwards; both `HomeBanner` rows and the product are back to their shipped values.

**Not verified here:** playback in a real browser (this sandbox has no browser tooling) — verification is
rendered markup, HTTP semantics and the parser. The admin thumbnail is fetched by the editor's browser from
`i.ytimg.com`, not by the server, so it is not covered by the site's `images.remotePatterns`.

**Deploy note for the client:** nothing to migrate. If you want uploaded files to survive, mount persistent
storage over `public/uploads` (or switch uploads to S3/R2/Vercel Blob) — the same caveat already applies to
uploaded images.
