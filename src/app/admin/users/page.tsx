import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/ui";
import { UsersTable, type AdminUserRow } from "@/components/admin/users/users-table";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const [current, users] = await Promise.all([
    getCurrentUser(),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
  ]);

  const rows: AdminUserRow[] = users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    companyName: user.companyName,
    role: user.role,
    isVerified: Boolean(user.emailVerifiedAt),
    orderCount: user._count.orders,
    createdAt: user.createdAt,
  }));

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${rows.length} registered account${rows.length === 1 ? "" : "s"}`}
      />
      <UsersTable users={rows} currentUserId={current?.id ?? ""} />
    </div>
  );
}
