import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { ProductPriceTier } from "@/types";

/**
 * Tiered bulk-pricing table (mirrors the original BulkInquiryTable):
 * quantity slabs with per-unit price and MRP.
 */
export function BulkInquiryTable({ prices }: { prices: ProductPriceTier[] }) {
  if (prices.length === 0) return null;

  const sorted = [...prices].sort((a, b) => a.minQuantity - b.minQuantity);

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className="w-1/3">Quantity</TableHead>
            <TableHead>Price / unit</TableHead>
            <TableHead className="text-right">MRP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((tier, index) => {
            const next = sorted[index + 1];
            const label = next
              ? `${tier.minQuantity} – ${next.minQuantity - 1} pcs`
              : `${tier.minQuantity}+ pcs`;
            return (
              <TableRow key={tier.minQuantity}>
                <TableCell className="font-medium">{label}</TableCell>
                <TableCell className="font-bold text-primary">{formatCurrency(tier.price)}</TableCell>
                <TableCell className="text-right text-muted-foreground line-through">
                  {formatCurrency(tier.mrp)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
