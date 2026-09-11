"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";

import { ExternalLink, Loader2, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateShipmentAction } from "@/actions/admin/engagements";
import { COURIERS, buildTrackingUrl } from "@/lib/couriers";
import type { ActionResult } from "@/types";

type Shipment = {
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  expectedAt: string | null; // yyyy-mm-dd
  shipmentNote: string | null;
};

/**
 * Courier / AWB entry for an order. Picking a known courier auto-builds the
 * public tracking link; a custom URL can override it. "Save & mark shipped"
 * moves the order to SHIPPED and stamps shippedAt.
 */
export function ShipmentForm({ orderId, status, shipment }: { orderId: string; status: string; shipment: Shipment }) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateShipmentAction.bind(null, orderId),
    null,
  );
  const handled = useRef<typeof state>(null);
  const [courier, setCourier] = useState(shipment.courierName ?? "");
  const [awb, setAwb] = useState(shipment.trackingNumber ?? "");
  const [customUrl, setCustomUrl] = useState(() => {
    // Only treat the stored URL as custom when it isn't the template-derived one.
    const derived = shipment.courierName && shipment.trackingNumber ? buildTrackingUrl(shipment.courierName, shipment.trackingNumber) : null;
    return shipment.trackingUrl && shipment.trackingUrl !== derived ? shipment.trackingUrl : "";
  });
  const [markShipped, setMarkShipped] = useState(status === "PENDING" || status === "CONFIRMED");

  useEffect(() => {
    if (!state || handled.current === state) return;
    handled.current = state;
    const id = window.setTimeout(() => {
      if (state.ok) toast.success(state.message ?? "Saved");
      else toast.error(state.message);
    }, 0);
    return () => window.clearTimeout(id);
  }, [state]);

  const preview = buildTrackingUrl(courier, awb, customUrl);
  const errors = (!state || state.ok ? {} : (state.fieldErrors ?? {})) as Record<string, string[] | undefined>;
  const isKnown = COURIERS.some((c) => c.name === courier);

  return (
    <form
      id="shipment"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("markShipped", String(markShipped));
        startTransition(() => formAction(fd));
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="courierName">Courier *</Label>
          <Input
            id="courierName"
            name="courierName"
            list="kcs-couriers"
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            placeholder="Delhivery, Blue Dart, DTDC…"
            aria-invalid={!!errors.courierName}
          />
          <datalist id="kcs-couriers">
            {COURIERS.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>
          {errors.courierName && <p className="text-xs text-destructive">{errors.courierName[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trackingNumber">AWB / tracking number</Label>
          <Input
            id="trackingNumber"
            name="trackingNumber"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
            placeholder="e.g. 1234567890123"
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expectedAt">Expected delivery</Label>
          <Input id="expectedAt" name="expectedAt" type="date" defaultValue={shipment.expectedAt ?? ""} aria-invalid={!!errors.expectedAt} />
          {errors.expectedAt && <p className="text-xs text-destructive">{errors.expectedAt[0]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="trackingUrl">
            Tracking link {isKnown ? <span className="font-normal text-muted-foreground">(auto from courier — override optional)</span> : null}
          </Label>
          <Input
            id="trackingUrl"
            name="trackingUrl"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder={isKnown ? "Leave blank to use the courier's tracking page" : "https://…"}
            aria-invalid={!!errors.trackingUrl}
          />
          {errors.trackingUrl && <p className="text-xs text-destructive">{errors.trackingUrl[0]}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shipmentNote">Note for the customer</Label>
        <Textarea
          id="shipmentNote"
          name="shipmentNote"
          rows={2}
          defaultValue={shipment.shipmentNote ?? ""}
          placeholder="e.g. Dispatched in 3 cartons · call the receiver before delivery"
        />
      </div>

      {preview && (
        <p className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-muted-foreground">
          <ExternalLink className="size-3.5 shrink-0" aria-hidden />
          Customer tracking link:{" "}
          <a href={preview} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-primary hover:underline">
            {preview}
          </a>
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={markShipped}
            onChange={(e) => setMarkShipped(e.target.checked)}
            disabled={status === "DELIVERED"}
            className="size-4 accent-primary"
          />
          <span>
            Mark order as <strong>Shipped</strong>
            {status === "DELIVERED" && <span className="text-muted-foreground"> (already delivered)</span>}
          </span>
        </label>
        <Button type="submit" disabled={isPending} className="min-w-44">
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden /> Saving…
            </>
          ) : markShipped && status !== "DELIVERED" ? (
            <>
              <Truck aria-hidden /> Save &amp; mark shipped
            </>
          ) : (
            <>
              <PackageCheck aria-hidden /> Save shipment details
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
