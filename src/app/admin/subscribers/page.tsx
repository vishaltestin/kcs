import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/ui";
import {
  SubscribersTable,
  type AdminSubscriberRow,
} from "@/components/admin/engagements/subscribers-table";
import { getAdminSubscribers } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Subscribers" };

export default async function AdminSubscribersPage() {
  const subscribers = await getAdminSubscribers();

  const rows: AdminSubscriberRow[] = subscribers.map((subscriber) => ({
    id: subscriber.id,
    email: subscriber.email,
    createdAt: subscriber.createdAt,
  }));

  return (
    <div>
      <PageHeader
        title="Newsletter Subscribers"
        description={`${rows.length} subscriber${rows.length === 1 ? "" : "s"}`}
      />
      <SubscribersTable subscribers={rows} />
    </div>
  );
}
