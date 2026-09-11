import type { Metadata } from "next";
import { Building2, Calculator, Map } from "lucide-react";

import { PageHeader, Panel } from "@/components/admin/ui";
import { StoreSettingsForm } from "@/components/admin/shipping/store-settings-form";
import { ZonesEditor } from "@/components/admin/shipping/zones-editor";
import { getAdminShippingZones } from "@/lib/queries/shipping";
import { INDIAN_STATES } from "@/lib/india";

export const metadata: Metadata = { title: "Shipping & Tax" };

export default async function AdminShippingPage() {
  const { settings, zones } = await getAdminShippingZones();

  const covered = new Set(zones.flatMap((z) => z.states.map((s) => s.toLowerCase())));
  const uncovered = INDIAN_STATES.filter((s) => !covered.has(s.toLowerCase()));
  const restZone = zones.find((z) => z.states.length === 0);

  return (
    <div>
      <PageHeader
        title="Shipping & Tax"
        description="Seller identity printed on invoices, the free-shipping rule and the zone-based rate card that prices every order."
      />

      <div className="space-y-6">
        <Panel
          title="Shipping zones & rate card"
          description="Each order is priced by destination state → zone, and chargeable weight → slab."
          icon={Map}
          bodyClassName="p-0"
        >
          <ZonesEditor zones={zones} states={[...INDIAN_STATES]} />
        </Panel>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Panel title="How the rate is calculated" icon={Calculator} className="xl:order-2">
            <ol className="grid gap-3 text-sm text-muted-foreground">
              {[
                ["Chargeable weight", `Per unit: greater of actual weight and volumetric (L × W × H ÷ ${settings.volumetricDivisor}) × quantity, summed across the cart. Items without a weight count as 500 g.`],
                ["Zone", `The delivery state is matched to a zone. States not listed anywhere fall into ${restZone ? `“${restZone.name}”` : "the last zone"}.`],
                ["Slab", "The first slab whose limit ≥ chargeable weight sets the price. Above the last slab, the per-extra-500 g surcharge is added."],
              ].map(([title, body], i) => (
                <li key={title} className="rounded-xl bg-surface/70 p-4 ring-1 ring-foreground/[0.05]">
                  <p className="mb-1 flex items-center gap-2 font-semibold text-foreground">
                    <span className="grid size-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{i + 1}</span>
                    {title}
                  </p>
                  <p className="text-[13px] leading-relaxed">{body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[13px] text-muted-foreground">
              Orders at or above <strong className="text-foreground">₹{settings.freeShippingThreshold.toLocaleString("en-IN")}</strong>{" "}
              ship free. {uncovered.length > 0 && restZone
                ? `${uncovered.length} states/UTs currently route to “${restZone.name}”.`
                : uncovered.length > 0
                  ? `${uncovered.length} states/UTs are not covered by any zone — add a catch-all zone with no states.`
                  : "Every state is explicitly mapped."}
            </p>
          </Panel>

          <Panel
            title="Seller & invoice details"
            description="Printed on every invoice. GSTIN turns it into a tax invoice with CGST/SGST or IGST."
            icon={Building2}
            className="xl:order-1"
          >
            <StoreSettingsForm settings={settings} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
