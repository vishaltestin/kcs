"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  MoreHorizontal,
  Package,
  Pencil,
  Phone,
  ReceiptText,
  ShieldCheck,
  ShieldOff,
  Store,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resetVendorPasswordAction, setVendorStatusAction } from "@/actions/admin/vendors";
import { cn } from "@/lib/utils";

export interface AdminVendorRow {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string | null;
  gstin: string | null;
  stateCode: string;
  logo: string | null;
  status: "ACTIVE" | "SUSPENDED";
  isDefault: boolean;
  productCount: number;
  subOrderCount: number;
  loginEmail: string | null;
  plainPassword: string | null;
}

function VendorPasswordDisplay({ password }: { password: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="inline-flex items-center gap-1.5">
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-foreground">
        {visible ? password : "••••••••"}
      </code>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-3" aria-hidden /> : <Eye className="size-3" aria-hidden />}
      </button>
    </span>
  );
}

function ResetPasswordDialog({
  vendor,
  open,
  onOpenChange,
}: {
  vendor: AdminVendorRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const result = await resetVendorPasswordAction(vendor.id, null, (() => {
      const fd = new FormData();
      fd.set("newPassword", password);
      return fd;
    })());
    setBusy(false);
    if (result.ok) {
      toast.success(result.message ?? "Password reset.");
      setPassword("");
      onOpenChange(false);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset login password</DialogTitle>
          <DialogDescription>
            Set a new password for {vendor.loginEmail ?? vendor.name}&apos;s seller login. Share it
            with them securely.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor={`pwd-${vendor.id}`}>New password</Label>
          <Input
            id={`pwd-${vendor.id}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 chars, letter + number"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || password.length < 8}>
            Reset password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type StatusFilter = "ALL" | "ACTIVE" | "SUSPENDED";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "ACTIVE", label: "Active" },
  { id: "SUSPENDED", label: "Suspended" },
];

export function VendorsTable({ vendors }: { vendors: AdminVendorRow[] }) {
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [resetTarget, setResetTarget] = useState<AdminVendorRow | null>(null);

  const toggleStatus = async (vendor: AdminVendorRow) => {
    const next = vendor.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const result = await setVendorStatusAction(vendor.id, next);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  };

  const visible = vendors
    .filter((v) => filter === "ALL" || v.status === filter)
    .sort((a, b) => a.name.localeCompare(b.name));

  const countFor = (f: StatusFilter) =>
    f === "ALL" ? vendors.length : vendors.filter((v) => v.status === f).length;

  return (
    <>
      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-surface p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
                filter === f.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10.5px] tabular-nums",
                  filter === f.id ? "bg-white/20" : "bg-muted"
                )}
              >
                {countFor(f.id)}
              </span>
            </button>
          ))}
        </div>
        <p className="ml-auto hidden text-xs text-muted-foreground md:block">
          Suspended vendors disappear from the storefront instantly.
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/80 bg-surface/50 px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-muted">
            <Store className="size-5 text-muted-foreground" aria-hidden />
          </span>
          <p className="text-sm font-semibold">No {filter !== "ALL" ? filter.toLowerCase() : ""} vendors</p>
          <p className="max-w-sm text-[13px] text-muted-foreground">
            Add a vendor to start splitting the catalogue and orders across sellers.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((vendor) => (
            <article
              key={vendor.id}
              className={cn(
                "group flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
                vendor.status === "SUSPENDED" ? "border-red-200 bg-red-50/40" : "border-border/70"
              )}
            >
              {/* Identity row */}
              <div className="flex items-start gap-3.5">
                {vendor.logo ? (
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-border/60">
                    <Image src={vendor.logo} alt="" fill className="object-contain p-1.5" sizes="48px" />
                  </div>
                ) : (
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">
                    {vendor.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="flex flex-wrap items-center gap-2 text-[15px] font-bold tracking-tight">
                    <span className="truncate">{vendor.name}</span>
                    {vendor.isDefault && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Platform
                      </Badge>
                    )}
                  </h3>
                  <Link
                    href={`/sellers/${vendor.slug}`}
                    target="_blank"
                    className="mt-0.5 inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    <span className="truncate">/sellers/{vendor.slug}</span>
                    <ExternalLink className="size-3 shrink-0" aria-hidden />
                  </Link>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0 font-semibold",
                    vendor.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {vendor.status === "ACTIVE" ? "Active" : "Suspended"}
                </Badge>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2.5 rounded-xl bg-muted/60 px-3.5 py-2.5">
                  <Package className="size-4 text-muted-foreground" aria-hidden />
                  <div>
                    <p className="text-[15px] leading-none font-bold tabular-nums">{vendor.productCount}</p>
                    <p className="mt-1 text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
                      Products
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl bg-muted/60 px-3.5 py-2.5">
                  <ReceiptText className="size-4 text-muted-foreground" aria-hidden />
                  <div>
                    <p className="text-[15px] leading-none font-bold tabular-nums">{vendor.subOrderCount}</p>
                    <p className="mt-1 text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
                      Sub-orders
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <dl className="mt-4 space-y-1.5 border-t border-border/60 pt-3.5 text-[12.5px]">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{vendor.email}</span>
                  {vendor.phone && (
                    <>
                      <span aria-hidden className="text-border">·</span>
                      <Phone className="size-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{vendor.phone}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <KeyRound className="size-3.5 shrink-0" aria-hidden />
                  {vendor.loginEmail ? (
                    <span className="truncate">{vendor.loginEmail}</span>
                  ) : (
                    <span className="italic">No seller login yet</span>
                  )}
                </div>
                {vendor.plainPassword && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide">Password:</span>
                    <VendorPasswordDisplay password={vendor.plainPassword} />
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-mono text-[11.5px]">{vendor.gstin ?? "No GSTIN"}</span>
                  <span aria-hidden className="text-border">·</span>
                  <span>State code {vendor.stateCode}</span>
                </div>
              </dl>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3.5">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/admin/vendors/${vendor.id}/edit`}>
                    <Pencil aria-hidden /> Edit
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`More actions for ${vendor.name}`}>
                      <MoreHorizontal aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>{vendor.name}</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/sellers/${vendor.slug}`} target="_blank">
                          <Store aria-hidden /> View storefront
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={!vendor.loginEmail} onClick={() => setResetTarget(vendor)}>
                        <KeyRound aria-hidden /> Reset login password
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={vendor.isDefault}
                      onClick={() => toggleStatus(vendor)}
                      className={vendor.status === "ACTIVE" ? "text-destructive focus:text-destructive" : ""}
                    >
                      {vendor.status === "ACTIVE" ? (
                        <>
                          <ShieldOff aria-hidden /> Suspend vendor
                        </>
                      ) : (
                        <>
                          <ShieldCheck aria-hidden /> Activate vendor
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </article>
          ))}
        </div>
      )}

      {resetTarget && (
        <ResetPasswordDialog
          vendor={resetTarget}
          open={!!resetTarget}
          onOpenChange={(open) => !open && setResetTarget(null)}
        />
      )}
    </>
  );
}
