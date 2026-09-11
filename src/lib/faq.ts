/**
 * Frequently asked questions — single source of truth for the /faq page and
 * its FAQPage JSON-LD. Plain strings only (rendered as text, never as HTML).
 */

export type FaqItem = { q: string; a: string };
export type FaqSection = { id: string; title: string; blurb: string; items: FaqItem[] };

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "ordering",
    title: "Ordering & minimum quantities",
    blurb: "How bulk pricing, MOQs and single-piece products work.",
    items: [
      {
        q: "Is there a minimum order quantity?",
        a: "It depends on the product. Bulk-priced items show a minimum order quantity (MOQ) and a slab table — the unit price drops as your quantity grows. Products marked as single-unit can be ordered from just one piece, and enquiry-only items are quoted per brief.",
      },
      {
        q: "How does tiered bulk pricing work?",
        a: "Each slab shows the price per piece for a quantity range, for example 10–49 pieces at ₹749 and 50+ at ₹689. Your cart automatically applies the slab that matches the quantity you enter, and the final price is re-checked on our side when the order is placed.",
      },
      {
        q: "Can I mix different products to reach a bulk price?",
        a: "Slabs are calculated per product, so quantities do not combine across items. If you are building mixed hampers or kits, request a quote and we will price the whole programme together — mixed orders usually get a better overall rate.",
      },
      {
        q: "What does “Price on request” mean?",
        a: "Some products are customised to such a degree (branding, packaging, sourcing) that a fixed price would be misleading. Use Request a quote on the product page, tell us the quantity and branding you need, and a gifting manager will reply with a formal quotation, typically within a few working hours.",
      },
      {
        q: "Do I need an account to order?",
        a: "You can browse, add to cart and request quotes without signing in. To place an order and track it later you will be asked to create a free account at checkout, which takes under a minute.",
      },
    ],
  },
  {
    id: "branding",
    title: "Branding & customisation",
    blurb: "Logos, mock-ups, packaging and personalisation.",
    items: [
      {
        q: "Can you add our company logo to the products?",
        a: "Yes. Depending on the item we offer screen printing, embroidery, laser engraving, UV printing, debossing and full-colour sublimation. Tell us where you would like the logo and we will recommend the best method for that material.",
      },
      {
        q: "Will I see a mock-up before you produce anything?",
        a: "Always. After we receive your artwork we share a digital mock-up for approval, and for larger runs we can arrange a physical pre-production sample. Nothing goes into production until you sign off.",
      },
      {
        q: "What artwork format do you need?",
        a: "Vector files work best — AI, EPS, PDF or SVG. A high-resolution PNG on a transparent background is fine for most printing methods. If you only have a low-resolution logo, our design team can redraw it for a small fee.",
      },
      {
        q: "Can each gift be personalised with an employee’s name?",
        a: "Yes, name personalisation is available on many items such as diaries, bottles, pens and apparel. Share a spreadsheet of names with your order and we will take care of the rest.",
      },
      {
        q: "Do you offer branded packaging and gift boxes?",
        a: "We do — printed sleeves, rigid gift boxes, tissue, ribbon and greeting cards can all carry your branding. Packaging is quoted alongside the products so you see one consolidated price.",
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery & timelines",
    blurb: "Lead times, shipping charges and pan-India dispatch.",
    items: [
      {
        q: "How long does an order take?",
        a: "Ready-stock items without branding usually dispatch within 2–4 working days. Branded orders typically take 7–12 working days after artwork approval, depending on quantity and technique. Festival season is busy, so we recommend confirming Diwali and New Year orders 4–6 weeks ahead.",
      },
      {
        q: "What are the shipping charges?",
        a: "Standard shipping is free on orders above ₹1,000; smaller orders carry a flat ₹100 shipping fee. Bulky consignments, multi-location deliveries and express courier are quoted separately so there are no surprises.",
      },
      {
        q: "Do you deliver across India?",
        a: "Yes, we ship pan-India through reputed courier and logistics partners, including to remote pin codes. For international deliveries please talk to us — we handle export documentation on request.",
      },
      {
        q: "Can you ship directly to our employees’ homes?",
        a: "Absolutely. For work-from-home teams we run multi-address dispatch: share an address sheet and each recipient gets a tracked parcel, with a consolidated tracking report sent back to you.",
      },
      {
        q: "How do I track my order?",
        a: "Once dispatched you will receive the courier name and tracking number by email. Signed-in customers can also see the status of every order under My Account → Orders.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments, GST & invoicing",
    blurb: "Payment options, tax invoices and credit terms.",
    items: [
      {
        q: "Which payment methods do you accept?",
        a: "Bank transfer (NEFT / RTGS / IMPS), UPI, and all major credit and debit cards. Purchase-order based billing with credit terms is available for established corporate accounts.",
      },
      {
        q: "Will I get a GST invoice?",
        a: "Yes. Every order comes with a GST-compliant tax invoice. Enter your company name and GSTIN at checkout and they will appear on the invoice so you can claim input credit.",
      },
      {
        q: "Do you require an advance for bulk orders?",
        a: "For customised orders we typically take a 50% advance to begin production, with the balance due before dispatch. Standard stock orders are paid in full at checkout.",
      },
      {
        q: "Can I get a formal quotation for my procurement team?",
        a: "Of course. Use Get a Quick Quotation or the bulk-enquiry form on any product and we will send a PDF quotation on our letterhead with itemised pricing, GST and delivery terms.",
      },
    ],
  },
  {
    id: "returns",
    title: "Quality, returns & support",
    blurb: "What happens if something is not right.",
    items: [
      {
        q: "What is your return policy?",
        a: "Unbranded, unused products in original packaging can be returned within 7 days of delivery. Customised or branded goods cannot be returned unless they are defective or differ from the approved mock-up — in which case we replace them at no cost.",
      },
      {
        q: "What if items arrive damaged?",
        a: "Please photograph the packaging and the damaged items and email us within 48 hours of delivery. We will arrange a replacement or credit straight away and take up the claim with the courier ourselves.",
      },
      {
        q: "Do I get a dedicated point of contact?",
        a: "Yes. Every corporate account is assigned a gifting manager who handles your quotations, mock-ups, timelines and after-sales support — one person, start to finish.",
      },
      {
        q: "How do I reach you?",
        a: "Call +91 78 3815 2753 (Mon–Sat, 10 am – 7 pm IST), use the contact form, or message us on WhatsApp from any product page. You can also book a 20-minute video consultation directly from the site.",
      },
    ],
  },
];
