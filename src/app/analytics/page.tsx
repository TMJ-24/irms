import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { HorizontalBarList } from "@/components/charts/horizontal-bar-list";
import { DonutChart } from "@/components/charts/donut-chart";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import {
  bySeverity, byCategory, byAgency, byStatus, monthlyTrend, topAffectedSystems, analystWorkload,
  dashboardKpis, trendRangeLabel, meanTimeToTriage, meanTimeToContain, meanTimeToResolve,
  escalationRate, closureCompletenessRate, repeatIncidentCount,
} from "@/lib/stats";
import { STATUS_COLORS } from "@/lib/style-maps";
import { getDemoDb as getDb } from "@/lib/demo-db";
import type { IncidentStatus } from "@/lib/types";
import Link from "next/link";

export default async function AnalyticsPage() {
  const db = await getDb();
  const { incidents, users } = db;
  const now = new Date();
  const trend = monthlyTrend(incidents, now);
  const severity = bySeverity(incidents);
  const categories = byCategory(incidents);
  const agencies = byAgency(incidents, now).slice(0, 8).map((a) => ({ label: a.agency.shortName, value: a.total }));
  const statuses = byStatus(incidents);
  const systems = topAffectedSystems(incidents);
  const workload = analystWorkload(incidents, users);
  const kpis = dashboardKpis(incidents, now);

  // PDF Section 9 KPIs
  const mttt = meanTimeToTriage(incidents);
  const mttc = meanTimeToContain(incidents);
  const mttr = meanTimeToResolve(incidents);
  const escRate = escalationRate(incidents);
  const closureRate = closureCompletenessRate(incidents);
  const repeatCount = repeatIncidentCount(incidents);

  const top = statuses.slice(0, 5);
  const rest = statuses.slice(5).reduce((s, d) => s + d.value, 0);
  const statusDonut = [
    ...top.map((s) => ({ label: s.label, value: s.value, color: STATUS_COLORS[s.label as IncidentStatus] ?? "#898781" })),
    ...(rest > 0 ? [{ label: "Other", value: rest, color: "#d6d3d1" }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Deep-dive analytics across severity, category, agency, response performance and emerging threat patterns"
        actions={
          <Link href="/social-media/analytics" className="text-[13px] font-semibold text-brand hover:underline">
            Social Media Analytics →
          </Link>
        }
      />

      {/* Primary KPIs */}
      <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-ink-muted">Response performance (Section 9 KPIs)</div>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-5">
        <KpiTile label="Mean Time to Triage" value={mttt > 0 ? `${mttt.toFixed(1)}h` : "—"} hint="report → first analyst action" />
        <KpiTile label="Mean Time to Assign" value={`${kpis.avgResponse.toFixed(1)}h`} hint="report → assignment" />
        <KpiTile label="Mean Time to Contain" value={mttc > 0 ? `${mttc.toFixed(1)}h` : "—"} hint="report → containment" />
        <KpiTile label="Mean Time to Resolve" value={mttr > 0 ? `${mttr.toFixed(0)}h` : "—"} hint="report → closure" />
        <KpiTile label="SLA compliance" value={`${kpis.slaCompliance}%`} good={kpis.slaCompliance >= 80} hint="open incidents within SLA" />
        <KpiTile label="Escalation rate" value={`${escRate}%`} hint="% of incidents escalated" />
      </div>

      <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-ink-muted">Quality & closure metrics</div>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
        <KpiTile label="Closure completeness" value={`${closureRate}%`} good={closureRate >= 80} hint="% closed with root cause + lessons" />
        <KpiTile label="Repeat incidents" value={String(repeatCount)} hint="same agency + category within 90d" />
        <KpiTile label="Total incidents" value={String(kpis.total)} hint={`${kpis.thisMonth} this month`} />
        <KpiTile label="SLA breaches" value={String(kpis.slaBreaches)} good={kpis.slaBreaches === 0} hint="open & overdue" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Incident volume trend" subtitle={`Monthly reported incidents, ${trendRangeLabel(now)}`} />
          <TrendLineChart data={trend} />
        </Card>
        <Card>
          <CardHeader title="Severity distribution" />
          <DonutChart data={severity} centerLabel="incidents" centerValue={String(kpis.total)} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Incidents by category" subtitle="Full breakdown, all categories" />
          <HorizontalBarList data={categories} color="var(--series-1)" maxItems={15} />
        </Card>
        <Card>
          <CardHeader title="Current status distribution" />
          <DonutChart data={statusDonut} centerLabel="incidents" centerValue={String(kpis.total)} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Incidents by agency" subtitle="Top 8 government agencies" />
          <HorizontalBarList data={agencies} color="var(--series-2)" />
        </Card>
        <Card>
          <CardHeader title="Top affected systems" />
          <HorizontalBarList data={systems} color="var(--series-3)" />
        </Card>
        <Card>
          <CardHeader title="Analyst workload" subtitle="Open incidents per analyst" />
          <HorizontalBarList data={workload} color="var(--series-7)" />
        </Card>
      </div>
    </div>
  );
}

function KpiTile({ label, value, hint, good }: { label: string; value: string; hint?: string; good?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-1 text-[22px] font-bold leading-none ${good === undefined ? "text-ink" : good ? "text-[#006300]" : "text-[#a92727]"}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-ink-muted">{hint}</p>}
    </div>
  );
}