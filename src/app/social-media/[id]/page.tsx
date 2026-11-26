import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ExternalLink, Paperclip, Download, ShieldCheck } from "lucide-react";
import { getDemoDb as getDb } from "@/lib/demo-db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatDate, formatDateTime, relativeTime } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/card";
import { PLATFORM_REPORT_URLS } from "@/lib/reference-data";
import { SocialStatusSelect, AssignOfficerForm, PlatformRefForm, AddSocialNoteForm } from "./social-media-actions";
import { SocialMediaStatusBadge } from "../social-media-explorer";

const TIMELINE_DOT: Record<string, string> = {
  default: "bg-[#2a78d6]",
};

const ASSIGNABLE_ROLES = ["Security Analyst", "Incident Manager", "Cyber Security Manager", "Social Media Officer", "System Administrator"];

export default async function SocialMediaDetailPage({ params }: PageProps<"/social-media/[id]">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const db = await getDb();
  const report = (db.socialReports ?? []).find((r) => r.id === id);
  if (!report) notFound();

  const now = new Date();
  const officers = db.users.filter((u) => u.active && ASSIGNABLE_ROLES.includes(u.role)).map((u) => ({ name: u.name, role: u.role }));
  const timeline = [...report.timeline].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const platformUrl = PLATFORM_REPORT_URLS[report.platform];
  const linkedIncident = report.linkedIncidentId ? db.incidents.find((i) => i.id === report.linkedIncidentId) : undefined;

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5 text-[12.5px] text-ink-muted">
        <Link href="/social-media" className="hover:text-brand">Social Media Reports</Link>
        <ChevronRight size={13} />
        <span className="text-ink-secondary">{report.ref}</span>
      </div>

      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[20px] font-bold tracking-tight text-ink">{report.ref}</h1>
            <SocialMediaStatusBadge status={report.status} />
          </div>
          <p className="mt-1.5 max-w-2xl text-[15px] font-medium text-ink-secondary">{report.violationType} on {report.platform}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
        {[
          { label: "Platform", value: report.platform },
          { label: "Violation type", value: report.violationType },
          { label: "Reported by", value: report.reportedBy },
          { label: "Reported", value: formatDate(report.reportedAt) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
            <p className="mt-1.5 truncate text-[13px] font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Report details" />
            <div className="space-y-3 text-[13.5px]">
              <div>
                <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Content URL</p>
                <a href={report.contentUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-brand hover:underline break-all">
                  {report.contentUrl} <ExternalLink size={13} />
                </a>
              </div>
              {linkedIncident && (
                <div>
                  <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Linked cyber incident</p>
                  <Link href={"/incidents/" + linkedIncident.id} className="text-brand hover:underline">
                    {linkedIncident.id} — {linkedIncident.title}
                  </Link>
                </div>
              )}
              <div>
                <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Description</p>
                <p className="whitespace-pre-line text-ink-secondary leading-relaxed">{report.description}</p>
              </div>
              {report.platformRef && (
                <div>
                  <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Platform reference</p>
                  <p className="font-mono text-[13px] text-ink">{report.platformRef}</p>
                </div>
              )}
              {report.outcomeNote && (
                <div>
                  <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">Outcome / platform response</p>
                  <p className="whitespace-pre-line text-ink-secondary">{report.outcomeNote}</p>
                </div>
              )}
            </div>
            {platformUrl && (
              <div className="mt-4 rounded-lg bg-[var(--page)] px-4 py-3 text-[13px] text-ink-secondary">
                <span className="font-semibold">Platform takedown portal: </span>
                <a href={platformUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand hover:underline">
                  Report directly to {report.platform} <ExternalLink size={12} />
                </a>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Evidence" subtitle={report.evidence.length + " item(s)"} />
            <ul className="divide-y divide-[var(--border)]">
              {report.evidence.map((ev) => (
                <li key={ev.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Paperclip size={15} className="shrink-0 text-ink-muted" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink">{ev.filename}</p>
                      <p className="text-[11.5px] text-ink-muted">{ev.kind} - {ev.sizeLabel} - {relativeTime(ev.uploadedAt, now)}</p>
                    </div>
                  </div>
                  <a href={"/api/evidence/" + encodeURIComponent(ev.id)} className="shrink-0 rounded-lg p-2 text-ink-muted hover:bg-black/5 hover:text-brand">
                    <Download size={15} />
                  </a>
                </li>
              ))}
              {report.evidence.length === 0 && <li className="py-4 text-[13px] text-ink-muted">No evidence uploaded with this report.</li>}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <ol className="relative space-y-5 border-l border-[var(--gridline)] pl-5">
              {timeline.map((evt) => (
                <li key={evt.id} className="relative">
                  <span className="absolute -left-[26px] top-0.5 h-3 w-3 rounded-full bg-[#2a78d6] ring-4 ring-[var(--surface)]" />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-[13.5px] font-semibold text-ink">{evt.action}</p>
                    <p className="text-[11.5px] text-ink-muted">{formatDateTime(evt.timestamp)}</p>
                  </div>
                  {evt.note && <p className="mt-0.5 text-[12.5px] text-ink-secondary">{evt.note}</p>}
                  <p className="mt-0.5 text-[11.5px] text-ink-muted">by {evt.actor}</p>
                </li>
              ))}
            </ol>
            <AddSocialNoteForm reportId={report.id} />
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Update status" />
            <SocialStatusSelect reportId={report.id} current={report.status} />
          </Card>

          <Card>
            <CardHeader title="Assign officer" subtitle={"Currently: " + (report.assignedOfficer ?? "Unassigned")} />
            <AssignOfficerForm reportId={report.id} officers={officers} />
          </Card>

          <Card>
            <CardHeader title="Record platform reference" subtitle="Enter the reference number received from the platform after submitting the report" />
            <PlatformRefForm reportId={report.id} />
          </Card>

          <Card>
            <CardHeader title="Case summary" />
            <dl className="space-y-3 text-[13px]">
              {[
                { label: "Reference", value: report.ref },
                { label: "Assigned officer", value: report.assignedOfficer ?? "—" },
                { label: "Platform ref", value: report.platformRef ?? "—" },
                { label: "Submitted to platform", value: report.submittedAt ? formatDateTime(report.submittedAt) : "—" },
                { label: "Closed", value: report.closedAt ? formatDateTime(report.closedAt) : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                  <dt className="shrink-0 text-ink-muted">{label}</dt>
                  <dd className="text-right font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="bg-[#2a78d6]/5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand" />
              <p className="text-[12.5px] text-ink-secondary">
                All actions on this report are logged to the{" "}
                <Link href={"/audit-logs?target=" + report.ref} className="font-semibold text-brand hover:underline">
                  audit trail
                </Link>.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}