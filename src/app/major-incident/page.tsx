import Link from "next/link";
import {
  Radar, SearchCheck, Flame, Users2, ShieldOff, Megaphone, Wrench, ClipboardCheck, BookOpen, FileCheck2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { agencyById } from "@/lib/reference-data";
import { getDb } from "@/lib/db";
import { isOpen } from "@/lib/stats";
import { formatDateTime, relativeTime } from "@/lib/format";
import { DeclareMajorIncidentPanel } from "./declare-panel";

const WORKFLOW = [
  { title: "Incident detected", icon: Radar, desc: "Anomaly identified via monitoring, report, or third-party notification." },
  { title: "Criticality assessment", icon: SearchCheck, desc: "SOC and Incident Manager assess scope, severity and potential impact." },
  { title: "Major Incident declared", icon: Flame, desc: "Cyber Security Manager formally declares a Major Cyber Incident." },
  { title: "Incident Response Team activated", icon: Users2, desc: "Cross-functional response team assembled and briefed." },
  { title: "Containment", icon: ShieldOff, desc: "Immediate measures applied to limit spread and impact." },
  { title: "Government leadership notification", icon: Megaphone, desc: "Executive and government leadership formally briefed." },
  { title: "Technical recovery", icon: Wrench, desc: "Eradication of threat and restoration of affected systems." },
  { title: "Post-Incident Review", icon: ClipboardCheck, desc: "Formal review of response effectiveness and timeline." },
  { title: "Lessons learned", icon: BookOpen, desc: "Root cause and improvement actions documented." },
  { title: "Final report", icon: FileCheck2, desc: "Comprehensive report issued to management and stakeholders." },
];

export default async function MajorIncidentPage() {
  const { incidents } = await getDb();
  const now = new Date();
  const declaredAt = (i: (typeof incidents)[number]) =>
    i.timeline.find((e) => e.title === "Declared Major Cyber Incident")?.timestamp ?? i.reportedAt;
  const majors = incidents.filter((i) => i.isMajorIncident).sort((a, b) => declaredAt(b).localeCompare(declaredAt(a)));
  const candidates = incidents
    .filter((i) => isOpen(i) && !i.isMajorIncident && (i.severity === "Critical" || i.severity === "High"))
    .sort((a, b) => (a.severity === b.severity ? b.reportedAt.localeCompare(a.reportedAt) : a.severity === "Critical" ? -1 : 1))
    .map((i) => ({ id: i.id, title: i.title, severity: i.severity }));

  return (
    <div>
      <PageHeader
        title="Major Cyber Incident Workflow"
        subtitle="A separate, accelerated response track for incidents with severe, wide-reaching, or national impact"
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Major incident response workflow" subtitle="Followed for every declared Major Cyber Incident" />
          <ol className="relative space-y-0">
            {WORKFLOW.map((step, idx) => (
              <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                {idx < WORKFLOW.length - 1 && (
                  <span className="absolute left-[19px] top-10 h-full w-px bg-[var(--gridline)]" />
                )}
                <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d03b3b]/10 text-[#d03b3b] ring-4 ring-[var(--surface)]">
                  <step.icon size={17} />
                </span>
                <div className="pt-1.5">
                  <p className="text-[13.5px] font-bold text-ink">{idx + 1}. {step.title}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-muted">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-4">
          <DeclareMajorIncidentPanel candidates={candidates} />
          <Card className="bg-[#d03b3b]/5">
            <p className="text-[12.5px] leading-relaxed text-ink-secondary">
              A Major Cyber Incident bypasses the standard queue: it activates the cross-agency Incident Response Team, triggers mandatory executive notification, and carries a 30-minute initial-briefing target regardless of the SLA of the underlying incident.
            </p>
          </Card>
        </div>
      </div>

      <Card className="mt-4" padded={false}>
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h3 className="text-[15px] font-semibold text-ink">Declared major incidents</h3>
          <p className="mt-0.5 text-[12.5px] text-ink-muted">{majors.length} incident(s) escalated to Major Cyber Incident status</p>
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {majors.map((inc) => (
            <li key={inc.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/incidents/${inc.id}`} className="text-[12.5px] font-semibold text-brand hover:underline">{inc.id}</Link>
                  <SeverityBadge severity={inc.severity} />
                  <StatusBadge status={inc.status} />
                </div>
                <Link href={`/incidents/${inc.id}`} className="mt-0.5 block truncate text-[13.5px] font-medium text-ink hover:text-brand">{inc.title}</Link>
                <p className="mt-0.5 text-[12px] text-ink-muted">{agencyById(inc.agencyId)?.shortName} · {inc.assignedTo ? `assigned to ${inc.assignedTo}` : "unassigned"}</p>
              </div>
              <span className="shrink-0 text-[12px] text-ink-muted" title={formatDateTime(declaredAt(inc))}>declared {relativeTime(declaredAt(inc), now)}</span>
            </li>
          ))}
          {majors.length === 0 && (
            <li className="px-5 py-10 text-center text-[13px] text-ink-muted">No incidents currently declared as Major Cyber Incidents.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
