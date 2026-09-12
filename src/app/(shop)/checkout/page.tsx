import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { CheckoutForm } from "@/components/shop/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your KCS G-Mart corporate gifting order.",
};

const STEPS = ["Cart", "Details", "Confirmation"] as const;

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
    <div>
      <div className="container py-8 md:py-10">
        <div className="mb-10 flex flex-col gap-5 border-b border-foreground/[0.12] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/cart" className="hover:text-primary">
                Cart
              </Link>
              <ChevronRight className="size-3" aria-hidden />
              <span className="font-medium text-foreground">Checkout</span>
            </nav>
            <h1 className="display flex items-center gap-3 text-[2.25rem] md:text-[2.9rem]">
              Checkout
              <span className="hidden items-center gap-1 text-[11px] font-semibold tracking-[0.14em] text-success uppercase sm:inline-flex">
                <Lock className="size-3" aria-hidden /> Secure
              </span>
            </h1>
          </div>

          <ol className="flex items-center gap-2 text-[13px] font-medium" aria-label="Checkout progress">
            {STEPS.map((step, i) => {
              const current = i === 1;
              const done = i < 1;
              return (
                <li key={step} className="flex items-center gap-2">
                  <span
                    className={[
                      "numeral text-[13px]",
                      current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground/60",
                    ].join(" ")}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={current ? "font-semibold text-foreground" : "text-muted-foreground"}>{step}</span>
                  {i < STEPS.length - 1 && <span className="mx-1 h-px w-8 bg-foreground/20" aria-hidden />}
                </li>
              );
            })}
          </ol>
        </div>

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
    </div>
  );
}
