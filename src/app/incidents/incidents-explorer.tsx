"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, Clock, AlertTriangle, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SeverityBadge, StatusBadge } from "@/components/ui/badge";
import { AGENCIES, CATEGORIES } from "@/lib/reference-data";
import { CLOSED_STATUSES, OPEN_STATUSES, type IncidentCategory, type IncidentStatus, type Severity } from "@/lib/types";
import { formatDate, slaRemaining } from "@/lib/format";
import { clsx } from "@/lib/clsx";

export interface IncidentRow {
  id: string;
  title: string;
  category: IncidentCategory;
  severity: Severity;
  status: IncidentStatus;
  agencyId: string;
  agencyName: string;
  assignedTo?: string;
  reportedAt: string;
  slaDueAt: string;
  isMine: boolean;
  searchText: string;
}

const TABS = [
  { key: "all", label: "All Incidents", href: "/incidents" },
  { key: "mine", label: "My Incidents", href: "/incidents?view=mine" },
  { key: "critical", label: "Critical", href: "/incidents?severity=Critical" },
  { key: "open", label: "Open", href: "/incidents?status=open" },
  { key: "closed", label: "Closed", href: "/incidents?status=closed" },
];

const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low", "Informational"];
const PAGE = 25;

export function IncidentsExplorer({ rows, nowIso }: { rows: IncidentRow[]; nowIso: string }) {
  const params = useSearchParams();
  const view = params.get("view");
  const severityParam = params.get("severity");
  const statusParam = params.get("status");
  const agencyParam = params.get("agency");
  const qParam = params.get("q") ?? "";
  const now = useMemo(() => new Date(nowIso), [nowIso]);

  const activeTab = view === "mine" ? "mine" : severityParam === "Critical" ? "critical" : statusParam === "open" ? "open" : statusParam === "closed" ? "closed" : "all";

  // Re-initialise local filters whenever the URL (tab / global search) changes.
  const urlKey = params.toString();
  const [trackedKey, setTrackedKey] = useState(urlKey);
  const [search, setSearch] = useState(qParam);
  const [category, setCategory] = useState("all");
  const [agency, setAgency] = useState(agencyParam ?? "all");
  const [severity, setSeverity] = useState("all");
  const [visible, setVisible] = useState(PAGE);
  if (urlKey !== trackedKey) {
    setTrackedKey(urlKey);
    setSearch(qParam);
    setAgency(agencyParam ?? "all");
    setVisible(PAGE);
  }

  const filtered = useMemo(() => {
    let list = rows;
    if (view === "mine") list = list.filter((i) => i.isMine);
    if (severityParam) list = list.filter((i) => i.severity === severityParam);
    if (statusParam === "open") list = list.filter((i) => OPEN_STATUSES.includes(i.status));
    if (statusParam === "closed") list = list.filter((i) => CLOSED_STATUSES.includes(i.status));

    const q = search.trim().toLowerCase();
    if (q) list = list.filter((i) => q.split(/\s+/).every((term) => i.searchText.includes(term)));
    if (category !== "all") list = list.filter((i) => i.category === category);
    if (agency !== "all") list = list.filter((i) => i.agencyId === agency);
    if (severity !== "all") list = list.filter((i) => i.severity === severity);
    return list;
  }, [rows, view, severityParam, statusParam, search, category, agency, severity]);

  const hasLocalFilters = search || category !== "all" || agency !== "all" || severity !== "all";

  function update<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setVisible(PAGE);
    };
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-[var(--border)] pb-3">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={clsx(
              "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition",
              activeTab === t.key ? "bg-brand text-white" : "bg-[var(--surface)] text-ink-secondary ring-1 ring-inset ring-[var(--border)] hover:bg-black/5"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2">
            <Search size={15} className="text-ink-muted" />
            <input
              value={search}
              onChange={(e) => update(setSearch)(e.target.value)}
              placeholder="Search by ID, title, agency, system, person…"
              aria-label="Search incidents"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal size={14} className="text-ink-muted" />
            <select aria-label="Category" value={category} onChange={(e) => update(setCategory)(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--page)] px-2.5 py-2 text-[12.5px] text-ink-secondary focus:outline-none">
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select aria-label="Agency" value={agency} onChange={(e) => update(setAgency)(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--page)] px-2.5 py-2 text-[12.5px] text-ink-secondary focus:outline-none">
              <option value="all">All agencies</option>
              {AGENCIES.map((a) => <option key={a.id} value={a.id}>{a.shortName}</option>)}
            </select>
            <select aria-label="Severity" value={severity} onChange={(e) => update(setSeverity)(e.target.value)} className="rounded-lg border border-[var(--border)] bg-[var(--page)] px-2.5 py-2 text-[12.5px] text-ink-secondary focus:outline-none">
              <option value="all">All severities</option>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {hasLocalFilters && (
              <button
                type="button"
                onClick={() => { setSearch(""); setCategory("all"); setAgency("all"); setSeverity("all"); setVisible(PAGE); }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-[12.5px] font-semibold text-ink-muted hover:text-ink"
              >
                <X size={13} /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11.5px] uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-2.5 font-semibold">Incident</th>
                <th className="px-3 py-2.5 font-semibold">Agency</th>
                <th className="px-3 py-2.5 font-semibold">Category</th>
                <th className="px-3 py-2.5 font-semibold">Severity</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold">Assigned to</th>
                <th className="px-3 py-2.5 font-semibold">Reported</th>
                <th className="px-5 py-2.5 font-semibold">SLA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, visible).map((inc) => {
                const sla = slaRemaining(inc.slaDueAt, now);
                const open = OPEN_STATUSES.includes(inc.status);
                return (
                  <tr key={inc.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--page)]">
                    <td className="px-5 py-3">
                      <Link href={`/incidents/${inc.id}`} className="block max-w-[260px]">
                        <span className="block text-[12.5px] font-semibold text-brand">{inc.id}</span>
                        <span className="block truncate text-[13px] text-ink">{inc.title}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-[13px] text-ink-secondary">
                      <Link href={`/agencies/${inc.agencyId}`} className="hover:text-brand hover:underline">{inc.agencyName}</Link>
                    </td>
                    <td className="px-3 py-3 text-[12.5px] text-ink-secondary">{inc.category}</td>
                    <td className="px-3 py-3"><SeverityBadge severity={inc.severity} /></td>
                    <td className="px-3 py-3"><StatusBadge status={inc.status} /></td>
                    <td className="px-3 py-3 text-[13px] text-ink-secondary">{inc.assignedTo ?? <span className="italic text-ink-muted">Unassigned</span>}</td>
                    <td className="px-3 py-3 text-[12.5px] text-ink-muted">{formatDate(inc.reportedAt)}</td>
                    <td className="px-5 py-3">
                      {open ? (
                        <span className={clsx("inline-flex items-center gap-1 text-[12px] font-semibold", sla.breached ? "text-[#a92727]" : "text-ink-secondary")}>
                          {sla.breached ? <AlertTriangle size={13} /> : <Clock size={13} />}
                          {sla.breached ? `${sla.label} overdue` : `${sla.label} left`}
                        </span>
                      ) : (
                        <span className="text-[12px] text-ink-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-5 py-14 text-center text-sm text-ink-muted">No incidents match your filters.</div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 text-[12.5px] text-ink-muted">
          <span>Showing {Math.min(visible, filtered.length)} of {filtered.length} incidents</span>
          {visible < filtered.length && (
            <button type="button" onClick={() => setVisible((v) => v + PAGE)} className="font-semibold text-brand hover:text-brand-dark">
              Load more
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
