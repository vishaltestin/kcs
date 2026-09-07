import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/ui";
import { MeetingsTable, type AdminBookingRow } from "@/components/admin/engagements/meetings-table";
import { getAdminBookings } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Meeting Bookings" };

export default async function AdminMeetingsPage() {
  const bookings = await getAdminBookings();

  const rows: AdminBookingRow[] = bookings.map((booking) => ({
    id: booking.id,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    company: booking.company,
    date: booking.date,
    timeSlot: booking.timeSlot,
    notes: booking.notes,
    status: booking.status,
    createdAt: booking.createdAt,
  }));

  return (
    <div>
      <PageHeader
        title="Meeting Bookings"
        description={`${rows.length} booking${rows.length === 1 ? "" : "s"} requested`}
      />
      <MeetingsTable bookings={rows} />
    </div>
  );
}
