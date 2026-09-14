import type { Metadata } from "next";
import { Info, Megaphone, Play } from "lucide-react";

import { PageHeader, Panel } from "@/components/admin/ui";
import { HomeBandForm } from "@/components/admin/home-bands/band-form";
import { getHomeBannerRows } from "@/lib/queries/content";
import { HOME_BANNER_SLOTS, HOME_BAND_HINTS, HOME_BAND_LABELS, toHomeBandFormValue } from "@/lib/home-bands";

export const metadata: Metadata = { title: "Home Bands" };

export default async function AdminHomeBandsPage() {
  const rows = await getHomeBannerRows();

  return (
    <div>
      <PageHeader
        title="Home page bands"
        description="The two full-bleed promo blocks on the storefront home page — seasonal copy, artwork and button, all editable."
      />

      <div className="space-y-6">
        <Panel title="How these bands work" icon={Info}>
          <ul className="grid gap-2 text-[13px] leading-relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">Empty field, no hole.</strong> Any field you leave blank falls back to the
              copy that shipped with the design, so a half-filled band still renders.
            </li>
            <li>
              <strong className="text-foreground">Switch off, not delete.</strong> Turning a band off hides it from the home
              page and keeps its text here for next season.
            </li>
            <li>
              <strong className="text-foreground">Live on save.</strong> Saving revalidates the home page, so the change shows
              on the next visit without a rebuild.
            </li>
            <li>
              <strong className="text-foreground">Text baked into artwork stays baked.</strong> If a headline is part of the
              image, edit the image — typing it here too would show it twice.
            </li>
          </ul>
        </Panel>

        {HOME_BANNER_SLOTS.map((slot) => (
          <Panel
            key={slot}
            title={HOME_BAND_LABELS[slot]}
            description={HOME_BAND_HINTS[slot]}
            icon={slot === "video" ? Play : Megaphone}
          >
            <HomeBandForm band={toHomeBandFormValue(slot, rows.find((row) => row.slot === slot))} />
          </Panel>
        ))}
      </div>
    </div>
  );
}
