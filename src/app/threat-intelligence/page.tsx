import Link from "next/link";
import { Radar, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { SeverityBadge, Pill } from "@/components/ui/badge";
import { getDb } from "@/lib/db";
import { isOpen } from "@/lib/stats";
import { AddIntelForm } from "./add-intel-form";
import { formatDate } from "@/lib/format";

const TYPE_TONE: Record<string, "brand" | "critical" | "warning" | "good" | "neutral"> = {
  Advisory: "warning",
  "IOC Feed": "brand",
  Vulnerability: "critical",
  Campaign: "warning",
  Malware: "critical",
};

export default async function ThreatIntelligencePage() {
  const { threatIntel, incidents } = await getDb();
  return (
    <div>
      <PageHeader title="Threat Intelligence" subtitle="Advisories, campaigns and indicators relevant to Papua New Guinea government networks" actions={<AddIntelForm />} />
      <div className="space-y-3">
        {threatIntel.map((t) => {
          const related = incidents.filter((i) => i.category === t.relatedCategory);
          const relatedOpen = related.filter(isOpen).length;
          return (
          <Card key={t.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={TYPE_TONE[t.type]}>{t.type}</Pill>
                  <SeverityBadge severity={t.severity} />
                  <span className="text-[11.5px] text-ink-muted">{t.id}</span>
                </div>
                <h3 className="mt-1.5 text-[15px] font-bold text-ink">{t.title}</h3>
                <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-ink-secondary">{t.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">IOCs:</span>
                  {t.iocs.map((ioc) => (
                    <code key={ioc} className="rounded bg-[var(--page)] px-1.5 py-0.5 font-mono text-[11.5px] text-ink-secondary">{ioc}</code>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-1.5 text-[12px] text-ink-muted sm:items-end sm:text-right">
                <span className="flex items-center gap-1"><Radar size={12} /> {t.source}</span>
                <span>{formatDate(t.publishedAt)}</span>
                <span className="mt-1">Related: <span className="font-medium text-ink-secondary">{t.relatedCategory}</span></span>
                <Link
                  href={`/incidents?q=${encodeURIComponent(t.relatedCategory)}`}
                  className="font-semibold text-brand hover:underline"
                >
                  {related.length} related incident{related.length === 1 ? "" : "s"} ({relatedOpen} open)
                </Link>
              </div>
            </div>
          </Card>
          );
        })}
        {threatIntel.length === 0 && (
          <Card className="py-12 text-center">
            <Radar size={26} className="mx-auto text-ink-muted" />
            <p className="mt-3 text-sm text-ink-muted">No threat intelligence published yet. Use <span className="font-semibold">Publish advisory</span> to add the first item.</p>
          </Card>
        )}
      </div>

      <Card className="mt-4 flex items-center gap-2.5 bg-[#2a78d6]/5">
        <ExternalLink size={16} className="shrink-0 text-brand" />
        <p className="text-[12.5px] text-ink-secondary">
          Threat intelligence is aggregated from the PNG National CERT, regional CERT partners and vendor advisories. Report suspected indicators via the <Link href="/report-incident" className="font-semibold text-brand hover:underline">Report Incident</Link> form.
        </p>
      </Card>
    </div>
  );
}
