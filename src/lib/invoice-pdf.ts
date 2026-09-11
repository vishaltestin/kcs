import "server-only";

import path from "node:path";
import PDFDocument from "pdfkit";

import { amountInWords, GST_STATE_CODES, splitInclusive } from "@/lib/tax";
import { formatGrams } from "@/lib/shipping";

/**
 * Tax-invoice PDF (A4) built with pdfkit. Layout:
 *   header band (seller + invoice meta) → bill-to / ship-to → line items with
 *   HSN, qty, rate, taxable value and GST → HSN-wise tax summary → totals,
 *   amount in words, bank/notes and signature block.
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
  }[];
};

const ASSETS = path.join(process.cwd(), "src", "lib", "invoice-assets");
const BRAND_RED = "#C31C18";
const CHARCOAL = "#444444";
const INK = "#1f2937";
const MUTED = "#6b7280";
const RULE = "#e5e7eb";
const SURFACE = "#f7f7f8";

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
  const left = doc.page.margins.left;
  const right = pageW - doc.page.margins.right;
  const width = right - left;
  const interState = order.igst > 0;
  const isB2B = !!order.gstNo;

  // ── Header band ────────────────────────────────────────────────────────
  doc.rect(0, 0, pageW, 6).fill(BRAND_RED);
  let y = 28;
  try {
    doc.image(path.join(ASSETS, "logo.png"), left, y, { height: 44 });
  } catch {
    /* logo optional */
  }
  doc.font("Bold").fontSize(15).fillColor(INK).text(seller.name, left + 56, y + 2);
  doc.font("Body").fontSize(8.5).fillColor(MUTED);
  if (seller.address) doc.text(seller.address, left + 56, y + 21, { width: 300 });
  const contact = [seller.phone, seller.email].filter(Boolean).join("  ·  ");
  if (contact) doc.text(contact, left + 56, doc.y + 1, { width: 300 });
  if (seller.gstin) doc.text(`GSTIN ${seller.gstin}${seller.pan ? `  ·  PAN ${seller.pan}` : ""}`, left + 56, doc.y + 1);

  // Invoice meta block (right)
  const metaX = right - 200;
  doc.font("Bold").fontSize(18).fillColor(BRAND_RED).text(isB2B ? "TAX INVOICE" : "INVOICE", metaX, y, { width: 200, align: "right" });
  doc.font("Body").fontSize(8.5).fillColor(MUTED).text(isB2B ? "B2B · Recipient registered under GST" : "B2C · Unregistered recipient", metaX, y + 22, { width: 200, align: "right" });
  const meta: [string, string][] = [
    ["Invoice No.", order.invoiceNumber],
    ["Invoice date", fmtDate(order.invoicedAt)],
    ["Order No.", order.orderNumber],
    ["Order date", fmtDate(order.createdAt)],
    ["Place of supply", order.placeOfSupply ? `${GST_STATE_CODES[order.placeOfSupply] ?? order.billingState} (${order.placeOfSupply})` : order.billingState],
  ];
  let my = y + 38;
  for (const [k, v] of meta) {
    doc.font("Body").fontSize(8.5).fillColor(MUTED).text(k, metaX, my, { width: 90, align: "left" });
    doc.font("Bold").fontSize(8.5).fillColor(INK).text(v, metaX + 90, my, { width: 110, align: "right" });
    my += 13;
  }

  y = Math.max(my, doc.y) + 14;
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.8).strokeColor(RULE).stroke();
  y += 14;

  // ── Bill to / Ship to ──────────────────────────────────────────────────
  const colW = width / 2 - 10;
  const party = (title: string, x: number, lines: string[]) => {
    doc.font("Bold").fontSize(7.5).fillColor(BRAND_RED).text(title.toUpperCase(), x, y, { characterSpacing: 1 });
    let py = y + 12;
    lines.forEach((line, i) => {
      doc.font(i === 0 ? "Bold" : "Body").fontSize(i === 0 ? 10 : 8.5).fillColor(i === 0 ? INK : CHARCOAL).text(line, x, py, { width: colW });
      py = doc.y + 1.5;
    });
    return py;
  };
  const billLines = [
    order.companyName || order.customerName,
    ...(order.companyName ? [order.customerName] : []),
    order.billingAddress,
    `${order.billingCity}, ${order.billingState} — ${order.billingPincode}`,
    `${order.customerPhone}  ·  ${order.customerEmail}`,
    ...(order.gstNo ? [`GSTIN ${order.gstNo}`] : ["GSTIN — (unregistered)"]),
  ];
  const shipLines = [
    order.companyName || order.customerName,
    order.shippingAddress,
    `${order.shippingCity}, ${order.shippingState} — ${order.shippingPincode}`,
    ...(order.shippingZone ? [`Zone: ${order.shippingZone}${order.chargeableWeight > 0 ? ` · ${formatGrams(order.chargeableWeight)} chargeable` : ""}`] : []),
  ];
  const y1 = party("Bill to", left, billLines);
  const y2 = party("Ship to", left + colW + 20, shipLines);
  y = Math.max(y1, y2) + 12;

  // ── Items table ────────────────────────────────────────────────────────
  // Widths sum to 515 (A4 minus margins); numeric columns are sized for
  // amounts up to ₹9,99,999.00 at 8 pt without wrapping.
  const cols = interState
    ? [
        { key: "sn", label: "#", w: 16, align: "left" as const },
        { key: "desc", label: "Description", w: 158, align: "left" as const },
        { key: "hsn", label: "HSN", w: 42, align: "left" as const },
        { key: "qty", label: "Qty", w: 30, align: "right" as const },
        { key: "rate", label: "Rate", w: 60, align: "right" as const },
        { key: "taxable", label: "Taxable", w: 70, align: "right" as const },
        { key: "igst", label: "IGST", w: 62, align: "right" as const },
        { key: "total", label: "Total", w: 77, align: "right" as const },
      ]
    : [
        { key: "sn", label: "#", w: 16, align: "left" as const },
        { key: "desc", label: "Description", w: 128, align: "left" as const },
        { key: "hsn", label: "HSN", w: 48, align: "left" as const },
        { key: "qty", label: "Qty", w: 28, align: "right" as const },
        { key: "rate", label: "Rate", w: 54, align: "right" as const },
        { key: "taxable", label: "Taxable", w: 66, align: "right" as const },
        { key: "cgst", label: "CGST", w: 52, align: "right" as const },
        { key: "sgst", label: "SGST", w: 52, align: "right" as const },
        { key: "total", label: "Total", w: 71, align: "right" as const },
      ];
  const tableW = cols.reduce((s, c) => s + c.w, 0);
  const scale = width / tableW;
  cols.forEach((c) => (c.w = c.w * scale));

  const drawHeader = () => {
    doc.rect(left, y, width, 20).fill(CHARCOAL);
    let x = left + 6;
    doc.font("Bold").fontSize(7.5).fillColor("#ffffff");
    for (const c of cols) {
      doc.text(c.label.toUpperCase(), x, y + 6.5, { width: c.w - 8, align: c.align, characterSpacing: 0.6 });
      x += c.w;
    }
    y += 20;
  };
  drawHeader();

  const rows = [
    ...order.items.map((it) => ({ ...it, isShipping: false })),
    ...(order.shipping > 0
      ? [{ name: "Shipping & handling", variantLabel: order.shippingZone, sku: null, hsnCode: "996812", gstRate: 18, quantity: 1, unitPrice: order.shipping, lineTotal: order.shipping, isShipping: true }]
      : []),
  ];

  rows.forEach((it, i) => {
    const { taxable, tax } = splitInclusive(it.lineTotal, it.gstRate);
    const unitTaxable = splitInclusive(it.unitPrice, it.gstRate).taxable;
    const desc = `${it.name}${it.variantLabel ? ` — ${it.variantLabel}` : ""}`;
    const sub = [it.sku ? `SKU ${it.sku}` : null, `GST ${it.gstRate}%`].filter(Boolean).join(" · ");
    const descH = doc.font("Body").fontSize(8.5).heightOfString(desc, { width: cols[1].w - 8 }) + 11;
    const rowH = Math.max(24, descH + 4);

    if (y + rowH > doc.page.height - 200) {
      doc.addPage();
      y = 40;
      drawHeader();
    }
    if (i % 2 === 1) doc.rect(left, y, width, rowH).fill(SURFACE);

    const values: Record<string, string> = {
      sn: String(i + 1),
      desc,
      hsn: it.hsnCode ?? "—",
      qty: String(it.quantity),
      rate: inr(unitTaxable),
      taxable: inr(taxable),
      igst: inr(tax),
      cgst: inr(tax / 2),
      sgst: inr(tax - Math.round((tax / 2) * 100) / 100),
      total: inr(it.lineTotal),
    };
    let x = left + 6;
    for (const c of cols) {
      const isDesc = c.key === "desc";
      const numeric = c.align === "right";
      doc
        .font(isDesc ? "Bold" : "Body")
        .fontSize(numeric ? 8 : 8.5)
        .fillColor(INK)
        // Numeric cells never wrap — a wrapped amount is worse than a tight one.
        .text(values[c.key] ?? "", x, y + 6, { width: c.w - 8, align: c.align, lineBreak: !numeric && c.key !== "hsn" });
      if (isDesc) {
        doc.font("Body").fontSize(7).fillColor(MUTED).text(sub, x, doc.y + 0.5, { width: c.w - 8 });
      }
      x += c.w;
    }
    y += rowH;
    doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor(RULE).stroke();
  });

  y += 14;
  if (y > doc.page.height - 260) {
    doc.addPage();
    y = 40;
  }

  // ── HSN summary (left) + totals (right) ───────────────────────────────
  const hsnMap = new Map<string, { rate: number; taxable: number; tax: number }>();
  for (const r of rows) {
    const key = `${r.hsnCode ?? "—"}|${r.gstRate}`;
    const { taxable, tax } = splitInclusive(r.lineTotal, r.gstRate);
    const prev = hsnMap.get(key) ?? { rate: r.gstRate, taxable: 0, tax: 0 };
    hsnMap.set(key, { rate: r.gstRate, taxable: prev.taxable + taxable, tax: prev.tax + tax });
  }
  const leftW = width * 0.56;
  const totalsX = left + leftW + 20;
  const totalsW = right - totalsX;

  doc.font("Bold").fontSize(7.5).fillColor(BRAND_RED).text("HSN-WISE TAX SUMMARY", left, y, { characterSpacing: 1 });
  let hy = y + 13;
  const hCols = interState
    ? [["HSN", 70, "left"], ["Taxable", 80, "right"], ["Rate", 40, "right"], ["IGST", 70, "right"]]
    : [["HSN", 60, "left"], ["Taxable", 74, "right"], ["Rate", 36, "right"], ["CGST", 55, "right"], ["SGST", 55, "right"]];
  const hScale = leftW / hCols.reduce((s, c) => s + (c[1] as number), 0);
  doc.rect(left, hy, leftW, 16).fill(SURFACE);
  let hx = left + 4;
  doc.font("Bold").fontSize(7.5).fillColor(CHARCOAL);
  for (const [label, w, align] of hCols) {
    doc.text(String(label), hx, hy + 4.5, { width: (w as number) * hScale - 6, align: align as "left" | "right" });
    hx += (w as number) * hScale;
  }
  hy += 16;
  for (const [key, v] of hsnMap) {
    const hsn = key.split("|")[0];
    const cells = interState
      ? [hsn, inr(v.taxable), `${v.rate}%`, inr(v.tax)]
      : [hsn, inr(v.taxable), `${v.rate}%`, inr(v.tax / 2), inr(v.tax - Math.round((v.tax / 2) * 100) / 100)];
    hx = left + 4;
    doc.font("Body").fontSize(8).fillColor(INK);
    cells.forEach((cell, ci) => {
      doc.text(cell, hx, hy + 4, { width: (hCols[ci][1] as number) * hScale - 6, align: hCols[ci][2] as "left" | "right", lineBreak: false });
      hx += (hCols[ci][1] as number) * hScale;
    });
    hy += 15;
    doc.moveTo(left, hy).lineTo(left + leftW, hy).lineWidth(0.5).strokeColor(RULE).stroke();
  }

  // Totals
  const totalTax = order.cgst + order.sgst + order.igst;
  const totalRows: [string, string, boolean][] = [
    ["Taxable value", inr(order.taxableAmount), false],
    ...(interState
      ? ([["IGST", inr(order.igst), false]] as [string, string, boolean][])
      : ([
          ["CGST", inr(order.cgst), false],
          ["SGST", inr(order.sgst), false],
        ] as [string, string, boolean][])),
    ["Total tax", inr(totalTax), false],
    ["Items (incl. GST)", inr(order.subtotal), false],
    ["Shipping (incl. GST)", order.shipping > 0 ? inr(order.shipping) : "Free", false],
    ["Grand total", inr(order.total), true],
  ];
  let ty = y;
  for (const [k, v, strong] of totalRows) {
    if (strong) {
      doc.rect(totalsX, ty - 2, totalsW, 22).fill(BRAND_RED);
      doc.font("Bold").fontSize(10).fillColor("#ffffff").text(k, totalsX + 8, ty + 4, { width: totalsW / 2 });
      doc.font("Bold").fontSize(11).fillColor("#ffffff").text(v, totalsX, ty + 3, { width: totalsW - 8, align: "right" });
      ty += 26;
    } else {
      doc.font("Body").fontSize(8.5).fillColor(MUTED).text(k, totalsX + 8, ty, { width: totalsW / 2 });
      doc.font("Bold").fontSize(8.5).fillColor(INK).text(v, totalsX, ty, { width: totalsW - 8, align: "right" });
      ty += 15;
    }
  }
  doc.font("Body").fontSize(7.5).fillColor(MUTED).text(amountInWords(order.total), totalsX, ty + 2, { width: totalsW, align: "right" });
  ty = doc.y + 4;

  y = Math.max(hy, ty) + 18;
  if (y > doc.page.height - 120) {
    doc.addPage();
    y = 40;
  }

  // ── Footer: notes, declaration, signature ─────────────────────────────
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.8).strokeColor(RULE).stroke();
  y += 10;
  doc.font("Bold").fontSize(7.5).fillColor(BRAND_RED).text("DECLARATION", left, y, { characterSpacing: 1 });
  doc
    .font("Body")
    .fontSize(7.5)
    .fillColor(CHARCOAL)
    .text(
      "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Prices are inclusive of GST. Goods once sold are not returnable except for manufacturing defects reported within 48 hours of delivery." +
        (order.notes ? `\nOrder notes: ${order.notes}` : ""),
      left,
      y + 12,
      { width: leftW, lineGap: 1.5 },
    );
  doc.font("Body").fontSize(8).fillColor(MUTED).text(`For ${seller.name}`, totalsX, y + 4, { width: totalsW, align: "right" });
  doc.font("Bold").fontSize(8).fillColor(INK).text("Authorised signatory", totalsX, y + 48, { width: totalsW, align: "right" });
  doc.moveTo(totalsX + totalsW - 120, y + 44).lineTo(right, y + 44).lineWidth(0.5).strokeColor(CHARCOAL).stroke();

  // Page footer — kept inside the bottom margin, otherwise PDFKit's auto
  // page-break would spill it onto a blank trailing page.
  const footY = doc.page.height - doc.page.margins.bottom - 14;
  doc
    .font("Body")
    .fontSize(7)
    .fillColor(MUTED)
    .text(`${seller.name} · ${order.invoiceNumber} · This is a computer-generated invoice.`, left, footY, { width, align: "center", lineBreak: false });

  doc.end();
  return done;
}
