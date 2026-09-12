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
      className="border-t border-foreground/[0.12]"
    >
      {items.map((item, index) => (
        <AccordionItem
          key={item.q}
          value={`${sectionId}-${index}`}
          className="group/item relative border-foreground/[0.1]"
        >
          <AccordionTrigger className="gap-4 rounded-none py-4.5 pr-1 text-[15.5px] font-semibold tracking-tight hover:no-underline [&[data-state=open]]:text-primary">
            <span className="flex items-start gap-4">
              <span className="numeral mt-0.5 w-7 shrink-0 text-[12px] text-muted-foreground/70 group-data-[state=open]/item:text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item.q}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-6 pl-11 text-[14.5px] leading-relaxed text-muted-foreground md:pr-16">
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
