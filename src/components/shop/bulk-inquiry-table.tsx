import { Layers, TrendingDown } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import type { ProductPriceTier } from "@/types";

/**
 * Tiered bulk-pricing slabs — quantity ranges with per-unit price, MRP and
 * the saving each slab unlocks. Rendered as a compact card table so it sits
 * naturally beside the purchase actions.
 */
export function BulkInquiryTable({ prices }: { prices: ProductPriceTier[] }) {
  if (prices.length === 0) return null;

  const sorted = [...prices].sort((a, b) => a.minQuantity - b.minQuantity);
  const base = sorted[0];

  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07]">
      <div className="flex items-center justify-between gap-3 border-b bg-surface px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Layers className="size-4 text-primary" aria-hidden /> Bulk pricing slabs
        </h3>
        <span className="text-[11px] font-medium text-muted-foreground">Per piece · incl. taxes</span>
      </div>
      <table className="w-full text-sm">
        <thead className="sr-only">
          <tr>
            <th>Quantity</th>
            <th>Price per unit</th>
            <th>MRP</th>
            <th>Saving vs base</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((tier, index) => {
            const next = sorted[index + 1];
            const label = next ? `${tier.minQuantity} – ${next.minQuantity - 1}` : `${tier.minQuantity}+`;
            const savingVsBase = base ? Math.round(((base.price - tier.price) / base.price) * 100) : 0;
            const discount = tier.mrp > 0 ? Math.round(((tier.mrp - tier.price) / tier.mrp) * 100) : 0;
            const best = index === sorted.length - 1 && sorted.length > 1;
            return (
              <tr key={tier.minQuantity} className={best ? "bg-primary/[0.04]" : undefined}>
                <td className="px-4 py-3">
                  <span className="font-semibold tabular-nums">{label}</span>
                  <span className="ml-1 text-xs text-muted-foreground">pcs</span>
                </td>
                <td className="px-2 py-3">
                  <span className="text-base font-extrabold tracking-tight text-primary tabular-nums">
                    {formatCurrency(tier.price)}
                  </span>
                </td>
                <td className="px-2 py-3 text-xs text-muted-foreground tabular-nums line-through">
                  {formatCurrency(tier.mrp)}
                </td>
                <td className="px-4 py-3 text-right">
                  {index === 0 ? (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {discount > 0 ? `${discount}% off MRP` : "Base"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success">
                      <TrendingDown className="size-3" aria-hidden /> {savingVsBase}% lower
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
