"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/faq";

/**
 * FAQ list — one card per section, the first question open by default.
 * Triggers are full-width with a subtle hover wash; the open item gets a
 * red hairline on the left so the eye can find it.
 */
export function FaqAccordion({ items, sectionId }: { items: FaqItem[]; sectionId: string }) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={`${sectionId}-0`}
      className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07]"
    >
      {items.map((item, index) => (
        <AccordionItem
          key={item.q}
          value={`${sectionId}-${index}`}
          className="group/item relative border-border/70 data-[state=open]:bg-surface/60"
        >
          <span
            aria-hidden
            className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-primary opacity-0 transition-opacity group-data-[state=open]/item:opacity-100"
          />
          <AccordionTrigger className="gap-4 rounded-none px-5 py-4 text-[15px] font-semibold tracking-tight hover:bg-surface/60 hover:no-underline md:px-6 [&[data-state=open]]:text-primary">
            {item.q}
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 text-[14.5px] leading-relaxed text-muted-foreground md:px-6 md:pr-16">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
