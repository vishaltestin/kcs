import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/ui";
import { MessagesTable, type AdminMessageRow } from "@/components/admin/engagements/messages-table";
import { getAdminMessages } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Contact Messages" };

export default async function AdminMessagesPage() {
  const messages = await getAdminMessages();

  const rows: AdminMessageRow[] = messages.map((message) => ({
    id: message.id,
    name: message.name,
    email: message.email,
    phone: message.phone,
    subject: message.subject,
    message: message.message,
    isRead: message.isRead,
    createdAt: message.createdAt,
  }));

  const unread = rows.filter((r) => !r.isRead).length;

  return (
    <div>
      <PageHeader
        title="Contact Messages"
        description={`${rows.length} message${rows.length === 1 ? "" : "s"} · ${unread} unread`}
      />
      <MessagesTable messages={rows} />
    </div>
  );
}
