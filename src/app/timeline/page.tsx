import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { getDemoDb as getDb } from "@/lib/demo-db";
import { formatDate, formatTime } from "@/lib/format";
import { clsx } from "@/lib/clsx";

const TIMELINE_DOT: Record<string, string> = {
  status: "bg-[#2a78d6]",
  assignment: "bg-[#4a3aa7]",
  action: "bg-[#1baf7a]",
  escalation: "bg-[#d03b3b]",
  note: "bg-[#eda100]",
  system: "bg-slate-400",
};

export default async function TimelinePage() {
  const { incidents } = await getDb();
  const events = incidents.flatMap((inc) =>
    inc.timeline.map((evt) => ({ ...evt, incidentId: inc.id, incidentTitle: inc.title }))
  ).sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 150);

  const grouped = new Map<string, typeof events>();
  for (const e of events) {
    const key = formatDate(e.timestamp);
    grouped.set(key, [...(grouped.get(key) ?? []), e]);
  }

  return (
    <div>
      <PageHeader title="Incident Timeline" subtitle="Consolidated activity feed across every incident, most recent first (latest 150 events)" />
      {events.length === 0 && (
        <Card className="py-12 text-center text-sm text-ink-muted">No activity recorded yet.</Card>
      )}
      <div className="space-y-6">
        {[...grouped.entries()].map(([date, items]) => (
          <div key={date}>
            <p className="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-ink-muted">{date}</p>
            <Card padded={false}>
              <ol className="divide-y divide-[var(--border)]">
                {items.map((evt) => (
                  <li key={`${evt.incidentId}-${evt.id}`} className="flex items-start gap-3 px-4 py-3">
                    <span className={clsx("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", TIMELINE_DOT[evt.kind])} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <p className="text-[13px] font-semibold text-ink">{evt.title}</p>
                        <p className="text-[11px] text-ink-muted">{formatTime(evt.timestamp)}</p>
                      </div>
                      {evt.description && <p className="mt-0.5 text-[12px] text-ink-secondary">{evt.description}</p>}
                      <p className="mt-0.5 truncate text-[12px] text-ink-muted">
                        <Link href={`/incidents/${evt.incidentId}`} className="font-semibold text-brand hover:underline">{evt.incidentId}</Link>
                        {" · "}{evt.incidentTitle} · by {evt.actor}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
