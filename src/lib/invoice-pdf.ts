import "server-only";

import path from "node:path";
import PDFDocument from "pdfkit";

import { amountInWords, GST_STATE_CODES, splitInclusive } from "@/lib/tax";
import { formatGrams } from "@/lib/shipping";

/**
 * Tax-invoice PDF (A4) built with pdfkit. Layout:
 *   slim brand band → seller + invoice meta → bill-to / ship-to cards →
 *   airy line-items table (single Tax column) → HSN-wise breakup + totals
 *   with amount-in-words → declaration and signature block.
 *
 * Design notes: light table header (no heavy charcoal band), no zebra rows,
 * one hairline per row, CGST/SGST split carried by the HSN breakup so the
 * main table stays at 8 calm columns for both intra- and inter-state sales.
 *
 * B2B (buyer GSTIN present) and B2C invoices share the layout; the GSTIN row
 * and "Tax Invoice" vs "Invoice" title differ.
 */

export type InvoiceSeller = {
  name: string;
  gstin: string | null;
  pan: string | null;
  address: string | null;
  stateCode: string;
  email: string | null;
  phone: string | null;
};

export type InvoiceOrder = {
  orderNumber: string;
  invoiceNumber: string;
  invoicedAt: Date;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string | null;
  gstNo: string | null;
  placeOfSupply: string | null;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPincode: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  subtotal: number;
  shipping: number;
  total: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  shippingZone: string | null;
  chargeableWeight: number;
  notes: string | null;
  items: {
    name: string;
    variantLabel: string | null;
    sku: string | null;
    hsnCode: string | null;
    gstRate: number;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    /** Fulfilling vendor — shown on split (multi-vendor) orders. */
    soldBy?: string | null;
  }[];
};

const ASSETS = path.join(process.cwd(), "src", "lib", "invoice-assets");
const BRAND = "#0099B5";
const INK = "#111827";
const BODY = "#374151";
const MUTED = "#6b7280";
const RULE = "#e5e7eb";
const PANEL = "#f8fafc";
const PANEL_RULE = "#e2e8f0";

const inr = (n: number) =>
  "₹" +
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Math.round(n * 100) / 100,
  );

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(d);

