import Link from "next/link";
import { Download, Lock, ScrollText, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/badge";
import { getDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import type { AuditLogEntry } from "@/lib/types";
import { clsx } from "@/lib/clsx";

const CATEGORY_TONE: Record<AuditLogEntry["category"], "brand" | "warning" | "good" | "neutral" | "critical"> = {
  Incident: "brand",
  User: "warning",
  System: "neutral",
  Report: "good",
  Evidence: "critical",
};
const CATEGORIES = Object.keys(CATEGORY_TONE) as AuditLogEntry["category"][];
const LIMIT = 200;

export default async function AuditLogsPage({ searchParams }: PageProps<"/audit-logs">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined);
  const actor = one(sp.actor);
  const target = one(sp.target);
  const category = one(sp.category) as AuditLogEntry["category"] | undefined;

  const { auditLogs } = await getDb();
  const filtered = auditLogs
    .filter((l) => (!actor || l.actor === actor) && (!target || l.target === target) && (!category || l.category === category))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const logs = filtered.slice(0, LIMIT);

  const qs = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { actor, target, category, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/audit-logs?${s}` : "/audit-logs";
  };
  const filterLabel = [actor && `actor: ${actor}`, target && `target: ${target}`, category && `category: ${category}`].filter(Boolean).join(" · ");

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle={`${auditLogs.length} recorded events — immutable, tamper-evident audit trail`}
        actions={
          <a href="/api/export?type=audit" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-ink-secondary hover:bg-black/5">
            <Download size={15} /> Export CSV
          </a>
        }
      />

      <Card className="mb-4 flex items-start gap-2.5 bg-[#2a78d6]/5">
        <Lock size={17} className="mt-0.5 shrink-0 text-brand" />
        <p className="text-[12.5px] text-ink-secondary">
          Audit entries cannot be edited or deleted by any user, including administrators. Every incident change, evidence access, report export and user management action is recorded here.
        </p>
      </Card>

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] px-5 py-4">
          <ScrollText size={16} className="text-ink-muted" />
          <h3 className="mr-2 text-[15px] font-semibold text-ink">Event log</h3>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={qs({ category: category === c ? undefined : c })}
              className={clsx(
                "rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset transition",
                category === c ? "bg-brand text-white ring-brand" : "text-ink-secondary ring-[var(--border)] hover:bg-black/5"
              )}
            >
              {c}
            </Link>
          ))}
          {filterLabel && (
            <Link href="/audit-logs" className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-ink-muted hover:text-ink">
              <X size={13} /> Clear filters ({filterLabel})
            </Link>
          )}
        </div>
        <div className="scroll-thin max-h-[720px] overflow-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="sticky top-0 bg-[var(--surface)]">
              <tr className="border-b border-[var(--border)] text-[11.5px] uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-2.5 font-semibold">Timestamp</th>
                <th className="px-3 py-2.5 font-semibold">Actor</th>
                <th className="px-3 py-2.5 font-semibold">Action</th>
                <th className="px-3 py-2.5 font-semibold">Target</th>
                <th className="px-3 py-2.5 font-semibold">Category</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--page)]">
                  <td className="whitespace-nowrap px-5 py-2.5 text-[12px] text-ink-muted">{formatDateTime(log.timestamp)}</td>
                  <td className="px-3 py-2.5 text-[12.5px] font-medium text-ink-secondary">
                    <Link href={qs({ actor: log.actor })} className="hover:text-brand hover:underline">{log.actor}</Link>
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px] text-ink" title={log.details}>
                    {log.action}
                    {log.details && log.details !== `${log.action} on ${log.target}` && (
                      <span className="block max-w-[420px] truncate text-[11.5px] text-ink-muted">{log.details}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-ink-muted">
                    {/^INC-\d{4}-\d+$/.test(log.target) ? (
                      <Link href={`/incidents/${log.target}`} className="font-semibold text-brand hover:underline">{log.target}</Link>
                    ) : (
                      log.target
                    )}
                  </td>
                  <td className="px-3 py-2.5"><Pill tone={CATEGORY_TONE[log.category]}>{log.category}</Pill></td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-[13px] text-ink-muted">No audit events match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[var(--border)] px-5 py-3 text-[12.5px] text-ink-muted">
          Showing {logs.length} of {filtered.length} matching events{filtered.length > LIMIT && " — export CSV for the full log"}
        </div>
      </Card>
    </div>
  );
}
