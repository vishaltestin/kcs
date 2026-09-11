"use client";

import { Loader2, MapPin, Truck } from "lucide-react";

import { INDIAN_STATES } from "@/lib/india";
import { formatGrams } from "@/lib/shipping";
import { cn, formatCurrency } from "@/lib/utils";
import type { ShippingEstimate } from "@/actions/shipping";

/**
 * "Shipping" line for the cart summary: a destination-state picker plus the
 * live weight-based estimate (zone, ETA and chargeable weight).
 */
export function ShippingEstimateRow({
  estimate,
  loading,
  destination,
  onDestinationChange,
}: {
  estimate: ShippingEstimate | null;
  loading: boolean;
  destination: string;
  onDestinationChange: (state: string) => void;
}) {
  const hasDestination = destination.trim().length > 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-muted-foreground">
        <dt className="inline-flex items-center gap-1.5">
          <Truck className="size-4 text-primary" aria-hidden /> Shipping
        </dt>
        <dd
          className={cn(
            "font-medium tabular-nums",
            estimate?.free ? "text-success" : "text-foreground",
          )}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Calculating shipping" />
          ) : !estimate ? (
            "—"
          ) : estimate.free ? (
            "Free"
          ) : (
            formatCurrency(estimate.amount)
          )}
        </dd>
      </div>

      <label className="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-xs focus-within:border-primary/60">
        <MapPin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="sr-only">Deliver to state</span>
        <select
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          className="w-full bg-transparent text-[13px] font-medium outline-none"
        >
          <option value="">Deliver to… (select state for exact rate)</option>
          {INDIAN_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </label>

      {estimate && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {estimate.free && estimate.reason === "free-threshold" ? (
            <>Free shipping unlocked on orders above {formatCurrency(estimate.freeShippingThreshold)}.</>
          ) : (
            <>
              {hasDestination ? estimate.zoneName : `Rate shown for ${estimate.zoneName ?? "Rest of India"}`}
              {estimate.etaDays ? ` · ${estimate.etaDays} working days` : ""}
              {estimate.chargeableWeight > 0 ? ` · ${formatGrams(estimate.chargeableWeight)} chargeable` : ""}
            </>
          )}
        </p>
      )}
    </div>
  );
}
