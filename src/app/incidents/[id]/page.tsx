import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, Building2, MapPin, User, Radio, Clock, Flame,
  FileText, ListChecks, Paperclip, Search as SearchIcon, BookOpen,
  Download, ShieldCheck, Layers, CalendarClock,
} from "lucide-react";
import { getDb, findIncident } from "@/lib/db";
import { agencyById } from "@/lib/reference-data";
import { formatDate, formatDateTime, relativeTime, slaRemaining } from "@/lib/format";
import { isOpen } from "@/lib/stats";
import { SeverityBadge, StatusBadge, Pill } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { clsx } from "@/lib/clsx";
import {
  CommentForm, FindingsForm, IncidentActionBar, NewTaskForm, ResponseActionForm, TaskStatusSelect,
} from "./incident-actions";

const TIMELINE_DOT: Record<string, string> = {
  status: "bg-[#2a78d6]",
  assignment: "bg-[#4a3aa7]",
  action: "bg-[#1baf7a]",
  escalation: "bg-[#d03b3b]",
  note: "bg-[#eda100]",
  system: "bg-slate-400",
};

const ASSIGNABLE_ROLES = ["Security Analyst", "Incident Manager", "Cyber Security Manager"];

export default async function IncidentDetailPage({ params }: PageProps<"/incidents/[id]">) {
  const { id } = await params;
  const db = await getDb();
  const incident = findIncident(db, id);
  if (!incident) notFound();

  const now = new Date();
  const agency = agencyById(incident.agencyId);
  const sla = slaRemaining(incident.slaDueAt, now);
  const open = isOpen(incident);
  const tasks = db.tasks.filter((t) => t.incidentId === incident.id);
  const assignees = db.users.filter((u) => u.active && ASSIGNABLE_ROLES.includes(u.role)).map((u) => ({ name: u.name, role: u.role }));
  const timeline = [...incident.timeline].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const defaultDue = new Date(now.getTime() + 2 * 86400000).toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5 text-[12.5px] text-ink-muted">
        <Link href="/incidents" className="hover:text-brand">Incidents</Link>
        <ChevronRight size={13} />
        <span className="text-ink-secondary">{incident.id}</span>
      </div>

      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[20px] font-bold tracking-tight text-ink">{incident.id}</h1>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
            {incident.isMajorIncident && (
              <Link href="/major-incident"><Pill tone="critical"><Flame size={12} /> Major Incident</Pill></Link>
            )}
          </div>
          <p className="mt-1.5 max-w-2xl text-[15px] font-medium text-ink-secondary">{incident.title}</p>
        </div>
        <IncidentActionBar
          incidentId={incident.id}
          status={incident.status}
          assignedTo={incident.assignedTo}
          isMajor={incident.isMajorIncident}
          assignees={assignees}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetaTile icon={Building2} label="Agency" value={agency?.shortName ?? "—"} href={agency ? `/agencies/${agency.id}` : undefined} />
        <MetaTile icon={Layers} label="Category" value={incident.category} />
        <MetaTile icon={User} label="Assigned to" value={incident.assignedTo ?? "Unassigned"} />
        <MetaTile icon={MapPin} label="Location" value={incident.location} />
        <MetaTile icon={Radio} label="Source" value={incident.source} />
        <MetaTile
          icon={Clock}
          label="SLA"
          value={!open ? "Closed" : sla.breached ? `${sla.label} overdue` : `${sla.label} remaining`}
          tone={open && sla.breached ? "critical" : "normal"}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Incident description" />
            <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-ink-secondary">{incident.description}</p>
            {incident.impact.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {incident.impact.map((imp) => <Pill key={imp} tone="brand">{imp}</Pill>)}
              </div>
            )}
            {incident.affectedSystems.length > 0 && (
              <div className="mt-4">
                <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Affected systems</p>
                <div className="flex flex-wrap gap-1.5">
                  {incident.affectedSystems.map((s) => <Pill key={s}>{s}</Pill>)}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Timeline" subtitle="Chronological record of all activity on this incident" />
            <ol className="relative space-y-5 border-l border-[var(--gridline)] pl-5">
              {timeline.map((evt) => (
                <li key={evt.id} className="relative">
                  <span className={clsx("absolute -left-[26px] top-0.5 h-3 w-3 rounded-full ring-4 ring-[var(--surface)]", TIMELINE_DOT[evt.kind])} />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className="text-[13.5px] font-semibold text-ink">{evt.title}</p>
                    <p className="text-[11.5px] text-ink-muted">{formatDateTime(evt.timestamp)}</p>
                  </div>
                  {evt.description && <p className="mt-0.5 text-[12.5px] text-ink-secondary">{evt.description}</p>}
                  <p className="mt-0.5 text-[11.5px] text-ink-muted">by {evt.actor}</p>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <CardHeader title="Actions taken" />
            {incident.actionsTaken.length > 0 ? (
              <ul className="space-y-2">
                {incident.actionsTaken.map((a, i) => (
                  <li key={`${a}-${i}`} className="flex items-start gap-2 text-[13px] text-ink-secondary">
                    <ListChecks size={15} className="mt-0.5 shrink-0 text-[#1baf7a]" />
                    {a}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-ink-muted">No response actions recorded yet.</p>
            )}
            <ResponseActionForm incidentId={incident.id} />
          </Card>

          <Card>
            <CardHeader title="Evidence & attachments" subtitle={`${incident.evidence.length} item(s) — securely stored with restricted access`} />
            <ul className="divide-y divide-[var(--border)]">
              {incident.evidence.map((ev) => (
                <li key={ev.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Paperclip size={15} className="shrink-0 text-ink-muted" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">{ev.filename}</p>
                      <p className="truncate text-[11.5px] text-ink-muted">
                        {ev.kind} · {ev.sizeLabel} · uploaded by {ev.uploadedBy} · {relativeTime(ev.uploadedAt, now)}
                      </p>
                    </div>
                  </div>
                  <a href={`/api/evidence/${encodeURIComponent(ev.id)}`} className="shrink-0 rounded-lg p-2 text-ink-muted hover:bg-black/5 hover:text-brand" aria-label={`Download custody record for ${ev.filename}`} title="Download chain-of-custody record">
                    <Download size={15} />
                  </a>
                </li>
              ))}
              {incident.evidence.length === 0 && <li className="py-4 text-[13px] text-ink-muted">No evidence uploaded yet.</li>}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Root cause & lessons learned" />
            {incident.rootCause && (
              <div className="mb-3">
                <p className="mb-1 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">
                  <SearchIcon size={12} /> Root cause
                </p>
                <p className="text-[13.5px] text-ink-secondary">{incident.rootCause}</p>
              </div>
            )}
            {incident.lessonsLearned && (
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">
                  <BookOpen size={12} /> Lessons learned
                </p>
                <p className="text-[13.5px] text-ink-secondary">{incident.lessonsLearned}</p>
              </div>
            )}
            {!incident.rootCause && !incident.lessonsLearned && (
              <p className="text-[13px] text-ink-muted">Not yet recorded — typically completed during recovery or post-incident review.</p>
            )}
            <FindingsForm incidentId={incident.id} rootCause={incident.rootCause} lessonsLearned={incident.lessonsLearned} />
          </Card>

          <Card>
            <CardHeader title="Comments & notes" subtitle="Internal notes visible to the response team" />
            <ul className="space-y-3">
              {incident.comments.map((c) => (
                <li key={c.id} className="flex items-start gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand-dark">
                    {c.author.split(" ").map((n) => n[0]).join("").slice(0, 3)}
                  </span>
                  <div className="min-w-0 flex-1 rounded-lg bg-[var(--page)] px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12.5px] font-semibold text-ink">{c.author}</p>
                      <p className="text-[11px] text-ink-muted">{formatDateTime(c.timestamp)}</p>
                    </div>
                    <p className="mt-0.5 whitespace-pre-line text-[13px] text-ink-secondary">{c.body}</p>
                  </div>
                </li>
              ))}
              {incident.comments.length === 0 && <li className="text-[13px] text-ink-muted">No comments yet.</li>}
            </ul>
            <CommentForm incidentId={incident.id} />
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Case details" />
            <dl className="space-y-3 text-[13px]">
              <Row label="Reported by" value={incident.reportedBy} />
              {incident.reporterEmail && <Row label="Reporter email" value={incident.reporterEmail} />}
              <Row label="Reported at" value={formatDateTime(incident.reportedAt)} />
              <Row label="Assigned at" value={incident.assignedAt ? formatDateTime(incident.assignedAt) : "—"} />
              <Row label="SLA target" value={`${incident.slaHours}h response`} />
              <Row label="SLA due" value={formatDateTime(incident.slaDueAt)} />
              <Row label="Agency" value={agency?.name ?? "—"} />
              <Row label="Agency contact" value={agency?.contactEmail ?? "—"} />
            </dl>
          </Card>

          <Card>
            <CardHeader
              title="Tasks"
              subtitle={`${tasks.filter((t) => t.status !== "Done").length} outstanding of ${tasks.length}`}
              action={<Link href={`/tasks?incident=${incident.id}`} className="text-[12px] font-semibold text-brand hover:underline">Board</Link>}
            />
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-2 rounded-lg bg-[var(--page)] px-3 py-2">
                  <div className="min-w-0">
                    <p className={clsx("text-[12.5px] font-medium", t.status === "Done" ? "text-ink-muted line-through" : "text-ink")}>{t.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-muted">
                      <CalendarClock size={11} /> {formatDate(t.dueDate)} · {t.priority}
                    </p>
                  </div>
                  <TaskStatusSelect task={t} />
                </li>
              ))}
              {tasks.length === 0 && <li className="text-[12.5px] text-ink-muted">No tasks yet.</li>}
            </ul>
            <NewTaskForm incidentId={incident.id} defaultDue={defaultDue} />
          </Card>

          <Card className="bg-[#2a78d6]/5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand" />
              <div>
                <p className="text-[13px] font-semibold text-ink">Auditable record</p>
                <p className="mt-1 text-[12.5px] text-ink-secondary">
                  Every change to this incident is logged to the immutable audit trail. See{" "}
                  <Link href={`/audit-logs?target=${incident.id}`} className="font-semibold text-brand hover:underline">audit history for {incident.id}</Link>.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Related" />
            <Link href={`/investigations?incident=${incident.id}`} className="mb-2 flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-[12.5px] font-medium text-ink-secondary hover:bg-black/5">
              <FileText size={14} /> Investigation progress
            </Link>
            <Link href={`/incidents?agency=${incident.agencyId}`} className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-[12.5px] font-medium text-ink-secondary hover:bg-black/5">
              <Building2 size={14} /> Other incidents from {agency?.shortName ?? "this agency"}
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetaTile({ icon: Icon, label, value, tone = "normal", href }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string; tone?: "normal" | "critical"; href?: string }) {
  const inner = (
    <>
      <div className="flex items-center gap-1.5 text-ink-muted">
        <Icon size={13} />
        <span className="text-[10.5px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={clsx("mt-1.5 truncate text-[13px] font-semibold", tone === "critical" ? "text-[#a92727]" : href ? "text-brand" : "text-ink")}>{value}</p>
    </>
  );
  const cls = "block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5";
  return href ? <Link href={href} className={clsx(cls, "hover:border-brand/40")}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd className="break-all text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
