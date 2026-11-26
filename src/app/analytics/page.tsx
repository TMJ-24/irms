import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { HorizontalBarList } from "@/components/charts/horizontal-bar-list";
import { DonutChart } from "@/components/charts/donut-chart";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import {
  bySeverity, byCategory, byAgency, byStatus, monthlyTrend, topAffectedSystems, analystWorkload, dashboardKpis, trendRangeLabel,
} from "@/lib/stats";
import { STATUS_COLORS } from "@/lib/style-maps";
import { getDb } from "@/lib/db";
import type { IncidentStatus } from "@/lib/types";

export default async function AnalyticsPage() {
  const { incidents, users } = await getDb();
  const now = new Date();
  const trend = monthlyTrend(incidents, now);
  const severity = bySeverity(incidents);
  const categories = byCategory(incidents);
  const agencies = byAgency(incidents, now).slice(0, 8).map((a) => ({ label: a.agency.shortName, value: a.total }));
  const statuses = byStatus(incidents);
  const systems = topAffectedSystems(incidents);
  const workload = analystWorkload(incidents, users);
  const kpis = dashboardKpis(incidents, now);
  const slaCompliance = kpis.slaCompliance;

  // Top 5 statuses, with the remainder grouped so the donut always totals every incident.
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
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryStat label="Total incidents" value={String(kpis.total)} />
        <SummaryStat label="Avg response time" value={`${kpis.avgResponse.toFixed(1)}h`} />
        <SummaryStat label="Avg resolution time" value={`${kpis.avgResolution.toFixed(0)}h`} />
        <SummaryStat label="SLA compliance" value={`${slaCompliance}%`} good={slaCompliance >= 80} />
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

function SummaryStat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-[12px] font-medium text-ink-muted">{label}</p>
      <p className={`mt-1.5 text-[22px] font-bold ${good === undefined ? "text-ink" : good ? "text-[#006300]" : "text-[#a92727]"}`}>{value}</p>
    </div>
  );
}
