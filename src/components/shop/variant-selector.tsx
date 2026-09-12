"use client";

import Image from "next/image";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { valueAvailable, type StorefrontVariant, type VariantAttributes } from "@/lib/variants";

/**
 * Colour / size picker. When the variants carry their own photos the axis
 * renders as image tiles (photo, name, availability) — that is the only way a
 * printed or engraved variant reads clearly. Otherwise colour-like axes render
 * as swatches and everything else as pill chips. Values that lead to no
 * in-stock variant are struck-through but stay clickable, so the customer can
 * still read the price.
 */

const COLOUR_AXES = /colou?r|shade|finish/i;

const NAMED_COLOURS: Record<string, string> = {
  black: "#111111",
  white: "#ffffff",
  red: "#c31c18",
  maroon: "#7f1d1d",
  wine: "#722f37",
  navy: "#1e3a8a",
  "navy blue": "#1e3a8a",
  blue: "#2563eb",
  "royal blue": "#1d4ed8",
  "sky blue": "#7dd3fc",
  teal: "#0f766e",
  green: "#15803d",
  "bottle green": "#0b4d2c",
  olive: "#556b2f",
  yellow: "#fcb819",
  mustard: "#d4a017",
  orange: "#f97316",
  pink: "#ec4899",
  purple: "#7c3aed",
  lavender: "#c4b5fd",
  grey: "#6b7280",
  gray: "#6b7280",
  charcoal: "#444444",
  silver: "#c0c0c0",
  gold: "#d4af37",
  "rose gold": "#b76e79",
  brown: "#7c4a1e",
  tan: "#d2b48c",
  beige: "#e8dcc4",
  cream: "#f5f0e1",
  khaki: "#c3b091",
  natural: "#e5d8c2",
  transparent: "#ffffff",
  multicolour: "linear-gradient(135deg,#c31c18,#fcb819,#15803d,#2563eb)",
  multicolor: "linear-gradient(135deg,#c31c18,#fcb819,#15803d,#2563eb)",
  assorted: "linear-gradient(135deg,#c31c18,#fcb819,#15803d,#2563eb)",
};

