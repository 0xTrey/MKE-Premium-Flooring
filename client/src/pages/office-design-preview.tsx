import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfficeShell } from "@/components/office/OfficeShell";

const evidenceRows = [
  {
    title: "Living Area",
    note: "Derived from highlighted room labels on A2.1 and room schedule on A4.0.",
    badge: "0.86 confidence",
    badgeVariant: "secondary" as const,
  },
  {
    title: "Garage",
    note: "Included in plan set but excluded from flooring scope by note 13 on bid brief.",
    badge: "manual check",
    badgeVariant: "outline" as const,
  },
  {
    title: "Underlayment",
    note: "No moisture barrier language found. Prompt estimator before final approval.",
    badge: "missing info",
    badgeVariant: "outline" as const,
  },
];

const draftRows = [
  {
    title: "Glue-down LVP, main living areas",
    quantity: "1,486 sq ft",
    status: "verified",
    statusClassName: "text-emerald-700",
    note: "Evidence: A2.1 room blocks plus schedule match. Waste applied at 10% from company default.",
  },
  {
    title: "Underlayment",
    quantity: "1,486 sq ft",
    status: "review",
    statusClassName: "text-rose-700",
    note: "Assumed optional based on company default. Source packet did not confirm requirement.",
  },
  {
    title: "Demolition and haul-away",
    quantity: "flat fee",
    status: "override",
    statusClassName: "text-rose-700",
    note: "Founder increased from standard package after reading scope note about occupied unit access.",
  },
];

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-h-[680px] flex-col overflow-hidden rounded-lg border border-stone-300 bg-stone-50">
      <div className="border-b border-stone-300 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-600">{subtitle}</p>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function PreviewPlan() {
  return (
    <div className="rounded-md border border-dashed border-stone-300 bg-stone-100 p-3">
      <div className="text-xs text-slate-500">Packet files · 3 plans · 1 scope brief · 2 addenda</div>
      <div className="relative mt-3 h-40 overflow-hidden rounded-sm border border-stone-300 bg-[#fbfaf6]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(184,179,168,0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(184,179,168,0.55) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute left-[18%] top-[22%] h-[22%] w-[36%] border-2 border-amber-700 bg-amber-700/10" />
        <div className="absolute left-[60%] top-[54%] h-[16%] w-[24%] border-2 border-teal-800 bg-teal-800/10" />
      </div>
      <div className="mt-3 text-xs text-slate-500">Sheet A2.1 · scaled from 12 ft wall reference · areas tied to draft rows</div>
    </div>
  );
}

export default function OfficeDesignPreviewPage() {
  return (
    <OfficeShell
      title="Evidence-First Estimate Console"
      subtitle="Preview route for the rebuild direction. The working surface is source evidence on the left, structured quote draft in the center, and pricing plus approval on the right."
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-300 bg-stone-100 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Meadowbrook Homes · Bid packet 14B</div>
            <div className="mt-1 text-sm text-slate-600">Preview only. This is the proposed V1 workspace shape, not a live estimate.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="border-stone-400 bg-stone-50">
              Regenerate Draft
            </Button>
            <Button variant="outline" className="border-stone-400 bg-stone-50">
              Flag Missing Info
            </Button>
            <Button className="bg-slate-900 text-white hover:bg-slate-800">Approve and Export Quote</Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.95fr,1.2fr,0.8fr]">
          <Panel
            title="Source Evidence"
            subtitle="Plan packet, page previews, and the snippets behind each quantity."
          >
            <div className="grid gap-3 p-4">
              <PreviewPlan />
              {evidenceRows.map((row) => (
                <div key={row.title} className="grid gap-3 rounded-md border border-stone-300 bg-white p-3 md:grid-cols-[1fr,auto] md:items-center">
                  <div>
                    <div className="text-base font-semibold text-slate-900">{row.title}</div>
                    <div className="mt-1 text-sm leading-5 text-slate-600">{row.note}</div>
                  </div>
                  <Badge variant={row.badgeVariant} className="justify-self-start md:justify-self-end">
                    {row.badge}
                  </Badge>
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Quote Draft"
            subtitle="Structured estimate, assumptions, exclusions, and overrides. This is the thing the founder is reviewing."
          >
            <div className="grid gap-3 p-4">
              {draftRows.map((row) => (
                <div key={row.title} className="rounded-md border border-stone-300 bg-white p-4">
                  <div className="grid gap-2 sm:grid-cols-[1fr,auto,auto] sm:items-center">
                    <div className="text-base font-semibold text-slate-900">{row.title}</div>
                    <div className="text-sm font-semibold text-slate-900">{row.quantity}</div>
                    <div className={`text-sm font-semibold ${row.statusClassName}`}>{row.status}</div>
                  </div>
                  <div className="mt-2 text-sm leading-5 text-slate-600">{row.note}</div>
                </div>
              ))}

              <div className="rounded-md border border-stone-300 bg-white p-4">
                <div className="grid gap-2 sm:grid-cols-[1fr,auto] sm:items-center">
                  <div className="text-base font-semibold text-slate-900">Assumptions and exclusions</div>
                  <Badge variant="outline">3 notes</Badge>
                </div>
                <div className="mt-2 text-sm leading-5 text-slate-600">
                  Customer-facing note block lives here, not in chat. "Furniture moving excluded." "Garage omitted." "Moisture barrier pending confirmation."
                </div>
              </div>
            </div>

            <div className="mt-auto border-t border-stone-300 bg-stone-100 p-4">
              <div className="rounded-md border border-stone-300 bg-white p-3 text-sm text-slate-700">
                Ask: "Raise install labor to 4.75 per sq ft and mark underlayment pending confirmation."
              </div>
              <div className="mt-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-slate-500">
                Type targeted edit or clarification...
              </div>
            </div>
          </Panel>

          <Panel
            title="Pricing and Approval"
            subtitle="Company defaults, job-specific overrides, and final send confidence."
          >
            <div className="grid gap-3 p-4">
              <div className="rounded-md border border-stone-300 bg-white p-4">
                <div className="text-sm text-slate-600">Current quote total</div>
                <div className="mt-2 text-3xl font-semibold text-slate-900">$18,420</div>
                <div className="mt-2 text-sm leading-5 text-slate-700">Material $9,842 · Labor $6,141 · Other $1,422 · Margin buffer $1,015</div>
              </div>

              <div className="rounded-md border border-stone-300 bg-white p-4">
                <div className="text-base font-semibold text-slate-900">Company price book snapshot</div>
                <div className="mt-2 text-sm leading-6 text-slate-700">
                  Flooring material $92/box · Install labor $4.75/sq ft · Underlayment optional · Waste 10%
                </div>
              </div>

              <div className="rounded-md border border-stone-300 bg-white p-4">
                <div className="text-sm text-slate-600">Founder buffer</div>
                <div className="mt-2 rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-slate-900">6.0%</div>
                <div className="mt-3 text-sm text-slate-600">Margin rule</div>
                <div className="mt-2 rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-slate-900">Occupied remodel premium</div>
              </div>

              <div className="rounded-md border border-stone-300 bg-white p-4">
                <div className="text-sm text-slate-600">Trust status</div>
                <div className="mt-2 rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-slate-900">2 warnings remain before quote can send</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </OfficeShell>
  );
}
