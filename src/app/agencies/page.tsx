import Link from "next/link";
import { Building2, ArrowRight, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { byAgency } from "@/lib/stats";
import { getDemoDb as getDb } from "@/lib/demo-db";

export default async function AgenciesPage() {
  const { incidents } = await getDb();
  const agencies = byAgency(incidents, new Date());

  return (
    <div>
      <PageHeader title="Agencies" subtitle="Cyber security posture across all connected government agencies" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {agencies.map((a) => (
          <Link key={a.agency.id} href={`/agencies/${a.agency.id}`} className="block">
            <Card className="h-full transition hover:border-brand/40 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Building2 size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-ink">{a.agency.shortName}</p>
                    <p className="truncate text-[11.5px] text-ink-muted">{a.agency.sector}</p>
                  </div>
                </div>
                <ArrowRight size={15} className="mt-1.5 shrink-0 text-ink-muted" />
              </div>
              <p className="mt-3 truncate text-[12px] text-ink-muted">{a.agency.name}</p>

              <div className="mt-4 grid grid-cols-4 gap-2 border-t border-[var(--border)] pt-3">
                <MiniMetric label="Total" value={a.total} />
                <MiniMetric label="Open" value={a.open} tone="brand" />
                <MiniMetric label="Critical" value={a.critical} tone="critical" />
                <MiniMetric label="SLA breach" value={a.slaBreaches} tone={a.slaBreaches > 0 ? "critical" : "good"} />
              </div>
              {a.slaBreaches > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-[11.5px] font-medium text-[#a92727]">
                  <AlertTriangle size={12} /> {a.slaBreaches} SLA breach{a.slaBreaches > 1 ? "es" : ""} require attention
                </p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MiniMetric({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "brand" | "critical" | "good" }) {
  const colors: Record<string, string> = {
    neutral: "text-ink",
    brand: "text-[#1c4ed8]",
    critical: "text-[#a92727]",
    good: "text-[#006300]",
  };
  return (
    <div>
      <p className={`text-[16px] font-bold ${colors[tone]}`}>{value}</p>
      <p className="text-[10.5px] text-ink-muted">{label}</p>
    </div>
  );
}
