"use client";

import { Clock, PackageCheck, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BulkEnquiryForm } from "@/components/forms/bulk-enquiry-form";

const PERKS = [
  { icon: Clock, text: "Quote within a business day" },
  { icon: Sparkles, text: "Free mock-up with your logo" },
  { icon: PackageCheck, text: "Samples on request" },
];

export function BulkEnquiryDialog({
  open,
  onOpenChange,
  productId,
  productName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  productName?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="grid md:grid-cols-[15rem_minmax(0,1fr)]">
          {/* Side panel */}
          <aside className="relative hidden overflow-hidden bg-brand-ink p-7 text-white md:block">
            <div aria-hidden className="absolute -bottom-20 -left-20 size-56 rounded-full bg-primary/40 blur-3xl" />
            <div className="relative flex h-full flex-col">
              <span className="kicker text-brand-amber">Bulk enquiry</span>
              <h3 className="display mt-2.5 text-[1.5rem] text-white">
                Get a tailored quote for your team.
              </h3>
              <ul className="mt-6 space-y-3">
                {PERKS.map((p) => (
                  <li key={p.text} className="flex items-start gap-2.5 text-sm text-white/85">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white/10">
                      <p.icon className="size-3.5 text-brand-amber" aria-hidden />
                    </span>
                    {p.text}
                  </li>
                ))}
              </ul>
              {productName && (
                <div className="mt-auto rounded-xl bg-white/10 p-3.5 ring-1 ring-white/15">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-white/60 uppercase">Enquiring about</p>
                  <p className="mt-1 line-clamp-3 text-sm font-semibold leading-snug">{productName}</p>
                </div>
              )}
            </div>
          </aside>

          <div className="max-h-[92vh] overflow-y-auto p-6 md:p-8">
            <DialogHeader className="mb-5 text-left">
              <DialogTitle className="display text-[1.5rem]">Bulk Inquiry</DialogTitle>
              <DialogDescription>
                {productName
                  ? `Tell us your requirement for "${productName}" and our team will share a custom quote.`
                  : "Please fill out the form below for your bulk inquiry."}
              </DialogDescription>
            </DialogHeader>
            <BulkEnquiryForm
              productId={productId}
              productName={productName}
              onDone={() => onOpenChange(false)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
