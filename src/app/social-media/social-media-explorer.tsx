"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SOCIAL_PLATFORMS, SOCIAL_VIOLATION_TYPES, SOCIAL_STATUSES } from "@/lib/reference-data";
import { SOCIAL_OPEN_STATUSES, type SocialMediaReport } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { clsx } from "@/lib/clsx";

const STATUS_PILL: Record<string, string> = {
  "Received":              "bg-[#2a78d6]/10 text-[#1c4ed8] ring-[#2a78d6]/25",
  "Under Review":          "bg-[#eda100]/15 text-[#8a5a00] ring-[#eda100]/25",
  "Verified":              "bg-[#4a3aa7]/10 text-[#4a3aa7] ring-[#4a3aa7]/25",
  "Submitted to Platform": "bg-[#ec835a]/15 text-[#b5501f] ring-[#ec835a]/25",
  "Platform Actioned":     "bg-[#0ca30c]/10 text-[#006300] ring-[#0ca30c]/25",
  "Platform Rejected":     "bg-[#d03b3b]/10 text-[#a92727] ring-[#d03b3b]/25",
  "Escalated":             "bg-[#d03b3b]/10 text-[#a92727] ring-[#d03b3b]/25",
  "Closed":                "bg-slate-500/10 text-slate-600 ring-slate-400/25",
  "No Action Required":    "bg-slate-500/10 text-slate-500 ring-slate-400/25",
};

export function SocialMediaStatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset", STATUS_PILL[status] ?? "bg-slate-100 text-slate-600 ring-slate-300")}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

const PAGE = 25;

export function SocialMediaExplorer({ reports }: { reports: SocialMediaReport[] }) {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("all");
  const [status, setStatus] = useState("all");
  const [violation, setViolation] = useState("all");
  const [visible, setVisible] = useState(PAGE);

  const filtered = useMemo(() => {
    let list = reports;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => [r.ref, r.platform, r.violationType, r.description, r.reportedBy, r.contentUrl].join(" ").toLowerCase().includes(q));
    if (platform !== "all") list = list.filter((r) => r.platform === platform);
    if (status !== "all") {
      if (status === "open") list = list.filter((r) => SOCIAL_OPEN_STATUSES.includes(r.status));
      else list = list.filter((r) => r.status === status);
    }
    if (violation !== "all") list = list.filter((r) => r.violationType === violation);
    return list;
  }, [reports, search, platform, status, violation]);

  const hasFilters = search || platform !== "all" || status !== "all" || violation !== "all";

  return (
    <div>
      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2">
            <Search size={15} className="text-ink-muted" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setVisible(PAGE); }}
              placeholder="Search reports…" className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal size={14} className="text-ink-muted" />
            <select value={platform} onChange={(e) => { setPlatform(e.target.value); setVisible(PAGE); }}
              className="rounded-lg border border-[var(--border)] bg-[var(--page)] px-2.5 py-2 text-[12.5px] text-ink-secondary focus:outline-none">
              <option value="all">All platforms</option>
              {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={violation} onChange={(e) => { setViolation(e.target.value); setVisible(PAGE); }}
              className="rounded-lg border border-[var(--border)] bg-[var(--page)] px-2.5 py-2 text-[12.5px] text-ink-secondary focus:outline-none">
              <option value="all">All violations</option>
              {SOCIAL_VIOLATION_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setVisible(PAGE); }}
              className="rounded-lg border border-[var(--border)] bg-[var(--page)] px-2.5 py-2 text-[12.5px] text-ink-secondary focus:outline-none">
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              {SOCIAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {hasFilters && (
              <button type="button" onClick={() => { setSearch(""); setPlatform("all"); setStatus("all"); setViolation("all"); setVisible(PAGE); }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-[12.5px] font-semibold text-ink-muted hover:text-ink">
                <X size={13} /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11.5px] uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-2.5 font-semibold">Report</th>
                <th className="px-3 py-2.5 font-semibold">Platform</th>
                <th className="px-3 py-2.5 font-semibold">Violation</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold">Reported by</th>
                <th className="px-3 py-2.5 font-semibold">Assigned officer</th>
                <th className="px-5 py-2.5 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, visible).map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--page)]">
                  <td className="px-5 py-3">
                    <Link href={`/social-media/${r.id}`} className="block max-w-[260px]">
                      <span className="block text-[12.5px] font-semibold text-brand">{r.ref}</span>
                      <span className="block truncate text-[12.5px] text-ink-secondary">{r.violationType}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-[13px] text-ink-secondary">{r.platform}</td>
                  <td className="px-3 py-3 text-[12.5px] text-ink-secondary">{r.violationType}</td>
                  <td className="px-3 py-3"><SocialMediaStatusBadge status={r.status} /></td>
                  <td className="px-3 py-3 text-[13px] text-ink-secondary">{r.reportedBy}</td>
                  <td className="px-3 py-3 text-[13px] text-ink-secondary">{r.assignedOfficer ?? <span className="italic text-ink-muted">Unassigned</span>}</td>
                  <td className="px-5 py-3 text-[12.5px] text-ink-muted">{formatDate(r.reportedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="px-5 py-14 text-center text-sm text-ink-muted">No social media reports match your filters.</div>}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 text-[12.5px] text-ink-muted">
          <span>Showing {Math.min(visible, filtered.length)} of {filtered.length}</span>
          {visible < filtered.length && (
            <button type="button" onClick={() => setVisible((v) => v + PAGE)} className="font-semibold text-brand hover:text-brand-dark">Load more</button>
          )}
        </div>
      </Card>
    </div>
  );
}