export async function renderInvoicePdf(order: InvoiceOrder, seller: InvoiceSeller): Promise<Buffer> {
  // `font` points at our bundled TTF so PDFKit never needs its built-in AFM
  // metrics (which live next to the module and break when bundled).
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    font: path.join(ASSETS, "DejaVuSans.ttf"),
    info: { Title: `Invoice ${order.invoiceNumber}`, Author: seller.name },
  });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.registerFont("Body", path.join(ASSETS, "DejaVuSans.ttf"));
  doc.registerFont("Bold", path.join(ASSETS, "DejaVuSans-Bold.ttf"));

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const left = doc.page.margins.left;
  const right = pageW - doc.page.margins.right;
  const width = right - left;
  const interState = order.igst > 0;
  const isB2B = !!order.gstNo;

  const rule = (x1: number, yy: number, x2: number, color = RULE, w = 0.75) => {
    doc.moveTo(x1, yy).lineTo(x2, yy).lineWidth(w).strokeColor(color).stroke();
  };

  const caption = (text: string, x: number, yy: number, color = MUTED) => {
    doc.font("Bold").fontSize(7.5).fillColor(color).text(text.toUpperCase(), x, yy, { characterSpacing: 1.2 });
  };

  /**
   * Single-line cells must NEVER wrap (a wrapped value collides with the
   * row below). pdfkit wraps long unbroken strings despite
   * `lineBreak: false`, so instead we measure and shrink the font until
   * the text provably fits its column.
   */
  const fitSize = (text: string, font: "Body" | "Bold", size: number, maxW: number): number => {
    let s = size;
    while (s > 6.5 && doc.font(font).fontSize(s).widthOfString(text) > maxW) s -= 0.5;
    return s;
  };

  // ── Slim brand band + seller / invoice meta ────────────────────────────
  doc.rect(0, 0, pageW, 4).fill(BRAND);
  let y = 26;
  let logoW = 0;
  try {
    doc.image(path.join(ASSETS, "logo.png"), left, y, { height: 38 });
    logoW = 50;
  } catch {
    /* logo optional */
  }
  const sellerX = left + logoW;
  doc.font("Bold").fontSize(14).fillColor(INK).text(seller.name, sellerX, y + 1, { width: 300 });
  doc.font("Body").fontSize(8).fillColor(MUTED);
  if (seller.address) doc.text(seller.address, sellerX, doc.y + 2, { width: 300 });
  const contact = [seller.phone, seller.email].filter(Boolean).join("  ·  ");
  if (contact) doc.text(contact, sellerX, doc.y + 2, { width: 300 });
  if (seller.gstin) {
    doc.text(`GSTIN ${seller.gstin}${seller.pan ? `  ·  PAN ${seller.pan}` : ""}`, sellerX, doc.y + 2);
  }
  const sellerBottom = doc.y;

  // Invoice meta block (right)
  const metaW = 196;
  const metaX = right - metaW;
  doc.font("Bold").fontSize(19).fillColor(INK).text(isB2B ? "TAX INVOICE" : "INVOICE", metaX, y, { width: metaW, align: "right" });
  doc
    .font("Body")
    .fontSize(8)
    .fillColor(MUTED)
    .text(isB2B ? "B2B · Registered buyer" : "B2C · Retail sale", metaX, y + 24, { width: metaW, align: "right" });
  const meta: [string, string][] = [
    ["Invoice no.", order.invoiceNumber],
    ["Invoice date", fmtDate(order.invoicedAt)],
    ["Order no.", order.orderNumber],
    ["Order date", fmtDate(order.createdAt)],
    [
      "Place of supply",
      order.placeOfSupply
        ? `${GST_STATE_CODES[order.placeOfSupply] ?? order.billingState} (${order.placeOfSupply})`
        : order.billingState,
    ],
  ];
  let my = y + 42;
  for (const [k, v] of meta) {
    doc.font("Body").fontSize(8.5).fillColor(MUTED).text(k, metaX, my, { width: 80, lineBreak: false });
    doc
      .font("Bold")
      .fontSize(fitSize(v, "Bold", 9, 116))
      .fillColor(INK)
      .text(v, metaX + 80, my, { width: 116, align: "right", lineBreak: false });
    my += 15.5;
  }

  y = Math.max(sellerBottom, my) + 16;
  rule(left, y, right);
  y += 16;

  // ── Bill to / Ship to cards ────────────────────────────────────────────
  type PartyLine = { text: string; bold: boolean; size: number };
  const pad = 12;
  const gap = 12;
  const cardW = (width - gap) / 2;
  const cardTextW = cardW - pad * 2;

  const measureCard = (lines: PartyLine[]) => {
    let h = pad + 12; // top pad + caption
    for (const l of lines) {
      h += doc.font(l.bold ? "Bold" : "Body").fontSize(l.size).heightOfString(l.text, { width: cardTextW }) + 3;
    }
    return h + pad - 3;
  };
  const drawCard = (title: string, x: number, top: number, h: number, lines: PartyLine[]) => {
    doc.roundedRect(x, top, cardW, h, 6).fill(PANEL);
    doc.roundedRect(x, top, cardW, h, 6).lineWidth(0.75).stroke(PANEL_RULE);
    caption(title, x + pad, top + pad, BRAND);
    let py = top + pad + 13;
    for (const l of lines) {
      doc
        .font(l.bold ? "Bold" : "Body")
        .fontSize(l.size)
        .fillColor(l.bold ? INK : BODY)
        .text(l.text, x + pad, py, { width: cardTextW });
      py = doc.y + 3;
    }
  };

  const billLines: PartyLine[] = [
    { text: order.companyName || order.customerName, bold: true, size: 10.5 },
    ...(order.companyName ? [{ text: order.customerName, bold: false, size: 8.5 }] : []),
    { text: order.billingAddress, bold: false, size: 8.5 },
    { text: `${order.billingCity}, ${order.billingState} — ${order.billingPincode}`, bold: false, size: 8.5 },
    { text: `${order.customerPhone}  ·  ${order.customerEmail}`, bold: false, size: 8 },
    { text: order.gstNo ? `GSTIN: ${order.gstNo}` : "Unregistered buyer", bold: false, size: 8 },
  ];
  const shipLines: PartyLine[] = [
    { text: order.companyName || order.customerName, bold: true, size: 10.5 },
    { text: order.shippingAddress, bold: false, size: 8.5 },
    { text: `${order.shippingCity}, ${order.shippingState} — ${order.shippingPincode}`, bold: false, size: 8.5 },
    ...(order.shippingZone
      ? [
          {
            text: `Delivery zone ${order.shippingZone}${order.chargeableWeight > 0 ? ` · ${formatGrams(order.chargeableWeight)} chargeable` : ""}`,
            bold: false,
            size: 8,
          },
        ]
      : []),
  ];
  const cardH = Math.max(measureCard(billLines), measureCard(shipLines));
  drawCard("Bill to", left, y, cardH, billLines);
  drawCard("Ship to", left + cardW + gap, y, cardH, shipLines);
  y += cardH + 20;

  // ── Items table ────────────────────────────────────────────────────────
  // One calm 8-column schema for both intra- and inter-state sales: the
  // CGST/SGST split lives in the HSN breakup below, so the main table shows
  // a single Tax column (amount + rate).
  const cols = [
    { key: "sn", label: "#", w: 30, align: "left" as const },
    { key: "desc", label: "Description", w: 0, align: "left" as const }, // flex
    { key: "hsn", label: "HSN", w: 58, align: "left" as const },
    { key: "qty", label: "Qty", w: 30, align: "right" as const },
    { key: "rate", label: "Rate", w: 60, align: "right" as const },
    { key: "taxable", label: "Taxable", w: 66, align: "right" as const },
    { key: "tax", label: "Tax", w: 62, align: "right" as const },
    { key: "total", label: "Total", w: 76, align: "right" as const },
  ];
  cols[1].w = width - cols.reduce((s, c) => s + c.w, 0);

  const drawTableHeader = () => {
    let x = left + 6;
    doc.font("Bold").fontSize(7.5).fillColor(MUTED);
    for (const c of cols) {
      doc.text(c.label.toUpperCase(), x, y, { width: c.w - 10, align: c.align, characterSpacing: 0.8, lineBreak: false });
      x += c.w;
    }
    rule(left, y + 15, right, "#9ca3af", 1);
    y += 21;
  };
  drawTableHeader();

  const rows = [
    ...order.items.map((it) => ({ ...it, isShipping: false })),
    ...(order.shipping > 0
      ? [
          {
            name: "Shipping & handling",
            variantLabel: order.shippingZone,
            sku: null,
            hsnCode: "996812",
            gstRate: 18,
            quantity: 1,
            unitPrice: order.shipping,
            lineTotal: order.shipping,
            soldBy: null,
            isShipping: true,
          },
        ]
      : []),
  ];

  const CELL = 6;
  rows.forEach((it, i) => {
    const { taxable, tax } = splitInclusive(it.lineTotal, it.gstRate);
    const unitTaxable = splitInclusive(it.unitPrice, it.gstRate).taxable;
    const name = `${it.name}${it.variantLabel ? ` (${it.variantLabel})` : ""}`;
    const sub = [
      it.sku ? `SKU ${it.sku}` : null,
      `${it.gstRate}% GST`,
      it.soldBy ? `Sold by ${it.soldBy}` : null,
    ]
      .filter(Boolean)
      .join("  ·  ");
    const descW = cols[1].w - CELL * 2;
    const descH =
      doc.font("Bold").fontSize(8.5).heightOfString(name, { width: descW }) +
      2 +
      doc.font("Body").fontSize(7.5).heightOfString(sub, { width: descW });
    const taxH =
      doc.font("Body").fontSize(8.5).heightOfString(inr(tax), { width: cols[6].w }) +
      2 +
      doc.font("Body").fontSize(7).heightOfString(`${it.gstRate}%`, { width: cols[6].w });
    const rowH = Math.max(38, descH + 18, taxH + 18);

    if (y + rowH > pageH - 150) {
      doc.addPage();
      y = 40;
      drawTableHeader();
    }

    let x = left + CELL;
    // #
    doc.font("Body").fontSize(8.5).fillColor(BODY).text(String(i + 1), x, y + 9, { width: cols[0].w - CELL * 2, lineBreak: false });
    x += cols[0].w;
    // Description
    doc.font("Bold").fontSize(8.5).fillColor(INK).text(name, x, y + 9, { width: descW });
    doc.font("Body").fontSize(7.5).fillColor(MUTED).text(sub, x, doc.y + 2, { width: descW });
    x += cols[1].w;
    // HSN
    doc
      .font("Body")
      .fontSize(fitSize(it.hsnCode ?? "—", "Body", 8, cols[2].w - CELL * 2))
      .fillColor(BODY)
      .text(it.hsnCode ?? "—", x, y + 9, { width: cols[2].w - CELL * 2, lineBreak: false });
    x += cols[2].w;
    // Qty / Rate / Taxable — numeric cells never wrap.
    const num = (v: string, w: number, bold: boolean, size: number, yy: number) => {
      const fitted = fitSize(v, bold ? "Bold" : "Body", size, w - CELL * 2);
      doc
        .font(bold ? "Bold" : "Body")
        .fontSize(fitted)
        .fillColor(INK)
        .text(v, x, yy, { width: w - CELL * 2, align: "right", lineBreak: false });
      x += w;
    };
    num(String(it.quantity), cols[3].w, false, 8.5, y + 9);
    num(inr(unitTaxable), cols[4].w, false, 8.5, y + 9);
    num(inr(taxable), cols[5].w, false, 8.5, y + 9);
    // Tax: amount + rate beneath
    num(inr(tax), cols[6].w, false, 8.5, y + 9);
    x -= cols[6].w;
    doc
      .font("Body")
      .fontSize(7)
      .fillColor(MUTED)
      .text(`${it.gstRate}%`, x, y + 21, { width: cols[6].w - CELL * 2, align: "right", lineBreak: false });
    x += cols[6].w;
    // Total
    num(inr(it.lineTotal), cols[7].w, true, 9, y + 9);

    y += rowH;
    rule(left, y, right);
  });

  y += 20;
  if (y > pageH - 240) {
    doc.addPage();
    y = 40;
  }

  // ── HSN breakup (left) + totals (right) ────────────────────────────────
  const hsnMap = new Map<string, { rate: number; taxable: number; tax: number }>();
  for (const r of rows) {
    const key = `${r.hsnCode ?? "—"}|${r.gstRate}`;
    const { taxable, tax } = splitInclusive(r.lineTotal, r.gstRate);
    const prev = hsnMap.get(key) ?? { rate: r.gstRate, taxable: 0, tax: 0 };
    hsnMap.set(key, { rate: r.gstRate, taxable: prev.taxable + taxable, tax: prev.tax + tax });
  }
  // Keep the breakup block together — a caption stranded at a page bottom
  // with its rows on the next page reads as a rendering bug.
  if (y + 24 + hsnMap.size * 16 > pageH - 120) {
    doc.addPage();
    y = 40;
  }
  const leftW = width * 0.56;
  const totalsX = left + leftW + 24;
  const totalsW = right - totalsX;

  caption("Tax breakup — HSN wise", left, y);
  let hy = y + 15;
  const hCols = interState
    ? [
        { label: "HSN", w: 66, align: "left" as const },
        { label: "Taxable", w: 84, align: "right" as const },
        { label: "Rate", w: 44, align: "right" as const },
        { label: "IGST", w: 76, align: "right" as const },
      ]
    : [
        { label: "HSN", w: 58, align: "left" as const },
        { label: "Taxable", w: 78, align: "right" as const },
        { label: "Rate", w: 40, align: "right" as const },
        { label: "CGST", w: 56, align: "right" as const },
        { label: "SGST", w: 56, align: "right" as const },
      ];
  {
    let hx = left + 4;
    doc.font("Bold").fontSize(7.5).fillColor(MUTED);
    for (const c of hCols) {
      doc.text(c.label, hx, hy, { width: c.w - 8, align: c.align, lineBreak: false });
      hx += c.w;
    }
    rule(left, hy + 13, left + leftW, "#9ca3af", 0.75);
    hy += 19;
    for (const [key, v] of hsnMap) {
      const hsn = key.split("|")[0];
      const cells = interState
        ? [hsn, inr(v.taxable), `${v.rate}%`, inr(v.tax)]
        : [hsn, inr(v.taxable), `${v.rate}%`, inr(v.tax / 2), inr(v.tax - Math.round((v.tax / 2) * 100) / 100)];
      hx = left + 4;
      doc.font("Body").fillColor(INK);
      cells.forEach((cell, ci) => {
        const cw = hCols[ci].w - 8;
        doc.fontSize(fitSize(cell, "Body", 8, cw));
        doc.text(cell, hx, hy, { width: cw, align: hCols[ci].align, lineBreak: false });
        hx += hCols[ci].w;
      });
      hy += 16;
      rule(left, hy, left + leftW);
    }
  }

  // Totals
  const totalRows: [string, string][] = [
    ["Taxable value", inr(order.taxableAmount)],
    ...(interState
      ? ([["IGST", inr(order.igst)]] as [string, string][])
      : ([
          ["CGST", inr(order.cgst)],
          ["SGST", inr(order.sgst)],
        ] as [string, string][])),
    ["Items (incl. GST)", inr(order.subtotal)],
    ["Shipping (incl. GST)", order.shipping > 0 ? inr(order.shipping) : "Free"],
  ];
  let ty = y + 2;
  for (const [k, v] of totalRows) {
    doc.font("Body").fontSize(9).fillColor(BODY).text(k, totalsX, ty, { width: totalsW * 0.58 });
    doc
      .font("Bold")
      .fontSize(fitSize(v, "Bold", 9.5, totalsW - 2))
      .fillColor(INK)
      .text(v, totalsX, ty, { width: totalsW - 2, align: "right", lineBreak: false });
    ty += 19;
  }
  ty += 4;
  doc.roundedRect(totalsX, ty, totalsW, 30, 5).fill(INK);
  doc.font("Bold").fontSize(10).fillColor("#ffffff").text("Grand total", totalsX + 10, ty + 9, { lineBreak: false });
  doc
    .font("Bold")
    .fontSize(fitSize(inr(order.total), "Bold", 12.5, totalsW - 10))
    .fillColor("#ffffff")
    .text(inr(order.total), totalsX, ty + 6.5, { width: totalsW - 10, align: "right", lineBreak: false });
  ty += 38;

  y = Math.max(hy, ty) + 18;

  // Amount in words — full width, its own moment. Kept together: never
  // leave the caption orphaned at a page bottom.
  if (y > pageH - 120) {
    doc.addPage();
    y = 40;
  }
  caption("Amount in words", left, y);
  doc.font("Body").fontSize(9).fillColor(INK).text(amountInWords(order.total), left, y + 14, { width });
  y = doc.y + 18;
  if (y > pageH - 150) {
    doc.addPage();
    y = 40;
  }

  // ── Footer: declaration, signature ─────────────────────────────────────
  const declW = width * 0.6;
  const declText =
    "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Prices are inclusive of GST. Goods once sold are not returnable except for manufacturing defects reported within 48 hours of delivery." +
    (order.notes ? `\nOrder notes: ${order.notes}` : "");
  // Order notes can be long — measure first so the block never collides
  // with the page footer.
  const declH =
    12 + 14 + doc.font("Body").fontSize(7.5).heightOfString(declText, { width: declW, lineGap: 1.5 });
  if (y + declH > pageH - 64) {
    doc.addPage();
    y = 40;
  }
  rule(left, y, right);
  y += 12;
  caption("Declaration", left, y);
  doc.font("Body").fontSize(7.5).fillColor(BODY).text(declText, left, y + 14, { width: declW, lineGap: 1.5 });
  const sigX = left + declW + 24;
  const sigW = right - sigX;
  doc.font("Body").fontSize(8.5).fillColor(MUTED).text(`For ${seller.name}`, sigX, y + 2, { width: sigW, align: "right" });
  rule(right - 140, y + 48, right, BODY, 0.75);
  doc.font("Bold").fontSize(8).fillColor(INK).text("Authorised signatory", sigX, y + 52, { width: sigW, align: "right" });

  // Page footer — kept inside the bottom margin, otherwise PDFKit's auto
  // page-break would spill it onto a blank trailing page.
  const footY = pageH - doc.page.margins.bottom - 14;
  doc
    .font("Body")
    .fontSize(7)
    .fillColor(MUTED)
    .text(`${seller.name} · ${order.invoiceNumber} · This is a computer-generated invoice.`, left, footY, {
      width,
      align: "center",
      lineBreak: false,
    });

  doc.end();
  return done;
}
