import type { ReactNode } from "react";

import { BookOpenText, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Hand-over documentation for the product form.
 *
 * Every card in `/admin/products/{new,[id]/edit}` carries a collapsible
 * "How this works" panel built from the data below, and `/admin/guides/product`
 * renders the same entries expanded. One source of truth, so the form and the
 * handbook can never disagree. Written for someone who has never seen the
 * system: each entry says what the field controls, what the customer sees, and
 * what breaks when it is wrong.
 */

export type GuidePoint = { label: string; text: ReactNode };

export type GuideContent = {
  points: GuidePoint[];
  /** Worked numbers — the fastest way to make a pricing rule click. */
  example?: { title: string; rows: { k: string; v: ReactNode }[]; footnote?: ReactNode };
  /** A single sharp warning ("if you get this wrong…"). */
  watchOut?: ReactNode;
};

/* -------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* -------------------------------------------------------------------------- */

function Mono({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-foreground/[0.06] px-1 py-px font-mono text-[0.82em] text-foreground">
      {children}
    </code>
  );
}

function Strong({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-foreground">{children}</span>;
}

function GuideExample({
  title,
  rows,
  footnote,
}: {
  title: string;
  rows: { k: string; v: ReactNode }[];
  footnote?: ReactNode;
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg bg-background ring-1 ring-foreground/[0.07]">
      <p className="border-b bg-surface px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <dl className="divide-y divide-foreground/[0.06]">
        {rows.map((row) => (
          <div key={row.k} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-3 px-3 py-1.5 text-[12.5px]">
            <dt className="text-muted-foreground">{row.k}</dt>
            <dd className="font-medium text-foreground">{row.v}</dd>
          </div>
        ))}
      </dl>
      {footnote && <p className="border-t bg-surface/60 px-3 py-1.5 text-[12px] text-muted-foreground">{footnote}</p>}
    </div>
  );
}

/**
 * Collapsible explainer for one form card. Uses <details> so it costs no
 * JavaScript and stays open once opened (the browser keeps the state).
 */
export function SectionGuide({
  content,
  label = "How this works",
  collapsible = true,
  defaultOpen = false,
  className,
}: {
  content: GuideContent;
  label?: string;
  /** false renders the whole document (used by the guide page). */
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <dl className="space-y-2.5">
        {content.points.map((point) => (
          <div key={point.label} className="grid gap-1 sm:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)] sm:gap-3">
            <dt className="pt-px text-[12.5px] font-bold text-foreground">{point.label}</dt>
            <dd className="text-[12.5px] leading-relaxed text-muted-foreground [&_a]:underline">{point.text}</dd>
          </div>
        ))}
      </dl>
      {content.example && <GuideExample {...content.example} />}
      {content.watchOut && (
        <p className="mt-3 rounded-lg bg-brand-amber/10 px-3 py-2 text-[12.5px] leading-relaxed text-amber-900 ring-1 ring-brand-amber/30">
          <Strong>Watch out: </Strong>
          {content.watchOut}
        </p>
      )}
    </>
  );

  if (!collapsible) {
    return (
      <div className={cn("rounded-xl border border-dashed bg-surface/70 p-4", className)}>
        <p className="mb-3 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-primary">
          <BookOpenText className="size-3.5" aria-hidden />
          {label}
        </p>
        {body}
      </div>
    );
  }

  return (
    <details
      open={defaultOpen}
      className={cn(
        "group/guide rounded-xl border border-dashed bg-surface/70 transition-colors open:bg-surface",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        <BookOpenText className="size-3.5 text-primary" aria-hidden />
        {label}
        <ChevronDown className="ml-auto size-3.5 transition-transform group-open/guide:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-foreground/[0.06] px-3.5 py-3">{body}</div>
    </details>
  );
}

/* -------------------------------------------------------------------------- */
/* The content                                                                */
/* -------------------------------------------------------------------------- */

export const PRODUCT_FORM_GUIDES = {
  basics: {
    points: [
      {
        label: "Name",
        text: (
          <>
            The product&apos;s display name. Used on cards, the product page, in the cart, on the invoice line and in
            search results. Keep the branding/spelling consistent — shoppers search this text.
          </>
        ),
      },
      {
        label: "URL slug",
        text: (
          <>
            The web address: <Mono>/product/&lt;slug&gt;</Mono>. Auto-filled from the name until you type in it. Must be
            unique. <Strong>Changing it breaks every old link</Strong> (WhatsApp messages, blog embeds, Google) — the
            previous URL then 404s, so only edit it deliberately.
          </>
        ),
      },
      {
        label: "SKU",
        text: (
          <>
            Your internal code for the <Emphasis>product</Emphasis>. Optional. Print/warehouse people use it on the
            invoice and in the order lines. On variant products each variant has its own SKU and those must be unique
            across the whole catalogue — a clash names the offending product.
          </>
        ),
      },
      {
        label: "Brand",
        text: (
          <>
            Links to a Brand record (<Mono>/admin/brands</Mono>). Drives the brand chip and name on the product page, the
            brand filter on <Mono>/product</Mono>, and brand pages. Leave empty for unbranded / white-label stock.
          </>
        ),
      },
      {
        label: "Short description",
        text: (
          <>
            One or two sentences. Shown under the name on hover cards and used as the <Strong>fallback meta
            description</Strong> for Google when the SEO card is empty — so write it for a human skimming a list.
          </>
        ),
      },
      {
        label: "Stock",
        text: (
          <>
            Number of pieces you can ship right now. <Mono>0</Mono> means <Strong>not tracked</Strong> — the product is
            always purchasable (the right setting for made-to-order gifting). Above 0, checkout refuses more than you
            have and the card / product page show the remaining count. With variants this field is calculated for you
            (see the Variants guide).
          </>
        ),
      },
    ],
    watchOut: (
      <>
        Prices, stock and variants are the only things the storefront reads from this record in real time — nothing is
        cached forever, but a saved product appears on the site immediately. Uncheck <Strong>Active</Strong> (Visibility
        card) if it is a work in progress.
      </>
    ),
  },

  categories: {
    points: [
      {
        label: "Many-to-one",
        text: (
          <>
            Tick every category the product belongs in — a notebook can sit under <Emphasis>Stationery</Emphasis> and{" "}
            <Emphasis>Diwali Gift Hampers</Emphasis> at once. Categories are the tree in <Mono>/admin/categories</Mono>;
            parents and children are both tickable.
          </>
        ),
      },
      {
        label: "First tick wins the breadcrumb",
        text: (
          <>
            The product page breadcrumb and the &ldquo;back to&rdquo; link use the <Strong>first</Strong> category of the
            product. Order matters more than count.
          </>
        ),
      },
      {
        label: "What categories do",
        text: (
          <>
            They build <Mono>/category/&lt;slug&gt;</Mono> (the &ldquo;Shop by occasion&rdquo; pages), the listing filter
            chips on <Mono>/product</Mono>, the &ldquo;category&rdquo; search results, and the admin dashboard&apos;s
            &ldquo;catalogue by category&rdquo; chart.
          </>
        ),
      },
      {
        label: "Empty category",
        text: "A category with no products still renders its page with an empty state — better to unpublish it than leave dead links in the menu.",
      },
    ],
  },

  images: {
    points: [
      {
        label: "Main image",
        text: (
          <>
            The one on cards, carousels, cart lines, order lines and the search dropdown. Square cut-outs on a white or
            transparent background look best: the storefront shows images <Strong>contained, never cropped</Strong>, on a
            warm &ldquo;studio&rdquo; plate.
          </>
        ),
      },
      {
        label: "Gallery",
        text: (
          <>
            Up to 12 extra shots shown on the product page (thumbnail strip on the left, arrows, lightbox on click). The
            first star makes an image the main one. The main image never repeats inside the gallery — the save strips the
            duplicate.
          </>
        ),
      },
      {
        label: "Upload vs library",
        text: (
          <>
            <Strong>Upload</Strong> sends your file to the server, which auto-rotates it from EXIF, strips metadata, caps
            the long edge at 1600 px and re-encodes as WebP (quality 82). Animated GIFs are kept as-is.{" "}
            <Strong>Library</Strong> reuses anything already uploaded. JPG/PNG/WebP/AVIF/GIF up to 12 MB.
          </>
        ),
      },
      {
        label: "Sharpness",
        text: (
          <>
            Cards ask the image optimiser for 2× the displayed size, and the gallery/lightbox use quality 90 — so{" "}
            <Strong>the source resolution is the limit</Strong>. A 500×500 file cannot look crisp in a 1000 px lightbox;
            upload 1200 px or larger.
          </>
        ),
      },
      {
        label: "Videos",
        text: (
          <>
            The <Mono>video</Mono> field (Content card) takes a YouTube or Vimeo link, or a video file. Link forms
            understood: <Mono>youtube.com/watch?v=…</Mono>, <Mono>youtu.be/…</Mono>, <Mono>/embed/…</Mono>,{" "}
            <Mono>/shorts/…</Mono>, <Mono>/live/…</Mono>, <Mono>vimeo.com/…</Mono> — and a start offset in{" "}
            <Mono>?t=90</Mono>, <Mono>?t=1m30s</Mono> or <Mono>#t=1:30</Mono> is carried into the embed. A file is
            anything the browser plays: <Mono>/video/clip.mp4</Mono> served by the app, a CDN URL, or one you upload
            with the button in that field. Links embed the provider&rsquo;s player; files render a native player under
            the gallery. Either way the field tells you what it recognised before you save.
          </>
        ),
      },
      {
        label: "Links beat files",
        text: (
          <>
            A YouTube link is the option that survives everything: nothing is stored on this server, no bandwidth is
            billed to you, and it adapts to the visitor&rsquo;s connection. An uploaded file is capped at 40 MB here
            and lives only as long as this server&rsquo;s disk does — see the next note.
          </>
        ),
      },
    ],
    watchOut: (
      <>
        Files live in <Mono>public/uploads/</Mono> on this server&apos;s disk. They are not deleted when a product is
        removed, and moving the site means copying that folder along with the database.
      </>
    ),
  },

  content: {
    points: [
      {
        label: "Description",
        text: (
          <>
            The &ldquo;About this product&rdquo; block on the product page. Plain text — no HTML, no buttons. Leave a{" "}
            <Strong>blank line between paragraphs</Strong>; single line breaks inside a paragraph are preserved. The
            first paragraph is set larger as a lead.
          </>
        ),
      },
      {
        label: "Delivery note",
        text: (
          <>
            Short promise shown in the product page&apos;s delivery card (&ldquo;Dispatch in 5–7 working days with
            branding&rdquo;). This is copy, not a rule — it does not change shipping charges.
          </>
        ),
      },
      {
        label: "What else the page adds",
        text: (
          <>
            Under the description the storefront automatically prints <Strong>Packed weight</Strong>, <Strong>Package
            dimensions</Strong> and <Strong>HSN code · GST % (included)</Strong> from the Tax &amp; shipping card, plus any
            Specifications you enter. So those numbers need to be right, and you should not repeat them by hand.
          </>
        ),
      },
    ],
  },

  pricing: {
    points: [
      {
        label: "Everything is GST-inclusive",
        text: (
          <>
            Whatever you type here is what the customer pays per piece. Tax is <Strong>carved out of</Strong> the price
            for the invoice, never added at checkout. So quote your landed price.
          </>
        ),
      },
      {
        label: "Single unit price",
        text: (
          <>
            One flat price, order from 1 piece. No slab table on the product page, no minimum-order chip. For straight
            catalogue items (a bottle, a notebook).
          </>
        ),
      },
      {
        label: "Bulk pricing tiers",
        text: (
          <>
            Your slabs, cheapest last. The <Strong>smallest “min qty” becomes the MOQ</Strong> — nobody can order less —
            and the <Strong>largest slab&apos;s price becomes the “Starting at / from ₹” figure</Strong> on cards, so
            listings can sort and filter by price without doing maths. The product page shows the whole table and the
            cart line always uses the tier the quantity actually lands in.
          </>
        ),
      },
      {
        label: "Enquiry only",
        text: (
          <>
            No public price at all. The card reads &ldquo;Price on request&rdquo;, the buy button becomes{" "}
            <Strong>Request a quote</Strong> (opens the bulk-enquiry form) plus WhatsApp. Checkout refuses these items
            even if they are already in a cart, so use it for anything priced per brief.
          </>
        ),
      },
      {
        label: "Tiers must be complete",
        text: "Every row needs min qty, price and MRP. A row with a price but no MRP is rejected; MRP below the price is silently raised to the price so the discount never goes negative.",
      },
      {
        label: "Prices are recomputed",
        text: (
          <>
            At checkout the server re-reads your tiers and re-prices every line — a tampered or stale cart price is
            ignored. Which is also why an edited tier changes what a <Strong>new</Strong> checkout pays, never what an{" "}
            <Strong>existing order</Strong> paid (orders keep their own snapshots).
          </>
        ),
      },
    ],
    example: {
      title: "Tiers 10+ ₹749 · 50+ ₹689 · 100+ ₹649",
      rows: [
        { k: "Card shows", v: "from ₹649 · MOQ 10" },
        { k: "Cart of 30 pcs", v: (<>30 × ₹749 = <Mono>₹22,470</Mono> (10+ tier)</>) },
        { k: "Cart of 60 pcs", v: (<>60 × ₹689 = <Mono>₹41,340</Mono> (50+ tier)</>) },
        { k: "Cart of 5 pcs", v: "Refused — below the 10-piece minimum" },
      ],
      footnote: "MRP is only used for the struck-through price and the % off badge; it is never charged.",
    },
    watchOut: (
      <>
        Deleting every tier on a BULK product hides the slab table and makes the item effectively unpriceable — the
        storefront then treats it like an enquiry product. Keep at least one row, or switch the mode to Single / Enquiry.
      </>
    ),
  },

  tax: {
    points: [
      {
        label: "HSN code",
        text: (
          <>
            The statutory classification for goods (4, 6 or 8 digits — e.g. 42029090 for bags). It is printed on every
            invoice line and on the PDF; the product page also shows it. Required for B2B invoicing, so treat it as
            mandatory for anything you sell to companies for input credit.
          </>
        ),
      },
      {
        label: "GST rate",
        text: (
          <>
            0 / 5 / 12 / 18 / 28 %, defaulting to 18. The rate is stored <Strong>on the product</Strong>, so different
            items in one order can carry different rates; each line is split with its own.
          </>
        ),
      },
      {
        label: "The split maths",
        text: (
          <>
            From an inclusive line total:{" "}
            <Mono>taxable = total × 100 ÷ (100 + rate)</Mono> and <Mono>tax = total − taxable</Mono>. Tax is then either
            CGST + SGST (equal halves) or IGST.
          </>
        ),
      },
      {
        label: "Intra vs inter-state",
        text: (
          <>
            Place of supply = the buyer&apos;s <Strong>GSTIN prefix</Strong> if they gave one, otherwise the{" "}
            <Strong>billing state name</Strong>. Same state as the store&apos;s <Mono>sellerStateCode</Mono> (07 = Delhi)
            → CGST + SGST. Anything else, or unresolvable → IGST. Set your GSTIN, PAN, address and state once in{" "}
            <Mono>/admin/shipping</Mono> (Store settings) — every invoice reads them.
          </>
        ),
      },
      {
        label: "Shipping is taxable too",
        text: "When delivery is charged, the freight amount is treated as a service at 18 % and carved out the same way, so the invoice totals always reconcile to the grand total.",
      },
      {
        label: "Invoice numbers",
        text: (
          <>
            Sequential and gapless per financial year: <Mono>prefix/25-26/000123</Mono>. The counter lives on the store
            settings row and is bumped inside the order transaction, so two simultaneous checkouts can never collide. The
            PDF is served from <Mono>/order-success</Mono> and from the order detail page.
          </>
        ),
      },
      {
        label: "Weight & dimensions",
        text: (
          <>
            Per-piece packed weight in grams and the box size in cm. They decide freight only — never price. Chargeable
            weight per line is <Mono>qty × max(actual, volumetric)</Mono> where{" "}
            <Mono>volumetric = L × W × H ÷ divisor (5000) × 1000 g</Mono>. The form shows you both numbers live.
          </>
        ),
      },
      {
        label: "How freight is charged",
        text: (
          <>
            Delivery state → zone (Delhi NCR / North / West / South / East / North-East &amp; remote; unknown states fall
            back to Rest of India) → the smallest weight slab that covers the chargeable weight. Above the last slab, the
            zone&apos;s &ldquo;per extra 500 g&rdquo; rate applies per started 500 g. Orders at or above the free-shipping
            threshold in Store settings ship free. A product with <Strong>no weight at all</Strong> is costed at 500 g
            per piece — so fill this card in, or freight will be wrong for bulky gifts.
          </>
        ),
      },
    ],
    example: {
      title: "One line: 60 pcs × ₹689 = ₹41,340 at GST 18 %",
      rows: [
        { k: "Taxable value", v: <Mono>41,340 × 100 ÷ 118 = ₹35,033.90</Mono> },
        { k: "Total GST", v: <Mono>₹6,306.10</Mono> },
        { k: "Buyer in Delhi (07)", v: "CGST ₹3,153.05 + SGST ₹3,153.05" },
        { k: "Buyer in Maharashtra (27)", v: "IGST ₹6,306.10" },
      ],
      footnote: "Rounding is to the paisa per line; the invoice shows both the value and the tax so the customer's accountant is happy.",
    },
    watchOut: (
      <>
        Changing a GST rate does not re-price past orders — each order line stores its own rate and tax amount, which is
        what its PDF prints.
      </>
    ),
  },

  variants: {
    points: [
      {
        label: "What a variant is",
        text: (
          <>
            A real, separate stock item: one row per combination of your option axes (Colour × Size → Red/M, Red/L,
            Navy/M…). Each keeps its own SKU, stock, image, weight and (in custom mode) price table. Customers must pick
            a full set of options before adding to cart.
          </>
        ),
      },
      {
        label: "Options vs variants",
        text: (
          <>
            <Strong>Options</Strong> are the axes and their values (Colour: Black, Navy). <Strong>Variants</Strong> are
            the generated combinations. Add or rename a value, then press <Mono>Generate / Refresh variants</Mono> — the
            merge keeps the SKU, stock, image and prices of every row it recognises, so nothing you typed is lost.
          </>
        ),
      },
      {
        label: "Shared vs custom pricing",
        text: (
          <>
            <Strong>Shared</Strong>: the product&apos;s tiers apply to every variant, optionally nudged per variant by
            &ldquo;Adjust ₹&rdquo; (e.g. +₹30 for XXL). Use it for almost all apparel and drinkware. <Strong>Custom</Strong>
            : each variant keeps its own slab table (e.g. a leather notebook priced completely differently from the PU
            one). Switching to custom seeds the tables from the shared list; switching back to shared keeps the per-variant
            rows in the database, they are simply ignored while shared mode is on.
          </>
        ),
      },
      {
        label: "Stock, price and MOQ roll up",
        text: (
          <>
            The product&apos;s own stock field is ignored while variants are on — it shows the <Strong>sum of active
            variants</Strong>. Its &ldquo;from&rdquo; price shows the <Strong>cheapest active variant</Strong>. Untick a
            variant (the checkbox at the left of the row) to hide it from the storefront while keeping its stock and
            history; untick <Strong>variants on</Strong> entirely to turn the product into a single-price item.
          </>
        ),
      },
      {
        label: "Turning variants off does not delete them",
        text: (
          <>
            The switch is a visibility toggle. All variant rows, prices, images and weights stay saved, so a product that
            is single-size this month and multi-size next month comes back exactly as it was. Rows are only erased by{" "}
            <Strong>Delete variants permanently</Strong> (offered while the switch is off), or when you delete the product
            itself.
          </>
        ),
      },
      {
        label: "Variant image",
        text: (
          <>
            Shown as the tile on the option picker, as the &ldquo;selected&rdquo; photo next to the price, and it takes
            over the <Strong>main gallery stage and lightbox</Strong> for that variant. Without one, the product&apos;s
            main image stays on screen and the picker falls back to a colour swatch (for colour-like axes) or a text chip.
          </>
        ),
      },
      {
        label: "Per-variant shipping overrides",
        text: "A boxed hamper ships in a bigger carton than a single bottle. Weight/dimensions left blank fall back to the product's values.",
      },
      {
        label: "Carts, orders and invoices",
        text: (
          <>
            Each variant is its own cart line (its own stepper and quantity). The order stores a <Strong>snapshot</Strong>{" "}
            of the variant label, SKU, image and unit price, so a later edit never rewrites history. Deleting variants
            keeps past order lines readable.
          </>
        ),
      },
    ],
    example: {
      title: "Shared pricing with an XXL surcharge (tiers 10+ ₹749 · 50+ ₹689)",
      rows: [
        { k: "M — Adjust ₹0", v: "₹749 / ₹689 per piece" },
        { k: "XXL — Adjust ₹30", v: "₹779 / ₹719 per piece" },
        { k: "Cart of 60 XXL", v: <Mono>60 × ₹719 = ₹43,140</Mono> },
        { k: "Change one tier", v: "Every variant moves with it — nothing to retype" },
      ],
      footnote: "Under custom pricing the same product would need the table typed into each of the 2 rows (or use “Copy to all variants” then tweak).",
    },
    watchOut: (
      <>
        Option value names are matched exactly — <Mono>Navy</Mono> and <Mono>navy</Mono> are two different variants. Keep
        one spelling per axis, and refresh before saving so the table is in sync with the axes.
      </>
    ),
  },

  specs: {
    points: [
      {
        label: "Label / value pairs",
        text: "Rendered as the two-column Specifications table on the product page, in the order you enter them. Material, GSM, capacity, print area, packaging — whatever a buyer needs to compare.",
      },
      {
        label: "Not searchable, not priced",
        text: "Specifications are display-only: they never affect filters, price, freight or the invoice. Anything numeric that must be enforced belongs in Pricing or Tax & shipping, not here.",
      },
      {
        label: "Keep them short",
        text: "Up to 80 characters for the label and 500 for the value. A value that needs three sentences is description copy, not a spec.",
      },
    ],
  },

  badges: {
    points: [
      {
        label: "Active",
        text: (
          <>
            The master switch. Off = the product disappears from the storefront and its page returns the branded
            not-found page, while the record, its orders and its reviews stay intact. Use it for seasonal stock (Diwali
            hampers) instead of deleting.
          </>
        ),
      },
      {
        label: "New arrival",
        text: "The NEW badge on the card, plus the “New arrivals” home carousel and the “New” filter on /product.",
      },
      {
        label: "Featured",
        text: "Puts the product in the “Featured” home carousel and the “Featured” filter. Nothing is ranked automatically — tick the ones you want promoted.",
      },
      {
        label: "Best seller",
        text: "The BESTSELLER badge on the card and the “Best sellers” carousel / filter. This is a merchandising flag, not a report of actual sales.",
      },
      {
        label: "All four carousels need published products",
        text: "The home page only pulls products that are also Active, so a badge on an unpublished product simply does nothing.",
      },
    ],
  },

  seo: {
    points: [
      {
        label: "Leave it empty to auto-derive",
        text: (
          <>
            Every field is optional. Empty meta title → the product name; empty description → the short description, then
            a generic line; empty OG image → the main product image. That fallback chain is why a product with no SEO
            data still shares correctly on WhatsApp.
          </>
        ),
      },
      {
        label: "Meta title (70)",
        text: "The headline in the Google results tab. Put the product type and the commercial hook first — the site name is appended automatically.",
      },
      {
        label: "Meta description (165)",
        text: "Your one-line ad in the search result. Over 165 characters is rejected, because Google truncates it anyway.",
      },
      {
        label: "Keywords (255)",
        text: "Comma-separated. Mostly ignored by Google, still used for the page's keyword tags — spend your effort on the title and description.",
      },
      {
        label: "OG image",
        text: "The link-preview picture for WhatsApp / LinkedIn / Facebook. A wide 1200×630 image works far better than a square cut-out, since previews crop to their own ratio.",
      },
      {
        label: "Canonical + cards",
        text: (
          <>
            Each product page emits a canonical URL under the site URL, OpenGraph (with the product name/price context)
            and a Twitter summary card — all automatic once the product is Active.
          </>
        ),
      },
    ],
  },
} satisfies Record<string, GuideContent>;

export type ProductFormGuideKey = keyof typeof PRODUCT_FORM_GUIDES;

function Emphasis({ children }: { children: ReactNode }) {
  return <em className="not-italic font-medium text-foreground">{children}</em>;
}

/**
 * Extra chapters that are not tied to a single form card — they belong on the
 * handbook page so a new operator can follow a whole order end to end.
 */
export const PRODUCT_GUIDE_CHAPTERS: { id: string; title: string; intro: ReactNode; points: GuidePoint[] }[] = [
  {
    id: "lifecycle",
    title: "From saved product to paid order",
    intro: (
      <>
        One page to keep in your head: a product row is the <Strong>only</Strong> pricing authority. Everything else is
        derived at the moment it is needed, and nothing trusts the browser.
      </>
    ),
    points: [
      {
        label: "Browsing",
        text: "Cards, listings and carousels read the product's stored “from” price (cheapest tier, or cheapest active variant) so sorting and filtering stay fast.",
      },
      {
        label: "Product page",
        text: "The full tier table, the MOQ, the variant picker and the gallery are computed live from your tiers + variants — which is why the “from” figure on a card can be lower than the price at 10 pieces.",
      },
      {
        label: "Cart & checkout",
        text: (
          <>
            Cart lines are per product <Strong>or per variant</Strong>. At <Mono>Place order</Mono> the server re-prices
            every line from the tiers, checks MOQ and stock, computes freight from weight × zone, and splits GST per
            line. The client&apos;s numbers are never used.
          </>
        ),
      },
      {
        label: "Order record",
        text: "The order stores name, variant label, SKU, image, unit price, line total, HSN and GST rate for each line — an immutable snapshot. Editing the product afterwards changes future checkouts only.",
      },
      {
        label: "Invoice",
        text: "A GST-style PDF with seller/buyer GSTIN, place of supply, per-line HSN, CGST/SGST or IGST, freight at 18 % when charged, and the total in words. Download from the order detail page or the customer's success page.",
      },
      {
        label: "Statuses",
        text: (
          <>
            <Mono>PENDING → CONFIRMED → SHIPPED → DELIVERED</Mono>, with <Mono>CANCELLED</Mono> available at any point.
            Adding a shipment (courier + tracking ID, picked from the courier directory) moves an order to SHIPPED and
            gives the customer a tracking link.
          </>
        ),
      },
    ],
  },
  {
    id: "enquiries",
    title: "When a quote is the right answer",
    intro: "Corporate buyers rarely accept a list price for 5,000 branded pieces. The enquiry path is the designed route, not a workaround.",
    points: [
      {
        label: "Enquiry-only product",
        text: "Set the pricing mode to Enquiry: no price is exposed anywhere, the CTA becomes Request a quote, and checkout refuses the item. Right for hampers and anything priced per brief.",
      },
      {
        label: "Bulk enquiry on any product",
        text: (
          <>
            Every product page has <Mono>Enquire Now</Mono>. The table-style enquiry form (quantity, branding, delivery
            city, deadline) lands in <Mono>/admin/enquiries</Mono> with its status, so a quote becomes a tracked
            conversation instead of a lost email.
          </>
        ),
      },
      {
        label: "Meetings & messages",
        text: "Book-a-meeting slots arrive in /admin/meetings and contact messages in /admin/messages — both have their own status workflow (pending / confirmed / cancelled, read / unread).",
      },
      {
        label: "WhatsApp",
        text: "The WhatsApp button pre-fills the product name, variant and quantity with a link back to the page, so the sales team sees exactly what the buyer was looking at.",
      },
    ],
  },
  {
    id: "checklist",
    title: "Product launch checklist",
    intro: "Run this top to bottom for every new SKU; each item is a field on this form.",
    points: [
      { label: "1. Identity", text: "Name, brand, unique slug, internal SKU." },
      { label: "2. Picture", text: "Main image (square, ≥1200 px) + up to 12 gallery shots; per-variant images where colours differ." },
      { label: "3. Words", text: "Short description for cards and search; description paragraphs for the page; delivery note." },
      { label: "4. Money", text: "Pricing mode; every tier has min qty + price + MRP; prices quoted GST-inclusive." },
      { label: "5. Compliance", text: "HSN code and GST rate set, so invoices are B2B-ready." },
      { label: "6. Freight", text: "Packed weight and box dimensions (per variant if they differ)." },
      { label: "7. Variants", text: "Axes → Generate → SKUs and stock per row → shared or custom pricing → active flags." },
      { label: "8. Findability", text: "Categories ticked (first one is the breadcrumb), badges chosen, SEO title/description written." },
      { label: "9. Live check", text: "Open the product page and the category page; put 1 piece and one MOQ-sized order in the cart to see the tiers behave." },
    ],
  },
];

/** Anchor-friendly section titles for the handbook page. */
export const PRODUCT_GUIDE_SECTIONS: { key: ProductFormGuideKey; title: string; blurb: string }[] = [
  { key: "basics", title: "Basic information", blurb: "Name, slug, SKU, brand, stock — the identity of the product." },
  { key: "categories", title: "Categories", blurb: "Where the product appears in the browse tree and menus." },
  { key: "images", title: "Images & uploads", blurb: "Main image, gallery, the upload pipeline, sharpness." },
  { key: "content", title: "Content", blurb: "Description, delivery note, what the page adds for you." },
  { key: "pricing", title: "Pricing", blurb: "Single / bulk / enquiry, tiers, MOQ, inclusive pricing." },
  { key: "tax", title: "Tax & shipping", blurb: "HSN, GST split, invoice numbers, weight-based freight." },
  { key: "variants", title: "Variants", blurb: "Axes, generation, shared vs custom pricing, hiding vs deleting." },
  { key: "specs", title: "Specifications", blurb: "Display-only comparison table on the product page." },
  { key: "badges", title: "Visibility & badges", blurb: "Published switch and the three merchandising badges." },
  { key: "seo", title: "SEO", blurb: "Overrides, fallbacks, canonical and social cards." },
];

/** Small helper so form code can drop a guide under a card title in one line. */
export function sectionGuide(key: ProductFormGuideKey) {
  return PRODUCT_FORM_GUIDES[key];
}
