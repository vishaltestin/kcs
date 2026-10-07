"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { retryPaymentAction } from "@/actions/payments";
import { launchCashfreeCheckout } from "@/lib/cashfree-client";
import { formatCurrency } from "@/lib/utils";

/** "Try payment again" — mints a fresh session, then opens Cashfree. */
export function RetryPaymentButton({ orderNumber, total }: { orderNumber: string; total: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    try {
      const result = await retryPaymentAction(orderNumber);
      if (!result.ok || !result.data) {
        toast.error(result.message);
        return;
      }
      if (result.data.alreadyPaid || !result.data.paymentSessionId) {
        toast.success("Payment already received!");
        router.push(`/order-success/${orderNumber}`);
        return;
      }
      await launchCashfreeCheckout(orderNumber, result.data.paymentSessionId);
    } catch (error) {
      console.error("[retry-payment] failed", error);
      toast.error("Couldn't open the payment page. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size="lg" onClick={onClick} disabled={busy} aria-live="polite">
      {busy ? (
        <>
          <Loader2 className="animate-spin" aria-hidden /> Starting secure payment…
        </>
      ) : (
        <>
          <Lock aria-hidden /> Pay {formatCurrency(total)} Again
        </>
      )}
    </Button>
  );
}
