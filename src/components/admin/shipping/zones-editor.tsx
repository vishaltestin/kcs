"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, MapPin, Pencil, Plus, Power, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteShippingZoneAction, saveShippingZoneAction, toggleShippingZoneAction } from "@/actions/admin/shipping";
import { formatGrams } from "@/lib/shipping";
import { cn, formatCurrency } from "@/lib/utils";

export type AdminZone = {
  id: number;
  code: string;
  name: string;
  states: string[];
  etaDays: string;
  isActive: boolean;
  extraPer500g: number;
  rates: { uptoGrams: number; price: number }[];
};

type Draft = Omit<AdminZone, "id" | "rates"> & {
  id: number | null;
  rates: { uptoGrams: number | ""; price: number | "" }[];
};

const NEW_ZONE: Draft = {
  id: null,
  code: "",
  name: "",
  states: [],
  etaDays: "4-7",
  isActive: true,
  extraPer500g: 40,
  rates: [
    { uptoGrams: 500, price: "" },
    { uptoGrams: 1000, price: "" },
    { uptoGrams: 2000, price: "" },
    { uptoGrams: 5000, price: "" },
  ],
};

export function ZonesEditor({ zones, states }: { zones: AdminZone[]; states: string[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  // All slab limits across zones → header columns of the comparison table.
  const slabs = Array.from(new Set(zones.flatMap((z) => z.rates.map((r) => r.uptoGrams)))).sort((a, b) => a - b);

  const openEdit = (zone: AdminZone) =>
    setDraft({ ...zone, rates: zone.rates.map((r) => ({ uptoGrams: r.uptoGrams, price: r.price })) });

  const toggle = (zone: AdminZone) => {
    setBusyId(zone.id);
    startTransition(async () => {
      const res = await toggleShippingZoneAction(zone.id, !zone.isActive);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      setBusyId(null);
      router.refresh();
    });
  };

  const remove = (zone: AdminZone) => {
    if (!window.confirm(`Delete zone “${zone.name}”? Its states fall back to the catch-all zone.`)) return;
    setBusyId(zone.id);
    startTransition(async () => {
      const res = await deleteShippingZoneAction(zone.id);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
      setBusyId(null);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-5 py-2.5">Zone</th>
              <th className="px-3 py-2.5">Coverage</th>
              <th className="px-3 py-2.5">ETA</th>
              {slabs.map((s) => (
                <th key={s} className="px-3 py-2.5 text-right whitespace-nowrap">
                  ≤ {formatGrams(s)}
                </th>
              ))}
              <th className="px-3 py-2.5 text-right whitespace-nowrap">+500 g</th>
              <th className="px-3 py-2.5 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {zones.map((zone) => {
              const busy = busyId === zone.id && pending;
              return (
                <tr key={zone.id} className={cn("transition-colors hover:bg-surface/60", !zone.isActive && "text-muted-foreground")}>
                  <td className="min-w-44 px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", zone.isActive ? "bg-primary/[0.08] text-primary" : "bg-muted")}>
                        <MapPin className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold whitespace-nowrap text-foreground">{zone.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {zone.code}
                          {!zone.isActive && " · disabled"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[14rem] min-w-40 px-3 py-3">
                    {zone.states.length === 0 ? (
                      <span className="rounded-md bg-brand-amber/15 px-1.5 py-0.5 text-[11px] font-semibold text-[#7a5200]">Catch-all · rest of India</span>
                    ) : (
                      <p className="truncate text-xs" title={zone.states.join(", ")}>
                        {zone.states.slice(0, 3).join(", ")}
                        {zone.states.length > 3 && <span className="text-muted-foreground"> +{zone.states.length - 3} more</span>}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap">{zone.etaDays} days</td>
                  {slabs.map((s) => {
                    const rate = zone.rates.find((r) => r.uptoGrams === s);
                    return (
                      <td key={s} className="px-3 py-3 text-right tabular-nums">
                        {rate ? formatCurrency(rate.price) : <span className="text-muted-foreground/50">—</span>}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-right tabular-nums">{formatCurrency(zone.extraPer500g)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${zone.name}`} onClick={() => openEdit(zone)} disabled={busy}>
                        <Pencil aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={zone.isActive ? `Disable ${zone.name}` : `Enable ${zone.name}`}
                        onClick={() => toggle(zone)}
                        disabled={busy}
                        className={zone.isActive ? "" : "text-success"}
                      >
                        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Power aria-hidden />}
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${zone.name}`} onClick={() => remove(zone)} disabled={busy} className="hover:text-destructive">
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 border-t bg-surface/60 px-5 py-3">
        <p className="text-xs text-muted-foreground">
          {zones.length} zone{zones.length === 1 ? "" : "s"} · rates are GST-inclusive and print as a separate line on the invoice (HSN 996812).
        </p>
        <Button size="sm" onClick={() => setDraft({ ...NEW_ZONE, rates: NEW_ZONE.rates.map((r) => ({ ...r })) })}>
          <Plus aria-hidden /> Add zone
        </Button>
      </div>

      {draft && (
        <ZoneDialog
          draft={draft}
          states={states}
          takenStates={new Map(zones.filter((z) => z.id !== draft.id).flatMap((z) => z.states.map((s) => [s.toLowerCase(), z.name] as const)))}
          onClose={() => setDraft(null)}
          onSaved={() => {
            setDraft(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ZoneDialog({
  draft: initial,
  states,
  takenStates,
  onClose,
  onSaved,
}: {
  draft: Draft;
  states: string[];
  takenStates: Map<string, string>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [filter, setFilter] = useState("");
  const [pending, startTransition] = useTransition();

  const visibleStates = states.filter((s) => s.toLowerCase().includes(filter.toLowerCase()));
  const selected = new Set(draft.states.map((s) => s.toLowerCase()));

  const toggleState = (state: string) => {
    setDraft((d) => ({
      ...d,
      states: selected.has(state.toLowerCase()) ? d.states.filter((s) => s.toLowerCase() !== state.toLowerCase()) : [...d.states, state],
    }));
  };

  const setRate = (index: number, patch: Partial<Draft["rates"][number]>) =>
    setDraft((d) => ({ ...d, rates: d.rates.map((r, i) => (i === index ? { ...r, ...patch } : r)) }));

  const submit = () => {
    setErrors({});
    startTransition(async () => {
      const res = await saveShippingZoneAction({
        id: draft.id,
        code: draft.code.trim().toUpperCase() || draft.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").slice(0, 40),
        name: draft.name,
        states: draft.states,
        etaDays: draft.etaDays,
        isActive: draft.isActive,
        extraPer500g: Number(draft.extraPer500g) || 0,
        rates: draft.rates
          .filter((r) => r.uptoGrams !== "" || r.price !== "")
          .map((r) => ({ uptoGrams: Number(r.uptoGrams), price: Number(r.price) })),
      });
      if (res.ok) {
        toast.success(res.message);
        onSaved();
      } else {
        toast.error(res.message);
        setErrors(res.fieldErrors ?? {});
      }
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{draft.id ? `Edit zone · ${initial.name}` : "New shipping zone"}</DialogTitle>
          <DialogDescription>
            Pick the states this zone covers and the price for each weight slab. Leave states empty for a catch-all zone.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Zone name</Label>
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Delhi NCR" />
            {errors.name?.[0] && <p className="text-xs text-destructive">{errors.name[0]}</p>}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Code</Label>
              <Input
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                placeholder="auto"
                className="font-mono uppercase"
                maxLength={40}
              />
              {errors.code?.[0] && <p className="text-xs text-destructive">{errors.code[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">ETA (days)</Label>
              <Input value={draft.etaDays} onChange={(e) => setDraft({ ...draft, etaDays: e.target.value })} placeholder="3-5" className="w-24" />
              {errors.etaDays?.[0] && <p className="text-xs text-destructive">{errors.etaDays[0]}</p>}
            </div>
          </div>
        </div>

        {/* States */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-[13px]">
              States &amp; UTs <span className="font-normal text-muted-foreground">({draft.states.length} selected)</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter…" className="h-8 w-40" />
              {draft.states.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setDraft({ ...draft, states: [] })}>
                  <X aria-hidden /> Clear
                </Button>
              )}
            </div>
          </div>
          <div className="grid max-h-52 grid-cols-2 gap-1 overflow-y-auto rounded-xl bg-surface/70 p-2 ring-1 ring-foreground/[0.06] sm:grid-cols-3">
            {visibleStates.map((state) => {
              const isSelected = selected.has(state.toLowerCase());
              const takenBy = takenStates.get(state.toLowerCase());
              return (
                <label
                  key={state}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-background",
                    isSelected && "bg-background font-semibold ring-1 ring-primary/30",
                    takenBy && !isSelected && "text-muted-foreground",
                  )}
                  title={takenBy && !isSelected ? `Currently in ${takenBy}` : undefined}
                >
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleState(state)} className="size-3.5" />
                  <span className="truncate">{state}</span>
                  {takenBy && !isSelected && <span className="ml-auto truncate text-[10px]">{takenBy}</span>}
                </label>
              );
            })}
            {visibleStates.length === 0 && <p className="col-span-full px-2 py-3 text-center text-xs text-muted-foreground">No match.</p>}
          </div>
          {errors.states?.[0] && <p className="text-xs text-destructive">{errors.states[0]}</p>}
        </div>

        {/* Rates */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[13px]">Weight slabs (₹, GST-inclusive)</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const last = draft.rates.at(-1);
                const next = last && last.uptoGrams !== "" ? Number(last.uptoGrams) * 2 : 500;
                setDraft({ ...draft, rates: [...draft.rates, { uptoGrams: next, price: "" }] });
              }}
            >
              <Plus aria-hidden /> Add slab
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl ring-1 ring-foreground/[0.07]">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-3 py-2">Up to (grams)</th>
                  <th className="px-3 py-2">Price ₹</th>
                  <th className="w-12 px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {draft.rates.map((rate, index) => (
                  <tr key={index}>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          step={50}
                          value={rate.uptoGrams}
                          onChange={(e) => setRate(index, { uptoGrams: e.target.value === "" ? "" : Number(e.target.value) })}
                          className="h-9 w-32 tabular-nums"
                        />
                        <span className="text-xs text-muted-foreground">{rate.uptoGrams !== "" ? formatGrams(Number(rate.uptoGrams)) : ""}</span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={rate.price}
                        onChange={(e) => setRate(index, { price: e.target.value === "" ? "" : Number(e.target.value) })}
                        className="h-9 w-32 tabular-nums"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove slab ${index + 1}`}
                        disabled={draft.rates.length === 1}
                        onClick={() => setDraft({ ...draft, rates: draft.rates.filter((_, i) => i !== index) })}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors.rates?.[0] && <p className="text-xs text-destructive">{errors.rates[0]}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Beyond the last slab: ₹ per extra 500 g</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={draft.extraPer500g}
                onChange={(e) => setDraft({ ...draft, extraPer500g: Number(e.target.value) })}
                className="h-9 w-32 tabular-nums"
              />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <Checkbox checked={draft.isActive} onCheckedChange={(c) => setDraft({ ...draft, isActive: c === true })} />
              Zone is active
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : draft.id ? <Save aria-hidden /> : <Check aria-hidden />}
            {draft.id ? "Save zone" : "Create zone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
