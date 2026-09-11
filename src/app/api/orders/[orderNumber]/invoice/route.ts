import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { ensureInvoiceNumber } from "@/lib/invoice";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { getStoreSettings } from "@/lib/queries/shipping";
import { SITE } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/orders/:orderNumber/invoice[?download=1]
 * Streams the PDF invoice. Customers can only fetch their own orders; admins
 * can fetch any. Legacy orders without a number get one on first request.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ orderNumber: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { orderNumber } = await ctx.params;
  if (!/^[A-Z0-9-]{6,40}$/i.test(orderNumber)) {
    return NextResponse.json({ error: "Invalid order number." }, { status: 400 });
  }

  const order = await db.order.findFirst({
    where: user.role === "ADMIN" ? { orderNumber } : { orderNumber, userId: user.id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "Cancelled orders have no invoice." }, { status: 409 });
  }

  const invoiceNumber = order.invoiceNumber ?? (await ensureInvoiceNumber(order.id));
  const settings = await getStoreSettings();

  const pdf = await renderInvoicePdf(
    {
      orderNumber: order.orderNumber,
      invoiceNumber,
      invoicedAt: order.invoicedAt ?? order.createdAt,
      createdAt: order.createdAt,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      companyName: order.companyName,
      gstNo: order.gstNo,
      placeOfSupply: order.placeOfSupply,
      billingAddress: order.billingAddress,
      billingCity: order.billingCity,
      billingState: order.billingState,
      billingPincode: order.billingPincode,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingPincode: order.shippingPincode,
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      total: Number(order.total),
      taxableAmount: Number(order.taxableAmount),
      cgst: Number(order.cgst),
      sgst: Number(order.sgst),
      igst: Number(order.igst),
      shippingZone: order.shippingZone,
      chargeableWeight: order.chargeableWeight,
      notes: order.notes,
      items: order.items.map((it) => ({
        name: it.name,
        variantLabel: it.variantLabel,
        sku: it.sku,
        hsnCode: it.hsnCode,
        gstRate: Number(it.gstRate),
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        lineTotal: Number(it.lineTotal),
      })),
    },
    {
      name: settings.sellerName || SITE.name,
      gstin: settings.sellerGstin,
      pan: settings.sellerPan,
      address: settings.sellerAddress ?? SITE.address,
      stateCode: settings.sellerStateCode,
      email: settings.sellerEmail ?? SITE.email,
      phone: settings.sellerPhone ?? SITE.phone,
    },
  );

  const url = new URL(_req.url);
  const disposition = url.searchParams.get("download") ? "attachment" : "inline";
  const filename = `${invoiceNumber.replace(/[^A-Za-z0-9-]+/g, "-")}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.length),
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
