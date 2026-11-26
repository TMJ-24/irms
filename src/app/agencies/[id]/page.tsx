import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Mail, Building2 } from "lucide-react";
import { AGENCIES } from "@/lib/reference-data";
import { getDemoDb as getDb } from "@/lib/demo-db";
import { isOpen, isSlaBreached } from "@/lib/stats";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { HorizontalBarList } from "@/components/charts/horizontal-bar-list";
import { formatDate } from "@/lib/format";
import { ShieldAlert, FolderOpen, Flame, Clock } from "lucide-react";

export default async function AgencyDetailPage({ params }: PageProps<"/agencies/[id]">) {
  const { id } = await params;
  const agency = AGENCIES.find((a) => a.id === id);
  if (!agency) notFound();

  const db = await getDb();
  const now = new Date();
  const incidents = db.incidents.filter((i) => i.agencyId === agency.id).sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
  const open = incidents.filter(isOpen);
  const critical = incidents.filter((i) => i.severity === "Critical");
  const slaBreach = incidents.filter((i) => isSlaBreached(i, now));

  const catCounts = new Map<string, number>();
  for (const i of incidents) catCounts.set(i.category, (catCounts.get(i.category) ?? 0) + 1);
  const categories = [...catCounts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5 text-[12.5px] text-ink-muted">
        <Link href="/agencies" className="hover:text-brand">Agencies</Link>
        <ChevronRight size={13} />
        <span className="text-ink-secondary">{agency.shortName}</span>
      </div>

      <PageHeader
        title={agency.name}
        subtitle={`${agency.sector} · ${agency.contactEmail}`}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total incidents" value={String(incidents.length)} icon={ShieldAlert} tone="brand" href={`/incidents?agency=${agency.id}`} />
        <StatTile label="Open incidents" value={String(open.length)} icon={FolderOpen} tone="warning" />
        <StatTile label="Critical incidents" value={String(critical.length)} icon={Flame} tone="critical" />
        <StatTile label="SLA breaches" value={String(slaBreach.length)} icon={Clock} tone={slaBreach.length > 0 ? "critical" : "good"} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" padded={false}>
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h3 className="text-[15px] font-semibold text-ink">Incident history</h3>
          </div>
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[11.5px] uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-2.5 font-semibold">Incident</th>
                  <th className="px-3 py-2.5 font-semibold">Severity</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-5 py-2.5 font-semibold">Reported</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--page)]">
                    <td className="px-5 py-3">
                      <Link href={`/incidents/${inc.id}`} className="block max-w-[320px]">
                        <span className="block text-[12px] font-semibold text-brand">{inc.id}</span>
                        <span className="block truncate text-[13px] text-ink">{inc.title}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-3"><SeverityBadge severity={inc.severity} /></td>
                    <td className="px-3 py-3"><StatusBadge status={inc.status} /></td>
                    <td className="px-5 py-3 text-[12.5px] text-ink-muted">{formatDate(inc.reportedAt)}</td>
                  </tr>
                ))}
                {incidents.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px] text-ink-muted">No incidents reported by this agency.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Incidents by category" />
            {categories.length > 0 ? <HorizontalBarList data={categories} color="var(--series-1)" /> : <p className="text-[13px] text-ink-muted">No data yet.</p>}
          </Card>
          <Card>
            <CardHeader title="Agency contact" />
            <div className="space-y-2 text-[13px]">
              <p className="flex items-center gap-2 text-ink-secondary"><Building2 size={14} className="text-ink-muted" /> {agency.name}</p>
              <p className="flex items-center gap-2 text-ink-secondary"><Mail size={14} className="text-ink-muted" /> {agency.contactEmail}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
