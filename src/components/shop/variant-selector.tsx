"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { valueAvailable, type StorefrontVariant, type VariantAttributes } from "@/lib/variants";

/**
 * Colour / size picker. Colour-like axes render as swatches (with the CSS
 * colour when the value is a recognisable colour name), everything else as
 * pill chips. Values that lead to no in-stock variant are shown struck-through
 * but stay clickable so the customer can still read the price.
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
        return (
          <fieldset key={axis.name}>
            <legend className="mb-2 flex w-full items-center justify-between text-[13px]">
              <span className="font-bold">
                {axis.name}
                {selected && <span className="ml-1.5 font-medium text-muted-foreground">· {selected}</span>}
              </span>
              {!selected && <span className="text-xs text-muted-foreground">Select {axis.name.toLowerCase()}</span>}
            </legend>
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
                      "relative inline-flex items-center gap-2 rounded-xl border-2 text-[13px] font-semibold transition-all",
                      swatch ? "h-10 pr-3 pl-1.5" : compact ? "h-9 px-3" : "h-10 min-w-11 px-3.5",
                      active
                        ? "border-primary bg-primary/[0.06] text-foreground shadow-[0_0_0_3px_rgb(195_28_24/0.12)]"
                        : "border-border bg-background text-foreground hover:border-foreground/40",
                      !available && "text-muted-foreground",
                    )}
                  >
                    {swatch && (
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-7 place-items-center rounded-lg ring-1 ring-inset ring-black/10",
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
                    {!swatch && active && (
                      <span aria-hidden className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-primary text-white">
                        <Check className="size-2.5" strokeWidth={3.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
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
