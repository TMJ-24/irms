"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileBarChart, FileText, Users, Briefcase } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { HorizontalBarList } from "@/components/charts/horizontal-bar-list";
import { formatDate } from "@/lib/format";
import type { GeneratedReport } from "@/lib/types";
import { clsx } from "@/lib/clsx";

const LEVELS = [
  { key: "operational", label: "Operational", icon: Users, description: "For analysts — my incidents, open cases, SLA due, workload." },
  { key: "management", label: "Management", icon: Briefcase, description: "For Cyber Security management — trends, agency performance, SLA compliance." },
  { key: "executive", label: "Executive", icon: FileBarChart, description: "For senior government leadership — risk trends, major incidents, agency comparison." },
] as const;

type Datum = { label: string; value: number };

/** Downloads trigger a server-side log entry; refresh shortly after so "Recent reports" updates. */
function useRefreshAfterDownload() {
  const router = useRouter();
  return () => window.setTimeout(() => router.refresh(), 1200);
}

function ExportLink({ type, label = "Export CSV" }: { type: GeneratedReport["exportType"]; label?: string }) {
  const refresh = useRefreshAfterDownload();
  return (
    <a href={`/api/export?type=${type}`} onClick={refresh} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-brand-dark">
      <Download size={14} /> {label}
    </a>
  );
}

export function ReportsView({
  userName,
  operational,
  management,
  executive,
  recent,
}: {
  userName: string;
  operational: { myOpen: number; myCriticalHigh: number; slaDueThisWeek: number; myOverdue: number; closedThisMonth: number };
  management: { total: number; open: number; slaBreaches: number; avgResolution: string; agencies: Datum[] };
  executive: { critical: number; majors: number; agenciesAffected: number; slaCompliance: string; categories: Datum[] };
  recent: GeneratedReport[];
}) {
  const [level, setLevel] = useState<(typeof LEVELS)[number]["key"]>("management");
  const refresh = useRefreshAfterDownload();

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {LEVELS.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => setLevel(l.key)}
            aria-pressed={level === l.key}
            className={clsx(
              "rounded-xl border p-4 text-left transition",
              level === l.key ? "border-brand bg-brand/5 ring-1 ring-brand/30" : "border-[var(--border)] bg-[var(--surface)] hover:bg-black/5"
            )}
          >
            <l.icon size={18} className={level === l.key ? "text-brand" : "text-ink-muted"} />
            <p className="mt-2 text-[13.5px] font-bold text-ink">{l.label}</p>
            <p className="mt-0.5 text-[12px] text-ink-muted">{l.description}</p>
          </button>
        ))}
      </div>

      {level === "operational" && (
        <Card>
          <CardHeader title="Operational report — my caseload" subtitle={`Prepared for ${userName} — incidents you are assigned to or have acted on`} action={<ExportLink type="operational" />} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <MiniStat label="My open incidents" value={operational.myOpen} />
            <MiniStat label="Critical / high" value={operational.myCriticalHigh} />
            <MiniStat label="SLA due this week" value={operational.slaDueThisWeek} />
            <MiniStat label="SLA overdue" value={operational.myOverdue} />
            <MiniStat label="Closed this month" value={operational.closedThisMonth} />
          </div>
        </Card>
      )}

      {level === "management" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Management report — division performance" action={<ExportLink type="management" />} />
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Total incidents" value={management.total} />
              <MiniStat label="Open incidents" value={management.open} />
              <MiniStat label="SLA breaches" value={management.slaBreaches} />
              <MiniStat label="Avg resolution" value={management.avgResolution} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Agency performance" subtitle="Incident volume by agency" />
            <HorizontalBarList data={management.agencies} color="var(--series-2)" />
          </Card>
        </div>
      )}

      {level === "executive" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Executive summary — government-wide risk" action={<ExportLink type="executive" />} />
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Critical incidents" value={executive.critical} />
              <MiniStat label="Major incidents declared" value={executive.majors} />
              <MiniStat label="Agencies affected" value={executive.agenciesAffected} />
              <MiniStat label="SLA compliance" value={executive.slaCompliance} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Emerging threat categories" subtitle="Most reported incident categories, all time" />
            <HorizontalBarList data={executive.categories} color="var(--series-8)" />
          </Card>
        </div>
      )}

      <Card className="mt-4" padded={false}>
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h3 className="text-[15px] font-semibold text-ink">Recent reports</h3>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">Every export is recorded here and in the audit log. Download regenerates the report with current data.</p>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {recent.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <FileText size={16} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-ink">{r.name}</p>
                  <p className="text-[12px] text-ink-muted">{r.id} · {r.level} · generated by {r.generatedBy} · {formatDate(r.generatedAt)}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{r.format}</span>
                <a href={`/api/export?type=${r.exportType}`} onClick={refresh} className="rounded-lg p-1.5 text-ink-muted hover:bg-black/5 hover:text-brand" aria-label={`Download latest ${r.name}`} title="Download (regenerates with current data)">
                  <Download size={15} />
                </a>
              </div>
            </li>
          ))}
          {recent.length === 0 && <li className="px-5 py-8 text-center text-[13px] text-ink-muted">No reports generated yet.</li>}
        </ul>
      </Card>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-[var(--page)] p-3">
      <p className="text-[11.5px] text-ink-muted">{label}</p>
      <p className="mt-1 text-[19px] font-bold text-ink">{value}</p>
    </div>
  );
}
