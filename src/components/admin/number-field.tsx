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
 *
 * While the input is focused the typed text is the source of truth: the
 * form may echo a different value back (react-hook-form resolves an
 * `undefined` field to its default — e.g. `0` — which used to make the last
 * digit impossible to delete). On blur we resync to the canonical number.
 */
export function NumberField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  field: { value: formValue, onChange, onBlur, name, ref: fieldRef },
  integer = false,
  allowNegative = false,
  emptyValue = undefined,
  onFocus,
  ...props
}: {
  field: ControllerRenderProps<TFieldValues, TName>;
  /** Digits only (no decimal point). */
  integer?: boolean;
  allowNegative?: boolean;
  /**
   * What the form receives when the box is emptied. `undefined` (default)
   * lets zod report "required"; pass `null` for nullable fields.
   */
  emptyValue?: undefined | null;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "onBlur" | "name" | "ref" | "type" | "inputMode">) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const value = formValue as unknown;
  const canonical = typeof value === "number" && Number.isFinite(value) ? String(value) : "";
  // Editing: show exactly what was typed. Otherwise show the form's number.
  const display = draft !== null ? draft : canonical;

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
      ref={(node) => {
        inputRef.current = node;
        fieldRef(node);
      }}
      value={display}
      onFocus={(event) => {
        // Start a draft from the current text so subsequent keystrokes are
        // never overridden by what the form echoes back.
        setDraft(event.currentTarget.value);
        onFocus?.(event);
      }}
      onBlur={() => {
        setDraft(null);
        onBlur();
      }}
      onChange={(event) => {
        const raw = event.target.value.replace(/,/g, "");
        if (!pattern.test(raw)) return; // ignore letters and stray symbols
        setDraft(raw);
        if (raw === "" || raw === "-" || raw === ".") {
          onChange(emptyValue);
          return;
        }
        const next = Number(raw);
        onChange(Number.isFinite(next) ? next : emptyValue);
      }}
    />
  );
}
