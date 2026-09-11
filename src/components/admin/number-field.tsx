"use client";

import * as React from "react";
import type { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";

import { Input } from "@/components/ui/input";

/**
 * Numeric input for react-hook-form fields typed as `number`.
 *
 * Why not `<input type="number">` + `valueAsNumber`? An empty box yields
 * `NaN`, React warns "Received NaN for the `value` attribute", and browsers
 * sanitise half-typed decimals ("749.") to "" mid-keystroke. This component
 * owns the raw text, allows only numeric characters, and hands the form a
 * finite number — or `undefined` while empty, so zod's own "required"
 * message shows instead of a NaN error.
 */
export function NumberField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  field: { value: formValue, onChange, onBlur, name, ref: inputRef },
  integer = false,
  allowNegative = false,
  ...props
}: {
  field: ControllerRenderProps<TFieldValues, TName>;
  /** Digits only (no decimal point). */
  integer?: boolean;
  allowNegative?: boolean;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "onBlur" | "name" | "ref" | "type" | "inputMode">) {
  // While the user is typing we show exactly what they typed (so "749." keeps
  // its dot); once the form value diverges (reset / setValue) or the field
  // blurs we fall back to the canonical number.
  const [draft, setDraft] = React.useState<string | null>(null);

  const value = formValue as unknown;
  const canonical = typeof value === "number" && Number.isFinite(value) ? String(value) : "";
  const draftMatches = draft !== null && (draft === "" ? value === undefined : Number(draft) === value);
  const display = draftMatches ? draft : canonical;

  const pattern = integer
    ? allowNegative
      ? /^-?\d*$/
      : /^\d*$/
    : allowNegative
      ? /^-?\d*\.?\d*$/
      : /^\d*\.?\d*$/;

  return (
    <Input
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      autoComplete="off"
      {...props}
      name={name}
      ref={inputRef}
      value={display}
      onBlur={() => {
        setDraft(null);
        onBlur();
      }}
      onChange={(event) => {
        const raw = event.target.value.replace(/,/g, "");
        if (!pattern.test(raw)) return; // ignore letters and stray symbols
        setDraft(raw);
        if (raw === "" || raw === "-" || raw === ".") {
          onChange(undefined);
          return;
        }
        const next = Number(raw);
        onChange(Number.isFinite(next) ? next : undefined);
      }}
    />
  );
}
