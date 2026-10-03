"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/auth/guards";
import { homeTileSchema, type HomeTileInput } from "@/lib/validations/admin";
import { DEFAULT_HOME_TILES, HOME_TILE_SECTIONS, type HomeTileSection } from "@/lib/home-tiles";
import { str } from "@/lib/form";
import type { ActionResult } from "@/types";

/**
 * Admin — curated home-page category tiles.
 *
 * Unlike the promo bands (one row per slot, upserted) a section holds an
 * arbitrary list, so these are ordinary create / update / delete operations
 * plus reordering. Every mutation revalidates the home page, so a change is
 * live on the next visit without a rebuild.
 */

function revalidateHomeTiles() {
  revalidatePath("/");
  revalidatePath("/admin/home-tiles");
}

function parseTileForm(formData: FormData): HomeTileInput {
  return {
    section: str(formData.get("section")) as HomeTileInput["section"],
    label: str(formData.get("label")),
    image: str(formData.get("image")),
    href: str(formData.get("href")),
  };
}

function isSection(value: string): value is HomeTileSection {
  return (HOME_TILE_SECTIONS as readonly string[]).includes(value);
}

/** New tiles go to the end of their section. Takes a tx so the caller can
 *  read and write in one transaction. */
type Db = Pick<typeof db, "homeTile">;

async function nextSortOrder(section: HomeTileSection, client: Db = db): Promise<number> {
  const last = await client.homeTile.findFirst({
    where: { section },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return (last?.sortOrder ?? -1) + 1;
}

export async function createHomeTileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const parsed = homeTileSchema.safeParse(parseTileForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { section, ...data } = parsed.data;

  // A section with no rows is *showing the shipped defaults* on the storefront.
  // Saving one new tile must not make those seven tiles vanish — that turned a
  // small addition into an accidental rewrite. So the defaults are written to
  // the database first (only when the section is still untouched) and the new
  // tile is appended after them; from then on the section is fully the admin's
  // list, and every default tile can be edited, hidden or deleted.
  const { keptDefaults } = await db.$transaction(async (tx) => {
    let order = await nextSortOrder(section, tx);
    let kept = false;

    if (order === 0) {
      const defaults = DEFAULT_HOME_TILES[section];
      if (defaults.length > 0) {
        await tx.homeTile.createMany({
          data: defaults.map((tile, index) => ({
            section,
            label: tile.label,
            image: tile.image,
            href: tile.href,
            sortOrder: index,
            isActive: true,
          })),
        });
        order = defaults.length;
        kept = true;
      }
    }

    await tx.homeTile.create({
      data: { section, ...data, sortOrder: order, isActive: true },
    });

    return { keptDefaults: kept };
  });

  revalidateHomeTiles();
  return {
    ok: true,
    message: keptDefaults
      ? `“${data.label}” added — the tiles that were already showing were kept and are now editable.`
      : `“${data.label}” added to the home page.`,
  };
}

export async function updateHomeTileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await assertAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { ok: false, message: "Missing tile id." };

  const parsed = homeTileSchema.safeParse(parseTileForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await db.homeTile.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, message: "Tile not found — it may have been removed." };

  const { section, ...data } = parsed.data;
  await db.homeTile.update({ where: { id }, data: { section, ...data } });

  revalidateHomeTiles();
  return { ok: true, message: `“${data.label}” updated.` };
}

export async function deleteHomeTileAction(id: number): Promise<ActionResult> {
  await assertAdmin();

  const existing = await db.homeTile.findUnique({
    where: { id },
    select: { label: true },
  });
  if (!existing) return { ok: false, message: "Tile not found — it may have been removed." };

  await db.homeTile.delete({ where: { id } });

  revalidateHomeTiles();
  return { ok: true, message: `“${existing.label}” removed from the home page.` };
}

/** Off keeps the tile (and its artwork) for next season without showing it. */
export async function toggleHomeTileAction(id: number, isActive: boolean): Promise<ActionResult> {
  await assertAdmin();

  await db.homeTile.update({ where: { id }, data: { isActive } });

  revalidateHomeTiles();
  return { ok: true, message: isActive ? "Tile shown on the home page." : "Tile hidden." };
}

/**
 * Moves a tile one place up or down within its section by swapping `sortOrder`
 * with its neighbour. Both writes happen in one transaction so a failed swap
 * can't leave two tiles sharing a position.
 */
export async function moveHomeTileAction(id: number, direction: "up" | "down"): Promise<ActionResult> {
  await assertAdmin();

  const tile = await db.homeTile.findUnique({
    where: { id },
    select: { id: true, section: true, sortOrder: true },
  });
  if (!tile) return { ok: false, message: "Tile not found." };

  const neighbour = await db.homeTile.findFirst({
    where: {
      section: tile.section,
      id: { not: tile.id },
      sortOrder: direction === "up" ? { lt: tile.sortOrder } : { gt: tile.sortOrder },
    },
    orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    select: { id: true, sortOrder: true },
  });
  if (!neighbour) {
    return { ok: false, message: direction === "up" ? "Already first." : "Already last." };
  }

  await db.$transaction([
    db.homeTile.update({ where: { id: tile.id }, data: { sortOrder: neighbour.sortOrder } }),
    db.homeTile.update({ where: { id: neighbour.id }, data: { sortOrder: tile.sortOrder } }),
  ]);

  revalidateHomeTiles();
  return { ok: true, message: "Order updated." };
}

/**
 * Copies the shipped default tiles back into a section. Useful after
 * experimenting: it deletes the section's rows and re-seeds them, so the
 * storefront returns to exactly the original artwork and links.
 */
export async function restoreDefaultHomeTilesAction(section: string): Promise<ActionResult> {
  await assertAdmin();

  if (!isSection(section)) return { ok: false, message: "Unknown section." };

  const { DEFAULT_HOME_TILES } = await import("@/lib/home-tiles");
  const defaults = DEFAULT_HOME_TILES[section];

  await db.$transaction([
    db.homeTile.deleteMany({ where: { section } }),
    db.homeTile.createMany({
      data: defaults.map((tile, index) => ({
        section,
        label: tile.label,
        image: tile.image,
        href: tile.href,
        sortOrder: index,
        isActive: true,
      })),
    }),
  ]);

  revalidateHomeTiles();
  return { ok: true, message: `Default ${section} tiles restored.` };
}
