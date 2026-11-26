import Link from "next/link";
import {
  ShieldAlert, FolderOpen, Flame, Clock, CheckCircle2, TimerReset, ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { HorizontalBarList } from "@/components/charts/horizontal-bar-list";
import { DonutChart } from "@/components/charts/donut-chart";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { SeverityBadge, StatusBadge } from "@/components/ui/badge";
import {
  dashboardKpis, monthlyTrend, bySeverity, byCategory, byAgency, analystWorkload, trendRangeLabel,
} from "@/lib/stats";
import { agencyById } from "@/lib/reference-data";
import { formatDateTime, relativeTime } from "@/lib/format";
import { getDb } from "@/lib/db";

export default async function DashboardPage() {
  const { incidents, users } = await getDb();
  const now = new Date();
  const kpis = dashboardKpis(incidents, now);
  const trend = monthlyTrend(incidents, now);
  const severity = bySeverity(incidents);
  const categories = byCategory(incidents);
  const agencies = byAgency(incidents, now).slice(0, 6);
  const workload = analystWorkload(incidents, users);
  const recent = [...incidents].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt)).slice(0, 7);

  return (
    <div>
      <PageHeader
        title="Cyber Security Operations Dashboard"
        subtitle={`Division-wide visibility across all reported cyber security incidents — live as at ${formatDateTime(now.toISOString())}`}
        actions={
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-ink-secondary transition hover:bg-black/5"
          >
            View full reports <ArrowRight size={15} />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Total incidents" value={String(kpis.total)} icon={ShieldAlert} tone="brand" hint={`${kpis.thisMonth} this month`} href="/incidents" />
        <StatTile label="Open incidents" value={String(kpis.open)} icon={FolderOpen} tone="warning" hint="active caseload" href="/incidents?status=open" />
        <StatTile label="Critical" value={String(kpis.critical)} icon={Flame} tone="critical" hint={`+${kpis.high} high`} href="/incidents?severity=Critical" />
        <StatTile
          label="SLA breaches"
          value={String(kpis.slaBreaches)}
          icon={Clock}
          tone={kpis.slaBreaches > 0 ? "critical" : "good"}
          hint="open & overdue"
          href="/alerts"
        />
        <StatTile label="Avg response" value={`${kpis.avgResponse.toFixed(1)}h`} icon={TimerReset} tone="brand" hint="report → assigned" />
        <StatTile label="Resolved" value={String(kpis.resolved)} icon={CheckCircle2} tone="good" hint={`avg ${kpis.avgResolution.toFixed(0)}h to close`} href="/incidents?status=closed" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Incident trend" subtitle={`Reported incidents per month, ${trendRangeLabel(now)}`} />
          <TrendLineChart data={trend} />
        </Card>
        <Card>
          <CardHeader title="Incidents by severity" subtitle="All reported incidents" />
          <DonutChart data={severity} centerLabel="incidents" centerValue={String(kpis.total)} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Incidents by category" subtitle="Top reported categories" />
          <HorizontalBarList data={categories} color="var(--series-1)" />
        </Card>
        <Card>
          <CardHeader title="Incidents by agency" subtitle="Top 6 agencies by volume" />
          <HorizontalBarList data={agencies.map((a) => ({ label: a.agency.shortName, value: a.total }))} color="var(--series-2)" />
        </Card>
        <Card>
          <CardHeader title="Analyst workload" subtitle="Open incidents assigned per analyst" />
          <HorizontalBarList data={workload} color="var(--series-7)" />
        </Card>
      </div>

      <Card className="mt-4" padded={false}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">Recent incidents</h3>
            <p className="mt-0.5 text-[12.5px] text-ink-muted">Most recently reported cases across all agencies</p>
          </div>
          <Link href="/incidents" className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-dark">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11.5px] uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-2.5 font-semibold">Incident</th>
                <th className="px-3 py-2.5 font-semibold">Agency</th>
                <th className="px-3 py-2.5 font-semibold">Severity</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold">Assigned to</th>
                <th className="px-5 py-2.5 font-semibold">Reported</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((inc) => (
                <tr key={inc.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--page)]">
                  <td className="px-5 py-3">
                    <Link href={`/incidents/${inc.id}`} className="block max-w-[280px]">
                      <span className="block text-[12.5px] font-semibold text-brand">{inc.id}</span>
                      <span className="block truncate text-[13px] text-ink">{inc.title}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-[13px] text-ink-secondary">{agencyById(inc.agencyId)?.shortName}</td>
                  <td className="px-3 py-3"><SeverityBadge severity={inc.severity} /></td>
                  <td className="px-3 py-3"><StatusBadge status={inc.status} /></td>
                  <td className="px-3 py-3 text-[13px] text-ink-secondary">{inc.assignedTo ?? "Unassigned"}</td>
                  <td className="px-5 py-3 text-[13px] text-ink-muted" title={formatDateTime(inc.reportedAt)}>
                    {relativeTime(inc.reportedAt, now)}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[13px] text-ink-muted">
                    No incidents reported yet. <Link href="/report-incident" className="font-semibold text-brand hover:underline">Report the first incident</Link>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
