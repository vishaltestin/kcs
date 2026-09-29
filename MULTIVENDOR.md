# Multi-vendor module

KCS G-Mart runs as a multi-vendor marketplace. The platform ("KCS G-Mart"
itself) and any number of external sellers share one storefront, one cart and
one checkout — while every order is internally split so each vendor only ever
sees and fulfils their own items.

Commission, payouts and settlement reporting are **out of scope for this
phase**. Sub-orders already carry everything those features will need later
(per-vendor totals, GST split, fulfilment state).

## Roles

| Role | Portal | Can do |
| --- | --- | --- |
| `ADMIN` | `/admin` | Everything, including vendor onboarding, product assignment, and all orders (parent + sub-orders) |
| `VENDOR` | `/vendor` | Own catalogue (products, variants, tiers, stock), own orders, own profile |
| `CUSTOMER` | storefront | Shops across all vendors in one cart, tracks each fulfilment separately |

There is **no public "become a seller" signup**. Vendors are created by an
admin (`/admin/vendors`), which also provisions their first `VENDOR` login in
the same transaction. One login per vendor is supported by the portal today;
more `VENDOR` users can be attached to the same vendor via Admin → Users.

## Data model

```
Vendor 1──n User        (vendor logins; User.vendorId)
Vendor 1──n Product     (Product.vendorId — required, default vendor backfilled)
Order                   (parentId → parent; vendorId → owner; subOrderNumber)
```

Key rules:

- **`Product.vendorId` is required.** Every product belongs to exactly one
  vendor. Products created before the module was added were migrated to the
  default vendor `KCS G-Mart` (`vnd_kcs_default`).
- **Parent order** — `parentId = null`, `vendorId = null`. Holds the
  customer-facing record: totals, invoice number, billing/shipping addresses.
  It has **no items and no courier fields** of its own.
- **Sub-order** — one per vendor per checkout. `subOrderNumber` is
  `<parentOrderNumber>-V<n>` (also stored in `orderNumber` so all existing
  tracking/invoice lookups keep working). Items, courier, tracking and status
  live here.
- Parent status is **derived, never edited**: the minimum fulfilment rank of
  its non-cancelled sub-orders (`deriveParentStatus`). Whenever a sub-order
  changes status or gets a shipment, `syncParentOrderStatus` re-derives it in
  the same transaction. In the admin UI, split parents show read-only status
  chips; single-vendor parents behave like regular orders.

## Checkout splitting

`createOrder` (`src/actions/orders.ts`):

1. Validates the cart server-side (tier pricing, MOQ, stock) exactly as before.
2. Quotes shipping **once** for the whole cart (zone × chargeable weight),
   then allocates the quote across sub-orders **pro-rata to line subtotals**
   (`allocateProRata`, largest-remainder in paisa, so sub-totals always sum to
   the parent's).
3. Computes GST **per sub-order against that vendor's registered state**
   (`Vendor.stateCode` vs `placeOfSupply`): intra-state → CGST+SGST,
   inter-state → IGST. Parent tax fields are the sum of the sub-orders'.
4. Creates parent + sub-orders + items in one transaction with P2002 retries
   for the unique order number.

Invoices (`/api/orders/[orderNumber]/invoice`) remain parent-level; when an
order is split, line items are flattened with a "Sold by" annotation.

## Vendor portal (`/vendor`)

- **Dashboard** — pending/processing counts, shipped revenue window, low-stock list.
- **Products** — full CRUD reusing the admin ProductForm (vendor context
  injected, flagship flags hidden and forced `false`). Delete is blocked when
  order items reference the product.
- **Orders** — sub-orders only. Workflow: confirm → deliver (with shipment
  details: courier, AWB, optional note). Parent order status is synced
  automatically.
- **Settings** — public profile (logo, banner, description), contact, GST and
  address. The state code here drives GST on future sub-orders, so admins
  should review changes.
- Suspended vendors are locked out at the layout level and in every server
  action (`assertVendor`), and their products disappear from the storefront.

## Storefront

- `/sellers` — active vendors with logo, city and live product counts.
- `/sellers/[slug]` — vendor storefront with sort + pagination.
- Product pages show a "Sold by" pill linking to the vendor's page.
- All catalog queries filter on `vendor.status = ACTIVE`, so a suspended
  vendor is invisible everywhere without touching individual products.

## Money & GST invariants

- Parent total = Σ sub-order totals (enforced by construction, verified in seed data).
- Shipping quote is single/cart-level; sub-orders carry allocated shares.
- Tax is always summarised per sub-order against the **owning vendor's**
  state code — a Delhi buyer ordering from a Mumbai vendor pays IGST on that
  sub-order even if another sub-order in the same cart is intra-state.

## Seeded demo data

| Login | Password | Identity |
| --- | --- | --- |
| `admin@kcsgmart.in` | `Admin@12345` | Admin |
| `demo@kcsgmart.in` | `Demo@12345` | Customer (UP → inter-state orders) |
| `vendor@giftcraft.in` | `Vendor@12345` | GiftCraft Studios (HR, `06`) |
| `vendor@auroragifts.in` | `Vendor@12345` | Aurora Corporate Gifts (MH, `27`) |

Eight catalogue products are assigned to the two demo vendors, and two of the
five demo orders span two vendors each (visible as split fulfilments in the
customer order history and admin order detail).

## Not in this phase

- Commission rates, vendor earnings views, payout/settlement workflows.
- Vendor self-signup / onboarding applications.
- Per-vendor shipping policies (shipping is still quoted platform-wide).
- Vendor-scoped coupons or promotions.