export function swatchFor(value: string): string | null {
  const key = value.trim().toLowerCase();
  if (NAMED_COLOURS[key]) return NAMED_COLOURS[key];
  if (/^#[0-9a-f]{3,8}$/i.test(key)) return key;
  const word = key.split(/[\s/-]+/).pop() ?? "";
  return NAMED_COLOURS[word] ?? null;
}

export function VariantSelector({
  options,
  variants,
  selection,
  onChange,
  compact = false,
}: {
  options: { name: string; values: string[] }[];
  variants: StorefrontVariant[];
  selection: VariantAttributes;
  onChange: (next: VariantAttributes) => void;
  compact?: boolean;
}) {
  if (options.length === 0) return null;

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {options.map((axis) => {
        const isColour = COLOUR_AXES.test(axis.name);
        const selected = selection[axis.name];
        // An axis whose values each carry their own photo renders as image
        // tiles — a 40 px swatch is not enough to judge a printed gift. The
        // decision is made from the whole variant list (not the current
        // selection) so the layout cannot jump mid-choice; the photo inside a
        // tile still follows the rest of the selection.
        const imageForValue = (value: string): string | null =>
          variants.find((v) => !!v.image && v.attributes[axis.name] === value)?.image ?? null;
        const axisImages = axis.values.map(imageForValue);
        // Tiles only when this is the axis that actually changes the picture:
        // several values carry photos and they differ. A Size axis whose values
        // all resolve to the same colour photo stays a compact pill row.
        const hasPhotos =
          axisImages.some(Boolean) && new Set(axisImages.filter(Boolean)).size > 1;
        const photoFor = (value: string): string | null => {
          const match = variants.find(
            (v) =>
              !!v.image &&
              v.attributes[axis.name] === value &&
              Object.entries(selection).every(([k, val]) => k === axis.name || !val || v.attributes[k] === val),
          );
          return match?.image ?? imageForValue(value);
        };

        return (
          <fieldset key={axis.name}>
            <legend className="mb-2.5 flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span>
                {axis.name}
                {selected && <span className="ml-1.5 normal-case tracking-normal text-foreground">· {selected}</span>}
              </span>
              {!selected && <span className="font-medium normal-case tracking-normal">Select {axis.name.toLowerCase()}</span>}
            </legend>
            {hasPhotos ? (
              <div className="flex flex-wrap gap-2.5">
                {axis.values.map((value) => {
                  const active = selected === value;
                  const available = valueAvailable(
                    variants.filter((v) => v.stock > 0),
                    axis.name,
                    value,
                    selection,
                  );
                  const photo = photoFor(value);
                  const swatch = isColour ? swatchFor(value) : null;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={`${axis.name} ${value}${available ? "" : " (out of stock)"}`}
                      onClick={() => onChange({ ...selection, [axis.name]: active ? "" : value })}
                      className={cn(
                        "group/variant relative w-[7.5rem] shrink-0 rounded-xl border p-2 text-left transition-all",
                        active
                          ? "border-foreground bg-foreground/[0.04] ring-2 ring-foreground/20"
                          : "border-foreground/15 bg-background hover:border-foreground/45 hover:shadow-sm",
                      )}
                    >
                      <span
                        className={cn(
                          "studio relative aspect-square w-full overflow-hidden rounded-lg ring-1 ring-foreground/[0.06]",
                          !available && "opacity-45 grayscale",
                        )}
                      >
                        {photo ? (
                          <Image
                            src={photo}
                            alt={`${axis.name} ${value}`}
                            fill
                            sizes="(max-width: 768px) 40vw, 112px"
                            className="object-contain p-1.5 mix-blend-multiply transition-transform duration-300 group-hover/variant:scale-[1.04] dark:mix-blend-normal"
                          />
                        ) : swatch ? (
                          <span aria-hidden className="absolute inset-0" style={{ background: swatch }} />
                        ) : (
                          <span className="absolute inset-0 grid place-items-center text-lg font-extrabold text-muted-foreground/70">
                            {value.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        {active && (
                          <span
                            className={cn(
                              "absolute right-1.5 bottom-1.5 grid size-6 place-items-center rounded-full shadow-sm",
                              photo || !swatch ? "bg-foreground text-background" : isDark(swatch) ? "bg-white text-black" : "bg-black text-white",
                            )}
                            aria-hidden
                          >
                            <Check className="size-3.5" strokeWidth={3} />
                          </span>
                        )}
                      </span>
                      <span className="mt-1.5 flex items-center justify-between gap-1 px-0.5 text-[12.5px] font-semibold leading-tight">
                        <span className={cn("min-w-0 truncate", !available && "text-muted-foreground line-through decoration-2 decoration-muted-foreground/70")}>
                          {value}
                        </span>
                        {!available && <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">out</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {axis.values.map((value) => {
                  const active = selected === value;
                  const available = valueAvailable(
                    variants.filter((v) => v.stock > 0),
                    axis.name,
                    value,
                    selection,
                  );
                  const swatch = isColour ? swatchFor(value) : null;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={`${axis.name} ${value}${available ? "" : " (out of stock)"}`}
                      onClick={() => onChange({ ...selection, [axis.name]: active ? "" : value })}
                      className={cn(
                        "relative inline-flex items-center gap-2 rounded-lg border text-[13px] font-semibold transition-all",
                        swatch ? "h-10 pr-3 pl-1.5" : compact ? "h-9 px-3" : "h-10 min-w-11 px-3.5",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-foreground/20 bg-background text-foreground hover:border-foreground/60",
                        !available && "text-muted-foreground",
                      )}
                    >
                      {swatch && (
                        <span
                          aria-hidden
                          className={cn(
                            "grid size-7 place-items-center rounded-md ring-1 ring-inset ring-black/10",
                            value.toLowerCase() === "white" && "ring-black/20",
                          )}
                          style={{ background: swatch }}
                        >
                          {active && (
                            <Check
                              className={cn("size-3.5", isDark(swatch) ? "text-white" : "text-black")}
                              strokeWidth={3}
                            />
                          )}
                        </span>
                      )}
                      <span className={cn(!available && "line-through decoration-2 decoration-muted-foreground/70")}>
                        {value}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}

function isDark(colour: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(colour);
  if (!m) return colour.startsWith("linear");
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 150;
}
