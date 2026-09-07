/**
 * FormData coercion helpers — `formData.get()` returns
 * `FormDataEntryValue | null`, these safely convert to strings for zod.
 */

export function str(value: FormDataEntryValue | null | undefined): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : value.name;
}

export function strOpt(value: FormDataEntryValue | null | undefined): string | undefined {
  const s = str(value);
  return s === "" ? undefined : s;
}
