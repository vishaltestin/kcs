import { ConsoleDashboardSkeleton } from "@/components/shared/console-skeletons";

/**
 * Vendor portal fallback. The dashboard is its main consumer (list pages
 * have their own loading.tsx), so this is dashboard-shaped: stat cards +
 * recent-records table.
 */
export default function VendorLoading() {
  return <ConsoleDashboardSkeleton />;
}
