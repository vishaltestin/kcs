import type { Metadata } from "next";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { CheckoutForm } from "@/components/shop/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your KCS G-Mart corporate gifting order.",
};

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      companyName: true,
      gstNo: true,
      billingAddress: true,
      billingCity: true,
      billingState: true,
      billingPincode: true,
      shippingAddress: true,
      shippingCity: true,
      shippingState: true,
      shippingPincode: true,
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <CheckoutForm
        defaults={{
          customerName: profile ? `${profile.firstName} ${profile.lastName}`.trim() : "",
          customerEmail: profile?.email ?? "",
          customerPhone: profile?.phone ?? "",
          companyName: profile?.companyName ?? "",
          gstNo: profile?.gstNo ?? "",
          billingAddress: profile?.billingAddress ?? "",
          billingCity: profile?.billingCity ?? "",
          billingState: profile?.billingState ?? "",
          billingPincode: profile?.billingPincode ?? "",
          shippingAddress: profile?.shippingAddress ?? "",
          shippingCity: profile?.shippingCity ?? "",
          shippingState: profile?.shippingState ?? "",
          shippingPincode: profile?.shippingPincode ?? "",
        }}
      />
    </div>
  );
}
