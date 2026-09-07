import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 md:mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "primary" | "warning";
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={cn(
            "h-12 w-12 rounded-lg flex items-center justify-center shrink-0",
            tone === "primary" && "bg-primary/10 text-primary",
            tone === "warning" && "bg-amber-100 text-amber-700",
            tone === "default" && "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-tight truncate">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {hint && <p className="text-xs text-muted-foreground/70 mt-0.5">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_TONES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-violet-100 text-violet-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  NEW: "bg-primary/10 text-primary",
  CONTACTED: "bg-blue-100 text-blue-800",
  CLOSED: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={cn("font-semibold", STATUS_TONES[status] ?? "")}>
      {status}
    </Badge>
  );
}
