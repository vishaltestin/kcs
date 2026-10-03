"use client";

import { useActionState, useEffect, useState } from "react";

import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePicker } from "@/components/admin/image-picker";
import {
  createHomeTileAction,
  deleteHomeTileAction,
  moveHomeTileAction,
  restoreDefaultHomeTilesAction,
  toggleHomeTileAction,
  updateHomeTileAction,
} from "@/actions/admin/home-tiles";
import {
  HOME_TILE_LIMITS,
  isMosaicWide,
  mosaicTileClass,
  type HomeTile,
  type HomeTileSection,
} from "@/lib/home-tiles";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types";

/**
 * Curated tile list for one home-page section.
 *
 * Tiles are reordered with the arrow buttons (swapping `sortOrder` with the
 * neighbour in one transaction) rather than drag-and-drop — predictable, works
 * with a keyboard, and no extra dependency.
 */
export function HomeTileList({
  section,
  tiles,
  usesDefaults,
}: {
  section: HomeTileSection;
  tiles: HomeTile[];
  /** True when the section has no rows yet and is rendering shipped defaults. */
  usesDefaults: boolean;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function run(id: number, fn: () => Promise<ActionResult>) {
    setBusyId(id);
    const result = await fn();
    setBusyId(null);
    if (result.ok) toast.success(result.message ?? "Done.");
    else toast.error(result.message);
  }

  return (
    <div className="space-y-4">
      {usesDefaults && (
        <p className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          This section is showing the {tiles.length} tiles that shipped with the design. Adding
          your own keeps them all — the list below becomes editable, in this order, with your new
          tile at the end. Nothing disappears until you delete or hide it.
        </p>
      )}

      <ul className="space-y-3">
        {tiles.map((tile, index) => (
          <li
            key={tile.id}
            className={cn(
              "rounded-xl border bg-card p-3",
              !tile.isActive && "opacity-60",
            )}
          >
            {editingId === tile.id ? (
              <TileForm
                section={section}
                tile={tile}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                  {index + 1}
                </span>

                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/[0.07]">
                  {tile.image ? (
                    <Image
                      src={tile.image}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid h-full place-items-center text-[10px] text-muted-foreground">
                      No art
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{tile.label}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {tile.href}
                  </p>
                  {section === "mosaic" && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {isMosaicWide(index)
                        ? "Wide banner slot — use a ≈2:1 image"
                        : `Grid cell ${mosaicTileClass(index).replace("div", "")} · square`}
                    </p>
                  )}
                  {section === "banner" && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Slide {index + 1}
                      {tile.href ? " · links to a page" : " · no link (artwork only)"}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-0.5">
                  <IconButton
                    label="Move up"
                    disabled={busyId === tile.id || index === 0}
                    onClick={() => run(tile.id, () => moveHomeTileAction(tile.id, "up"))}
                  >
                    <ArrowUp aria-hidden />
                  </IconButton>
                  <IconButton
                    label="Move down"
                    disabled={busyId === tile.id || index === tiles.length - 1}
                    onClick={() => run(tile.id, () => moveHomeTileAction(tile.id, "down"))}
                  >
                    <ArrowDown aria-hidden />
                  </IconButton>
                  <IconButton
                    label={tile.isActive ? "Hide from home page" : "Show on home page"}
                    disabled={busyId === tile.id}
                    onClick={() =>
                      run(tile.id, () => toggleHomeTileAction(tile.id, !tile.isActive))
                    }
                  >
                    {tile.isActive ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
                  </IconButton>
                  <IconButton
                    label="Edit"
                    disabled={busyId === tile.id}
                    onClick={() => setEditingId(tile.id)}
                  >
                    <Pencil aria-hidden />
                  </IconButton>
                  <IconButton
                    label="Delete"
                    disabled={busyId === tile.id}
                    danger
                    onClick={() => {
                      if (!window.confirm(`Delete “${tile.label}”? This cannot be undone.`)) return;
                      void run(tile.id, () => deleteHomeTileAction(tile.id));
                    }}
                  >
                    {busyId === tile.id ? (
                      <Loader2 className="animate-spin" aria-hidden />
                    ) : (
                      <Trash2 aria-hidden />
                    )}
                  </IconButton>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="rounded-xl border border-dashed p-3">
          <TileForm section={section} onDone={() => setAdding(false)} />
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => setAdding(true)}>
          <Plus aria-hidden /> {section === "banner" ? "Add slide" : "Add tile"}
        </Button>
      )}
    </div>
  );
}

/** Shared create/edit form — the only difference is the action it posts to. */
function TileForm({
  section,
  tile,
  onDone,
}: {
  section: HomeTileSection;
  tile?: HomeTile;
  onDone: () => void;
}) {
  const isSlide = section === "banner";
  const action = tile ? updateHomeTileAction : createHomeTileAction;
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );
  const [image, setImage] = useState(tile?.image ?? "");

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Saved.");
      onDone();
    } else {
      toast.error(state.message);
    }
  }, [state, onDone]);

  const errors = (!state || state.ok ? {} : (state.fieldErrors ?? {})) as Record<
    string,
    string[] | undefined
  >;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="section" value={section} />
      {tile && <input type="hidden" name="id" value={tile.id} />}
      <input type="hidden" name="image" value={image} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[13px]">{isSlide ? "Slide name" : "Tile label"}</Label>
          <Input
            name="label"
            defaultValue={tile?.label ?? ""}
            maxLength={HOME_TILE_LIMITS.label}
            placeholder={isSlide ? "Diwali gifting banner" : "Diwali Gift Hampers"}
            required
          />
          {errors.label?.[0] ? (
            <p className="text-xs text-destructive">{errors.label[0]}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Shown as the image alt text{isSlide ? " — and only there, nothing is drawn over the slide" : ""}.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px]">
            Links to{isSlide && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
          </Label>
          <Input
            name="href"
            defaultValue={tile?.href ?? ""}
            maxLength={HOME_TILE_LIMITS.href}
            placeholder={isSlide ? "Leave blank for artwork only" : "/category/diwali-gift-hampers"}
            className="font-mono text-[13px]"
            // Banner slides are artwork — a link is optional. Category tiles
            // must point somewhere, so the field stays required for those.
            required={!isSlide}
          />
          {errors.href?.[0] ? (
            <p className="text-xs text-destructive">{errors.href[0]}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {isSlide
                ? "Blank keeps the slide unclickable. Otherwise an internal path (/category/…) or a full https:// URL."
                : "Internal path (/category/…) or a full https:// URL."}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[13px]">Artwork</Label>
        <ImagePicker value={image} onChange={setImage} label="Upload or pick" />
        {errors.image?.[0] ? (
          <p className="text-xs text-destructive">{errors.image[0]}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {section === "mosaic"
              ? "Square art for grid cells; the wide 5th slot wants a ≈2:1 image."
              : section === "banner"
                ? "Slide artwork, 581×511 — same ratio as the tile slot it fills. Headlines are usually baked into the image, so nothing is drawn on top."
                : "Landscape art (≈380×265) sits best under the label bar."}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending || image === ""}>
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
          {tile ? "Save tile" : "Add tile"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          <X aria-hidden /> Cancel
        </Button>
        {image === "" && (
          <span className="text-xs text-muted-foreground">Pick an image to continue.</span>
        )}
      </div>
    </form>
  );
}

/** Restores a section to the tiles that shipped with the design. */
export function RestoreDefaultsButton({ section }: { section: HomeTileSection }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={async () => {
        if (
          !window.confirm(
            "Replace this section's tiles with the originals? Your current tiles are deleted.",
          )
        )
          return;
        setPending(true);
        const result = await restoreDefaultHomeTilesAction(section);
        setPending(false);
        if (result.ok) toast.success(result.message ?? "Restored.");
        else toast.error(result.message);
      }}
    >
      {pending ? <Loader2 className="animate-spin" aria-hidden /> : <RotateCcw aria-hidden />}
      Restore defaults
    </Button>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn("[&_svg]:size-4", danger && "text-destructive hover:text-destructive")}
    >
      {children}
    </Button>
  );
}
