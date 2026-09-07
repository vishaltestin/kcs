import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getUserOrders } from "@/lib/queries/orders";
import { ProfileTabs } from "@/components/profile/profile-tabs";

export const metadata: Metadata = {
  title: "My Profile",
};

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
    <div className="container mx-auto px-4 py-8 md:py-12">
      <ProfileTabs
        user={user}
        orders={orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: Number(order.total),
          itemCount: order.items.length,
          createdAt: order.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
