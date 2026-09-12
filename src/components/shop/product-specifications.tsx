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
    <section className="rule-top grid gap-10 pt-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
      {description && (
        <div className={specs.length === 0 ? "lg:col-span-2 lg:max-w-3xl" : undefined}>
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <FileText className="size-3.5 text-primary" aria-hidden /> About this product
          </h2>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            {description.split(/\n{2,}/).map((para, index) => (
              <p
                key={index}
                className={index === 0 ? "display whitespace-pre-line text-[1.2rem] leading-relaxed! text-foreground/90 md:text-[1.3rem]" : "whitespace-pre-line"}
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      )}

      {specs.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <ClipboardList className="size-3.5 text-primary" aria-hidden /> Specifications
          </h2>
          <dl className="mt-3 divide-y divide-foreground/[0.08] border-y border-foreground/[0.1]">
            {specs.map((spec) => (
              <div key={spec.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2.5 text-sm">
                <dt className="font-medium text-foreground/70">{spec.label}</dt>
                <dd className="text-foreground">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
