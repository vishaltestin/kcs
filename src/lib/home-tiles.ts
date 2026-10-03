import { IMAGES } from "@/lib/constants";

/**
 * Home-page tiles — the three curated lists on the storefront home page.
 *
 *   • "banner"   the autoplaying slides in the hero mosaic's 2×2 slot
 *   • "mosaic"   the category tiles arranged around that banner
 *   • "featured" the 3-up category cards below the Best Sellers rail
 *
 * All three were hardcoded arrays in the page. They now live in the `HomeTile`
 * table and are managed under Admin → Home tiles. What is here is the fallback
 * the storefront renders when a section has never been saved (so the page is
 * never blank), plus the length limits the admin form mirrors.
 */

export const HOME_TILE_SECTIONS = ["banner", "mosaic", "featured"] as const;
export type HomeTileSection = (typeof HOME_TILE_SECTIONS)[number];

export const HOME_TILE_LABELS: Record<HomeTileSection, string> = {
  banner: "Hero banner slides",
  mosaic: "Hero mosaic tiles",
  featured: "Featured category cards",
};

export const HOME_TILE_HINTS: Record<HomeTileSection, string> = {
  banner:
    "The autoplaying slider in the middle of the hero mosaic. Slides are square-ish (581×511) artwork; the headline is usually baked into the image. A slide's link is optional.",
  mosaic:
    "The tiles arranged around the banner slider, directly above New Arrivals. The 5th tile is the wide banner-shaped slot — give it a wide (≈2:1) image.",
  featured:
    "The 3-up category cards between Best Sellers and the showreel band. Any number of tiles works; they flow three per row.",
};

/** Field limits, kept next to the Prisma column widths so the two can't drift. */
export const HOME_TILE_LIMITS = {
  label: 120,
  image: 300,
  href: 200,
} as const;

export type HomeTile = {
  id: number;
  section: HomeTileSection;
  label: string;
  image: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
};

/** A tile that has never been saved — used by the fallback and the admin form. */
export type HomeTileDraft = Omit<HomeTile, "id" | "sortOrder" | "isActive">;

/**
 * Tiles that shipped with the design. Rendered whenever a section has no rows
 * in the database at all (a fresh install, or everything deleted by mistake).
 */
export const DEFAULT_HOME_TILES: Record<HomeTileSection, HomeTileDraft[]> = {
  // The shipped banner artwork. No links — the slides are pure artwork, so the
  // hero renders exactly as it did before this section became editable.
  banner: IMAGES.homeBanners.map((src, index) => ({
    section: "banner" as const,
    label: `Corporate gifting banner ${index + 1}`,
    image: src,
    href: "",
  })),
  mosaic: [
    { section: "mosaic", label: "Diwali Gift Hampers", image: IMAGES.homeGrid.diwali, href: "/category/diwali-gift-hampers" },
    { section: "mosaic", label: "MFI Cross-Selling", image: IMAGES.homeGrid.mfi, href: "/category/trade-schemes" },
    { section: "mosaic", label: "NGO & CSR Requirements", image: IMAGES.homeGrid.ngo, href: "/category/curated-gift-hampers" },
    { section: "mosaic", label: "Pharma Gifting", image: IMAGES.homeGrid.pharma, href: "/category/corporate-gifting" },
    { section: "mosaic", label: "Trade Schemes", image: IMAGES.homeGrid.trade, href: "/category/trade-schemes" },
    { section: "mosaic", label: "Gourmet Range", image: IMAGES.homeGrid.gourmet, href: "/category/chocolates-dry-fruits" },
    { section: "mosaic", label: "Corporate Gifting", image: IMAGES.homeGrid.corporate, href: "/category/corporate-gifting" },
  ],
  featured: IMAGES.featuredCategories.map((item) => ({
    section: "featured" as const,
    label: item.label,
    image: item.src,
    href: item.href,
  })),
};

/**
 * Mosaic layout.
 *
 * The grid is 4 columns wide; the banner occupies the top-left 2×2 block and
 * tiles fill the rest in reading order. The 5th tile sits in the wide slot on
 * the bottom row, exactly as the original hardcoded grid did:
 *
 *   ┌───────────┬─────┬─────┐
 *   │           │  1  │  2  │
 *   │  banner   ├─────┼─────┤
 *   │           │  3  │  4  │
 *   ├───────────┼─────┼─────┤
 *   │     5     │  6  │  7  │
 *   └───────────┴─────┴─────┘
 *
 * Fewer than five tiles switches the grid to two rows (see `.parent--compact`
 * in globals.css); more than seven keeps filling new rows below.
 */
export const MOSAIC_WIDE_INDEX = 4;

export function isMosaicWide(index: number): boolean {
  return index === MOSAIC_WIDE_INDEX;
}

/** Class for the tile at `index`: the original `.div2`–`.div8`, then extras. */
export function mosaicTileClass(index: number): string {
  return index < 7 ? `div${index + 2}` : "mosaic-extra";
}

/**
 * Grid modifier for the whole mosaic, driven by how many tiles there are.
 *   • 0 tiles      → the banner alone, at its natural size
 *   • 1–4 tiles    → two rows (the wide slot and the third row are dropped)
 *   • 5+ tiles     → the full 4×3 grid
 */
export function mosaicGridClass(tileCount: number): string {
  if (tileCount === 0) return "parent parent--banner-only";
  if (tileCount < 5) return "parent parent--compact";
  return "parent";
}

/** Shape of a `HomeTile` row as selected by the queries (plain values only). */
export type HomeTileRow = {
  id: number;
  section: string;
  label: string;
  image: string | null;
  href: string | null;
  sortOrder: number;
  isActive: boolean;
};

const blank = (value: string | null) => value?.trim() ?? "";

/**
 * Rows → what each storefront section renders.
 *
 * A section with **no rows at all** falls back to `DEFAULT_HOME_TILES`; a
 * section whose rows were all switched off renders empty (that is a
 * deliberate "hide this section", not a missing one).
 */
export function resolveHomeTiles(
  rows: HomeTileRow[]
): Record<HomeTileSection, HomeTile[]> {
  const resolved = {} as Record<HomeTileSection, HomeTile[]>;

  for (const section of HOME_TILE_SECTIONS) {
    const sectionRows = rows.filter((row) => row.section === section);

    if (sectionRows.length === 0) {
      resolved[section] = DEFAULT_HOME_TILES[section].map((tile, index) => ({
        ...tile,
        id: -(index + 1),
        sortOrder: index,
        isActive: true,
      }));
      continue;
    }

    const active = sectionRows
      .filter((row) => row.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

    // Switching every banner slide off would leave a hole in the middle of the
    // hero mosaic — the one place on the page that cannot be blank. The tiles
    // in the sections around it fall back, so the slider does too.
    if (section === "banner" && active.length === 0) {
      resolved[section] = DEFAULT_HOME_TILES.banner.map((tile, index) => ({
        ...tile,
        id: -(index + 1),
        sortOrder: index,
        isActive: true,
      }));
      continue;
    }

    resolved[section] = active.map((row, index) => ({
      id: row.id,
      section,
      label: blank(row.label),
      image: blank(row.image),
      // Banner slides are artwork, not links: an empty href means "no link"
      // rather than a link to somewhere arbitrary.
      href: section === "banner" ? blank(row.href) : blank(row.href) || "/product",
      sortOrder: index,
      isActive: row.isActive,
    }));
  }

  return resolved;
}
