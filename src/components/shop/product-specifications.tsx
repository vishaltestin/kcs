import { ClipboardList, FileText } from "lucide-react";

export function ProductSpecifications({
  specs,
  description,
}: {
  specs: { id: number; label: string; value: string }[];
  description: string | null;
}) {
  if (specs.length === 0 && !description) return null;

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      {specs.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/[0.07]">
          <div className="flex items-center gap-2 border-b bg-surface px-5 py-3.5">
            <ClipboardList className="size-4 text-primary" aria-hidden />
            <h2 className="text-sm font-extrabold tracking-tight">Specifications</h2>
          </div>
          <dl className="divide-y">
            {specs.map((spec) => (
              <div key={spec.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-5 py-3 text-sm odd:bg-transparent even:bg-surface/60">
                <dt className="font-semibold text-foreground/80">{spec.label}</dt>
                <dd className="text-muted-foreground">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {description && (
        <div className="rounded-2xl bg-card p-6 ring-1 ring-foreground/[0.07] md:p-7">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="size-4 text-primary" aria-hidden />
            <h2 className="text-sm font-extrabold tracking-tight">About this product</h2>
          </div>
          <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            {description.split(/\n{2,}/).map((para, index) => (
              <p key={index} className="whitespace-pre-line first:text-foreground/85">
                {para}
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
