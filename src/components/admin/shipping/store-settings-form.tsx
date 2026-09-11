"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateStoreSettingsAction } from "@/actions/admin/shipping";
import { GST_STATE_CODES } from "@/lib/tax";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types";

export type StoreSettingsValues = {
  freeShippingThreshold: number;
  volumetricDivisor: number;
  sellerName: string;
  sellerGstin: string;
  sellerPan: string;
  sellerAddress: string;
  sellerStateCode: string;
  sellerEmail: string;
  sellerPhone: string;
  invoicePrefix: string;
};

const financialYear = (() => {
  const now = new Date();
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
})();

export function StoreSettingsForm({ settings }: { settings: StoreSettingsValues }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(updateStoreSettingsAction, null);
  const [gstin, setGstin] = useState(settings.sellerGstin);
  const [stateCode, setStateCode] = useState(settings.sellerStateCode);
  const [prefix, setPrefix] = useState(settings.invoicePrefix);

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message ?? "Saved.");
    else toast.error(state.message);
  }, [state]);

  const errors = (!state || state.ok ? {} : (state.fieldErrors ?? {})) as Record<string, string[] | undefined>;
  const gstinStateCode = gstin.length >= 2 ? gstin.slice(0, 2) : null;
  const mismatch = gstinStateCode && GST_STATE_CODES[gstinStateCode] && gstinStateCode !== stateCode;

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Legal / trade name" error={errors.sellerName}>
        <Input name="sellerName" defaultValue={settings.sellerName} required maxLength={120} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="GSTIN" error={errors.sellerGstin} hint="Leave blank to issue plain (non-tax) invoices.">
          <Input
            name="sellerGstin"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            placeholder="07AAACK1234A1Z5"
            maxLength={15}
            className="font-mono uppercase"
          />
        </Field>
        <Field label="PAN" error={errors.sellerPan}>
          <Input name="sellerPan" defaultValue={settings.sellerPan} placeholder="AAACK1234A" maxLength={10} className="font-mono uppercase" />
        </Field>
      </div>

      <Field label="State of supply" error={errors.sellerStateCode} hint={mismatch ? `GSTIN starts with ${gstinStateCode} (${GST_STATE_CODES[gstinStateCode]}) — double-check.` : "Decides CGST+SGST (same state) vs IGST."}>
        <input type="hidden" name="sellerStateCode" value={stateCode} />
        <Select value={stateCode} onValueChange={setStateCode}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pick a state" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {Object.entries(GST_STATE_CODES).map(([code, name]) => (
              <SelectItem key={code} value={code}>
                <span className="font-mono text-xs text-muted-foreground">{code}</span> {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Registered address" error={errors.sellerAddress}>
        <Textarea name="sellerAddress" defaultValue={settings.sellerAddress} rows={3} maxLength={300} placeholder="Building, street, city, PIN" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Invoice email" error={errors.sellerEmail}>
          <Input name="sellerEmail" type="email" defaultValue={settings.sellerEmail} placeholder="accounts@kcsgmart.in" />
        </Field>
        <Field label="Invoice phone" error={errors.sellerPhone}>
          <Input name="sellerPhone" defaultValue={settings.sellerPhone} placeholder="+91 98xxx xxxxx" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Invoice number prefix" error={errors.invoicePrefix} hint={`Next: ${prefix || "KCS/INV"}/${financialYear}/000001`}>
          <Input name="invoicePrefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} maxLength={20} className="font-mono" />
        </Field>
        <Field label="Free shipping from ₹" error={errors.freeShippingThreshold} hint="Order subtotal at or above this ships free. 0 = never.">
          <Input name="freeShippingThreshold" type="number" min={0} step="1" defaultValue={settings.freeShippingThreshold} />
        </Field>
      </div>

      <Field label="Volumetric divisor (cm³ per kg)" error={errors.volumetricDivisor} hint="Most Indian couriers use 5000; air cargo often 4000/6000.">
        <Input name="volumetricDivisor" type="number" min={1000} max={10000} step="100" defaultValue={settings.volumetricDivisor} />
      </Field>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          Save settings
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string[];
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[13px]">{label}</Label>
      {children}
      {error?.[0] ? (
        <p className="text-xs text-destructive">{error[0]}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
