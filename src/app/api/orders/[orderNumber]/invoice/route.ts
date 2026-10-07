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
    include: {
      items: true,
      // Split orders carry their items on per-vendor sub-orders.
      subOrders: {
        orderBy: { subOrderNumber: "asc" },
        include: { items: true, vendor: { select: { name: true } } },
      },
    },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "Cancelled orders have no invoice." }, { status: 409 });
  }
  // Invoices exist only for paid orders — admins stay exempt for records/refunds.
  if (order.paymentStatus !== "PAID" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Payment is pending — the invoice is issued after successful payment." },
      { status: 402 },
    );
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
      items: (
        order.subOrders.length > 0
          ? order.subOrders.flatMap((sub) =>
              sub.items.map((it) => ({ item: it, soldBy: sub.vendor?.name ?? null })),
            )
          : order.items.map((it) => ({ item: it, soldBy: null }))
      ).map(({ item, soldBy }) => ({
        name: item.name,
        variantLabel: item.variantLabel,
        sku: item.sku,
        hsnCode: item.hsnCode,
        gstRate: Number(item.gstRate),
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        soldBy: order.subOrders.length > 1 ? soldBy : null,
      })),
    },
    {
      name: settings.sellerName || SITE.name,
      gstin: settings.sellerGstin,
      pan: settings.sellerPan,
      address: settings.sellerAddress || null,
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
