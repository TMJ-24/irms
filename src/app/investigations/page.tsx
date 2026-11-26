import Link from "next/link";
import { User, FolderLock, MessageSquare, Search, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { agencyById } from "@/lib/reference-data";
import { getDemoDb as getDb } from "@/lib/demo-db";
import { relativeTime } from "@/lib/format";
import type { IncidentStatus } from "@/lib/types";

const ACTIVE: IncidentStatus[] = ["Triage", "Assigned", "Investigating", "Containment", "Eradication"];
const STAGES: IncidentStatus[] = ["Reported", "Triage", "Assigned", "Investigating", "Containment", "Eradication", "Recovery", "Monitoring", "Resolved", "Closed"];

export default async function InvestigationsPage({ searchParams }: PageProps<"/investigations">) {
  const { incident: incidentParam } = await searchParams;
  const focus = typeof incidentParam === "string" ? incidentParam : undefined;
  const { incidents } = await getDb();
  const now = new Date();

  const list = focus
    ? incidents.filter((i) => i.id === focus)
    : incidents.filter((i) => ACTIVE.includes(i.status)).sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));

  return (
    <div>
      <PageHeader
        title="Investigations"
        subtitle={focus ? `Investigation progress for ${focus}` : `${list.length} incidents currently under active investigation`}
        actions={focus ? (
          <Link href="/investigations" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-ink-secondary hover:bg-black/5">
            <X size={14} /> Show all active
          </Link>
        ) : undefined}
      />
      <div className="space-y-3">
        {list.map((inc) => {
          const agency = agencyById(inc.agencyId);
          const stageIdx = STAGES.indexOf(inc.status);
          const lastNote = inc.comments[inc.comments.length - 1];
          return (
            <Card key={inc.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/incidents/${inc.id}`} className="text-[13px] font-semibold text-brand hover:underline">{inc.id}</Link>
                    <SeverityBadge severity={inc.severity} />
                    <StatusBadge status={inc.status} />
                  </div>
                  <Link href={`/incidents/${inc.id}`} className="mt-1 block truncate text-[14.5px] font-semibold text-ink hover:text-brand">{inc.title}</Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-muted">
                    <span className="flex items-center gap-1"><User size={12} /> {inc.assignedTo ?? "Unassigned"}</span>
                    <span>{agency?.shortName}</span>
                    <span className="flex items-center gap-1"><FolderLock size={12} /> {inc.evidence.length} evidence</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} /> {inc.comments.length} notes</span>
                    <span>opened {relativeTime(inc.reportedAt, now)}</span>
                  </div>
                  {focus && lastNote && (
                    <p className="mt-2 rounded-lg bg-[var(--page)] px-3 py-2 text-[12.5px] text-ink-secondary">
                      <span className="font-semibold text-ink">Latest note ({lastNote.author}):</span> {lastNote.body}
                    </p>
                  )}
                </div>

                <div className="shrink-0 lg:w-80">
                  <div className="flex items-center gap-1">
                    {STAGES.map((s, idx) => (
                      <div key={s} className="flex-1" title={s}>
                        <div className={`h-1.5 rounded-full ${stageIdx >= 0 && idx <= stageIdx ? "bg-brand" : "bg-[var(--gridline)]"}`} />
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-right text-[11px] text-ink-muted">
                    {stageIdx >= 0 ? `Stage ${stageIdx + 1} of ${STAGES.length} — ${inc.status}` : inc.status}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
        {list.length === 0 && (
          <Card className="flex flex-col items-center py-14 text-center">
            <Search size={28} className="text-ink-muted" />
            <p className="mt-3 text-sm text-ink-muted">{focus ? `Incident ${focus} was not found.` : "No active investigations right now."}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
