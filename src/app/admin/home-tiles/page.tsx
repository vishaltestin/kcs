import type { Metadata } from "next";
import { Images, Info, LayoutGrid, Sparkles } from "lucide-react";

import { PageHeader, Panel } from "@/components/admin/ui";
import { HomeTileList, RestoreDefaultsButton } from "@/components/admin/home-tiles/tile-list";
import { getHomeTileRows } from "@/lib/queries/content";
import {
  HOME_TILE_HINTS,
  HOME_TILE_LABELS,
  HOME_TILE_SECTIONS,
  resolveHomeTiles,
} from "@/lib/home-tiles";

export const metadata: Metadata = { title: "Home Tiles" };

export default async function AdminHomeTilesPage() {
  const rows = await getHomeTileRows();
  const resolved = resolveHomeTiles(rows);

  return (
    <div>
      <PageHeader
        title="Home page category tiles"
        description="Everything in the home page hero and category promos — the banner slider, the mosaic tiles around it, and the category cards below Best Sellers."
      />

      <div className="space-y-6">
        <Panel title="How these tiles work" icon={Info}>
          <ul className="grid gap-2 text-[13px] leading-relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">Order is the layout.</strong> Tiles and slides
              appear in the order listed here. Use the arrows to move one up or down.
            </li>
            <li>
              <strong className="text-foreground">Adding never removes.</strong> A section that has
              never been edited shows the artwork that shipped with the design. The first tile you
              add keeps all of it and appends yours — nothing is replaced behind your back.
            </li>
            <li>
              <strong className="text-foreground">The mosaic has a shape.</strong> It is designed
              around four square cells, a wide 5th cell and two more squares. Four or seven tiles
              fill it exactly; other counts still render, just with an odd gap.
            </li>
            <li>
              <strong className="text-foreground">The hero always has a slider.</strong> If every
              slide is switched off, the shipped banners come back — an empty 2×2 hole in the
              middle of the page reads as broken, not as &ldquo;hidden&rdquo;.
            </li>
            <li>
              <strong className="text-foreground">Hide, don’t delete.</strong> Switching a tile
              off keeps its artwork and link for next season. Deleting removes it for good.
            </li>
            <li>
              <strong className="text-foreground">Empty means default.</strong> A section with no
              tiles at all falls back to the artwork that shipped with the design, so the home
              page is never blank.
            </li>
            <li>
              <strong className="text-foreground">Live on save.</strong> Every change revalidates
              the home page — no rebuild, no deploy.
            </li>
          </ul>
        </Panel>

        {HOME_TILE_SECTIONS.map((section) => (
          <Panel
            key={section}
            title={HOME_TILE_LABELS[section]}
            description={HOME_TILE_HINTS[section]}
            icon={section === "banner" ? Images : section === "mosaic" ? LayoutGrid : Sparkles}
            actions={<RestoreDefaultsButton section={section} />}
          >
            <HomeTileList
              section={section}
              tiles={resolved[section]}
              usesDefaults={!rows.some((row) => row.section === section)}
            />
          </Panel>
        ))}
      </div>
    </div>
  );
}
