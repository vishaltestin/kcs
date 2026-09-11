import { Suspense } from "react";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getUserOrders } from "@/lib/queries/orders";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "My Profile",
};

function ProfileSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <Skeleton className="h-36 rounded-3xl" />
      <div className="flex flex-col gap-8 lg:flex-row">
        <Skeleton className="h-72 w-full rounded-2xl lg:w-64" />
        <Skeleton className="h-96 flex-1 rounded-2xl" />
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const sessionUser = await requireUser("/profile");

  const [user, orders] = await Promise.all([
    db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyName: true,
        gstNo: true,
        panNo: true,
        billingAddress: true,
        billingCity: true,
        billingState: true,
        billingPincode: true,
        shippingAddress: true,
        shippingCity: true,
        shippingState: true,
        shippingPincode: true,
        createdAt: true,
      },
    }),
    getUserOrders(sessionUser.id),
  ]);

  if (!user) return null;

  return (
    <div className="bg-surface/60">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* ProfileTabs reads `?tab=` via useSearchParams — Suspense keeps the
            rest of the page statically renderable. */}
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileTabs
            user={user}
            orders={orders.map((order) => ({
              id: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
              total: Number(order.total),
              itemCount: order.items.length,
              createdAt: order.createdAt.toISOString(),
              invoiceNumber: order.invoiceNumber,
              hasGst: !!order.gstNo,
              courierName: order.courierName,
              trackingNumber: order.trackingNumber,
              trackingUrl: order.trackingUrl,
              expectedAt: order.expectedAt ? order.expectedAt.toISOString() : null,
            }))}
          />
        </Suspense>
      </div>
    </div>
  );
}
