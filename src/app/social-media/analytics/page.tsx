import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { HorizontalBarList } from "@/components/charts/horizontal-bar-list";
import { TrendLineChart } from "@/components/charts/trend-line-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { getDemoDb as getDb } from "@/lib/demo-db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  socialKpis, socialByPlatform, socialByViolation, socialByStatus, socialMonthlyTrend,
} from "@/lib/stats";
import { trendRangeLabel } from "@/lib/stats";
import { MessageSquareWarning, CheckCircle2, ArrowUpCircle, Clock } from "lucide-react";

const PLATFORM_COLOURS: Record<string, string> = {
  Facebook: "#1877f2", Instagram: "#e1306c", "X (Twitter)": "#1da1f2",
  YouTube: "#ff0000", TikTok: "#010101", LinkedIn: "#0a66c2", WhatsApp: "#25d366", Other: "#898781",
};

export default async function SocialAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = await getDb();
  const reports = db.socialReports ?? [];
  const now = new Date();

  const kpis = socialKpis(reports);
  const byPlatform = socialByPlatform(reports);
  const byViolation = socialByViolation(reports);
  const byStatus = socialByStatus(reports);
  const trend = socialMonthlyTrend(reports, now);

  const statusDonut = byStatus.slice(0, 7).map((s) => ({
    label: s.label,
    value: s.value,
    color: "#2a78d6",
  }));

  const platformDonut = byPlatform.map((p) => ({
    label: p.label,
    value: p.value,
    color: PLATFORM_COLOURS[p.label] ?? "#898781",
  }));

  return (
    <div>
      <PageHeader
        title="Social Media Analytics"
        subtitle="Stage 3F — Monitoring, analysis and reporting for social media violation cases"
        actions={
          <Link href="/social-media" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:underline">
            <ArrowLeft size={14} /> Back to reports
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total reports" value={String(kpis.total)} icon={MessageSquareWarning} tone="brand" hint="all time" />
        <StatTile label="Open" value={String(kpis.open)} icon={Clock} tone="warning" hint="under investigation" />
        <StatTile label="Submitted to Meta" value={String(kpis.submittedToMeta)} icon={ArrowUpCircle} tone="brand" hint="sent to platform" />
        <StatTile label="Action taken" value={`${kpis.pctActioned}%`} icon={CheckCircle2} tone={kpis.pctActioned >= 50 ? "good" : "warning"} hint="of platform submissions" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 mb-4">
        <Card>
          <CardHeader title="Monthly report volume" subtitle={trendRangeLabel(now)} />
          <TrendLineChart data={trend} />
        </Card>
        <Card>
          <CardHeader title="Reports by platform" />
          {platformDonut.length > 0
            ? <DonutChart data={platformDonut} centerLabel="reports" centerValue={String(kpis.total)} />
            : <p className="py-10 text-center text-sm text-ink-muted">No reports yet.</p>}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mb-4">
        <Card>
          <CardHeader title="Reports by violation category" subtitle="Most common types reported" />
          {byViolation.length > 0
            ? <HorizontalBarList data={byViolation} color="var(--series-5)" />
            : <p className="py-10 text-center text-sm text-ink-muted">No reports yet.</p>}
        </Card>
        <Card>
          <CardHeader title="Case status breakdown" />
          {statusDonut.length > 0
            ? <DonutChart data={statusDonut} centerLabel="cases" centerValue={String(kpis.total)} />
            : <p className="py-10 text-center text-sm text-ink-muted">No reports yet.</p>}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Process notes — Stage 3F"
          subtitle="As defined in the Cyber Incident and Social Media Reporting & Handling Process"
        />
        <ul className="space-y-2 text-[13px] text-ink-secondary">
          {[
            "Volume of reports received — tracked above by month and by platform.",
            "Most common types of violations — displayed in the violation category chart.",
            "Platforms / accounts generating recurring issues — filter the reports list by platform.",
            "Number of cases escalated to Meta — visible in the Submitted to Meta KPI.",
            "Number of cases where action was taken — displayed as the Action Taken % KPI.",
            "Emerging trends and recurring harmful content — review the monthly trend and top categories.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}