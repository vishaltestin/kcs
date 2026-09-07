export { cn } from "cn";

import type { Prisma } from "@prisma/client";

/** Format an integer/decimal amount as INR currency, e.g. ₹1,234. */
export function formatCurrency(amount: number | string | Prisma.Decimal | null | undefined): string {
  if (amount === null || amount === undefined) return "₹0";
  const value = typeof amount === "string" ? Number(amount) : Number(amount);
  if (Number.isNaN(value)) return "₹0";
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Convert a Prisma Decimal (or number) to a plain number for client components. */
export function toNumber(value: number | string | Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

/** URL-friendly slug generator. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Format a date for display, e.g. "6 Sep 2026". */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format a date with time, e.g. "6 Sep 2026, 2:30 PM". */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Human readable order number, e.g. KCS-20260906-8F3A. */
export function generateOrderNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KCS-${stamp}-${rand}`;
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Initials for avatar fallbacks. */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Escape user text used inside attribute-like contexts (defence in depth). */
export function sanitizeText(value: string): string {
  return value.replace(/[<>]/g, "").trim();
}
