import Link from "next/link";
import { AlertTriangle, ArrowUpCircle, Clock, Flame } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { agencyById } from "@/lib/reference-data";
import { getDb } from "@/lib/db";
import { OPEN_STATUSES } from "@/lib/types";
import { relativeTime, slaRemaining } from "@/lib/format";

export default async function AlertsPage() {
  const { incidents } = await getDb();
  const now = new Date();
  const openIncidents = incidents.filter((i) => OPEN_STATUSES.includes(i.status));
  const slaBreaches = openIncidents
    .filter((i) => slaRemaining(i.slaDueAt, now).breached)
    .sort((a, b) => a.slaDueAt.localeCompare(b.slaDueAt));
  const criticalOpen = openIncidents.filter((i) => i.severity === "Critical");
  const escalations = incidents.flatMap((inc) =>
    inc.timeline.filter((e) => e.kind === "escalation").map((e) => ({ evt: e, incident: inc }))
  ).sort((a, b) => b.evt.timestamp.localeCompare(a.evt.timestamp));

  return (
    <div>
      <PageHeader title="Alerts & Escalations" subtitle="SLA breaches, critical incidents and escalation activity requiring attention" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="h-full">
          <div className="flex items-center gap-2 text-[#a92727]">
            <Clock size={18} />
            <p className="text-[13px] font-bold uppercase tracking-wide">SLA breaches</p>
          </div>
          <p className="mt-2 text-[28px] font-bold text-ink">{slaBreaches.length}</p>
          <p className="text-[12.5px] text-ink-muted">open incidents past their response SLA</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-[#d03b3b]">
            <Flame size={18} />
            <p className="text-[13px] font-bold uppercase tracking-wide">Critical &amp; open</p>
          </div>
          <p className="mt-2 text-[28px] font-bold text-ink">{criticalOpen.length}</p>
          <p className="text-[12.5px] text-ink-muted">
            require immediate attention —{" "}
            <Link href="/incidents?severity=Critical" className="font-semibold text-brand hover:underline">view</Link>
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-brand">
            <ArrowUpCircle size={18} />
            <p className="text-[13px] font-bold uppercase tracking-wide">Escalations</p>
          </div>
          <p className="mt-2 text-[28px] font-bold text-ink">{escalations.length}</p>
          <p className="text-[12.5px] text-ink-muted">escalation events recorded</p>
        </Card>
      </div>

      <Card className="mt-4" padded={false}>
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <AlertTriangle size={16} className="text-[#a92727]" /> SLA breach alerts
          </h3>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {slaBreaches.map((inc) => {
            const sla = slaRemaining(inc.slaDueAt, now);
            return (
              <li key={inc.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/incidents/${inc.id}`} className="text-[12.5px] font-semibold text-brand hover:underline">{inc.id}</Link>
                    <SeverityBadge severity={inc.severity} />
                    <StatusBadge status={inc.status} />
                  </div>
                  <p className="mt-0.5 truncate text-[13.5px] font-medium text-ink">{inc.title}</p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">{agencyById(inc.agencyId)?.shortName} · {inc.assignedTo ? `assigned to ${inc.assignedTo}` : "unassigned"}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#d03b3b]/10 px-2.5 py-1 text-[12px] font-bold text-[#a92727]">{sla.label} overdue</span>
              </li>
            );
          })}
          {slaBreaches.length === 0 && <li className="px-5 py-8 text-center text-[13px] text-ink-muted">No SLA breaches — all open incidents are within target.</li>}
        </ul>
      </Card>

      <Card className="mt-4" padded={false}>
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <ArrowUpCircle size={16} className="text-brand" /> Escalation history
          </h3>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {escalations.slice(0, 15).map(({ evt, incident }) => (
            <li key={`${incident.id}-${evt.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/incidents/${incident.id}`} className="text-[12.5px] font-semibold text-brand hover:underline">{incident.id}</Link>
                  <SeverityBadge severity={incident.severity} />
                </div>
                <p className="mt-0.5 truncate text-[13.5px] text-ink">{evt.title}{evt.description ? ` — ${evt.description}` : ""}</p>
                <p className="mt-0.5 text-[12px] text-ink-muted">by {evt.actor}</p>
              </div>
              <span className="shrink-0 text-[12px] text-ink-muted">{relativeTime(evt.timestamp, now)}</span>
            </li>
          ))}
          {escalations.length === 0 && <li className="px-5 py-8 text-center text-[13px] text-ink-muted">No escalations recorded.</li>}
        </ul>
      </Card>
    </div>
  );
}
