import { AGENCIES } from "./reference-data";
import { CLOSED_STATUSES, OPEN_STATUSES, type AppUser, type Incident, type Severity } from "./types";
import { SEVERITY_COLORS } from "./style-maps";

export function isOpen(inc: Incident) {
  return OPEN_STATUSES.includes(inc.status);
}
export function isClosed(inc: Incident) {
  return CLOSED_STATUSES.includes(inc.status);
}
export function isSlaBreached(inc: Incident, now: Date) {
  return isOpen(inc) && new Date(inc.slaDueAt) < now;
}

/** An incident is "mine" if I'm assigned, reported it, or have acted / commented on it. */
export function isMine(inc: Incident, user: Pick<AppUser, "name">) {
  return (
    inc.assignedTo === user.name ||
    inc.reportedBy === user.name ||
    inc.timeline.some((e) => e.actor === user.name) ||
    inc.comments.some((c) => c.author === user.name)
  );
}

export function dashboardKpis(incidents: Incident[], now: Date) {
  const closed = incidents.filter(isClosed);
  const open = incidents.filter(isOpen);
  const slaBreaches = incidents.filter((i) => isSlaBreached(i, now)).length;

  const resolutionHours = closed.map((i) => {
    const last = i.timeline[i.timeline.length - 1];
    return last ? (new Date(last.timestamp).getTime() - new Date(i.reportedAt).getTime()) / 3600000 : 0;
  });
  const responseHours = incidents
    .filter((i) => i.assignedAt)
    .map((i) => (new Date(i.assignedAt!).getTime() - new Date(i.reportedAt).getTime()) / 3600000);
  const avg = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / (xs.length || 1);

  const thisMonth = incidents.filter((i) => {
    const d = new Date(i.reportedAt);
    return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
  }).length;

  return {
    total: incidents.length,
    open: open.length,
    critical: incidents.filter((i) => i.severity === "Critical").length,
    high: incidents.filter((i) => i.severity === "High").length,
    thisMonth,
    resolved: closed.length,
    slaBreaches,
    slaCompliance: Math.round(((open.length - slaBreaches) / (open.length || 1)) * 100),
    avgResolution: avg(resolutionHours),
    avgResponse: avg(responseHours),
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Incident counts for the six calendar months ending with the current month. */
export function monthlyTrend(incidents: Incident[], now: Date) {
  const buckets = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - idx), 1));
    return { year: d.getUTCFullYear(), month: d.getUTCMonth(), label: MONTHS[d.getUTCMonth()] };
  });
  return buckets.map((b) => ({
    label: b.label,
    value: incidents.filter((i) => {
      const d = new Date(i.reportedAt);
      return d.getUTCFullYear() === b.year && d.getUTCMonth() === b.month;
    }).length,
  }));
}

export function trendRangeLabel(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  return `${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()} – ${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
}

export function bySeverity(incidents: Incident[]) {
  const order: Severity[] = ["Critical", "High", "Medium", "Low", "Informational"];
  return order.map((sev) => ({
    label: sev,
    value: incidents.filter((i) => i.severity === sev).length,
    color: SEVERITY_COLORS[sev],
  }));
}

function countBy(incidents: Incident[], key: (i: Incident) => string[]) {
  const counts = new Map<string, number>();
  for (const i of incidents) for (const k of key(i)) counts.set(k, (counts.get(k) ?? 0) + 1);
  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function byCategory(incidents: Incident[]) {
  return countBy(incidents, (i) => [i.category]);
}

export function byStatus(incidents: Incident[]) {
  return countBy(incidents, (i) => [i.status]);
}

export function topAffectedSystems(incidents: Incident[]) {
  return countBy(incidents, (i) => i.affectedSystems).slice(0, 6);
}

export function byAgency(incidents: Incident[], now: Date) {
  return AGENCIES.map((a) => {
    const list = incidents.filter((i) => i.agencyId === a.id);
    return {
      agency: a,
      total: list.length,
      open: list.filter(isOpen).length,
      critical: list.filter((i) => i.severity === "Critical").length,
      slaBreaches: list.filter((i) => isSlaBreached(i, now)).length,
    };
  }).sort((a, b) => b.total - a.total);
}

export function analystWorkload(incidents: Incident[], users: AppUser[]) {
  return users
    .filter((u) => u.role === "Security Analyst" && u.active)
    .map((a) => ({ label: a.name, value: incidents.filter((i) => i.assignedTo === a.name && isOpen(i)).length }))
    .sort((a, b) => b.value - a.value);
}


// ---------------------------------------------------------------------------
// Extended KPIs (Section 9 of the Process Document)
// ---------------------------------------------------------------------------

/** Mean time from report created to first triage action (analyst touches the ticket). */
export function meanTimeToTriage(incidents: Incident[]): number {
  const times = incidents
    .map((i) => {
      const triageEvt = i.timeline.find((e) => e.kind === "status" && (e.title.includes("Triage") || e.title.includes("Assigned")));
      if (!triageEvt) return null;
      return (new Date(triageEvt.timestamp).getTime() - new Date(i.reportedAt).getTime()) / 3600000;
    })
    .filter((v): v is number => v !== null);
  return times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
}

/** Mean time from report to assignment (first assignment event). */
export function meanTimeToAssign(incidents: Incident[]): number {
  const times = incidents
    .filter((i) => i.assignedAt)
    .map((i) => (new Date(i.assignedAt!).getTime() - new Date(i.reportedAt).getTime()) / 3600000);
  return times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
}

/** Mean time from report to containment (containedAt field). */
export function meanTimeToContain(incidents: Incident[]): number {
  const times = incidents
    .filter((i) => i.containedAt)
    .map((i) => (new Date(i.containedAt!).getTime() - new Date(i.reportedAt).getTime()) / 3600000);
  return times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
}

/** Mean time from report to full resolution/closure. */
export function meanTimeToResolve(incidents: Incident[]): number {
  const closed = incidents.filter(isClosed);
  const times = closed.map((i) => {
    const last = i.timeline[i.timeline.length - 1];
    return last ? (new Date(last.timestamp).getTime() - new Date(i.reportedAt).getTime()) / 3600000 : 0;
  });
  return times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
}

/** Percentage of incidents that were escalated at least once. */
export function escalationRate(incidents: Incident[]): number {
  const escalated = incidents.filter((i) => i.timeline.some((e) => e.kind === "escalation")).length;
  return incidents.length ? Math.round((escalated / incidents.length) * 100) : 0;
}

/** Percentage of closed incidents with both rootCause and lessonsLearned recorded. */
export function closureCompletenessRate(incidents: Incident[]): number {
  const closed = incidents.filter(isClosed);
  if (!closed.length) return 0;
  const complete = closed.filter((i) => i.rootCause && i.lessonsLearned).length;
  return Math.round((complete / closed.length) * 100);
}

/** Incidents repeated for the same agency + category within 90 days. */
export function repeatIncidentCount(incidents: Incident[]): number {
  let count = 0;
  for (const inc of incidents) {
    const reported = new Date(inc.reportedAt).getTime();
    const repeat = incidents.some(
      (other) =>
        other.id !== inc.id &&
        other.agencyId === inc.agencyId &&
        other.category === inc.category &&
        Math.abs(new Date(other.reportedAt).getTime() - reported) <= 90 * 86400000
    );
    if (repeat) count++;
  }
  return Math.round(count / 2); // each pair counted twice
}

// ---------------------------------------------------------------------------
// Social media analytics (Stage 3F)
// ---------------------------------------------------------------------------

import type { SocialMediaReport } from "./types";
import { SOCIAL_PLATFORMS, SOCIAL_VIOLATION_TYPES } from "./reference-data";

export function socialKpis(reports: SocialMediaReport[]) {
  const open = reports.filter((r) => !["Closed", "No Action Required", "Action Taken / Content Removed", "No Violation Found"].includes(r.status));
  const actioned = reports.filter((r) => r.status === "Action Taken / Content Removed");
  const escalated = reports.filter((r) => r.status === "Escalated");
  const submittedToMeta = reports.filter((r) => r.submittedAt);
  const pctActioned = submittedToMeta.length ? Math.round((actioned.length / submittedToMeta.length) * 100) : 0;
  return {
    total: reports.length,
    open: open.length,
    actioned: actioned.length,
    escalated: escalated.length,
    submittedToMeta: submittedToMeta.length,
    pctActioned,
  };
}

export function socialByPlatform(reports: SocialMediaReport[]) {
  return SOCIAL_PLATFORMS.map((p) => ({
    label: p,
    value: reports.filter((r) => r.platform === p).length,
  })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
}

export function socialByViolation(reports: SocialMediaReport[]) {
  return SOCIAL_VIOLATION_TYPES.map((v) => ({
    label: v,
    value: reports.filter((r) => r.violationType === v).length,
  })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
}

export function socialByStatus(reports: SocialMediaReport[]) {
  const counts = new Map<string, number>();
  for (const r of reports) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
  return [...counts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function socialMonthlyTrend(reports: SocialMediaReport[], now: Date) {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - idx), 1));
    return {
      label: MONTHS[d.getUTCMonth()],
      value: reports.filter((r) => {
        const rd = new Date(r.reportedAt);
        return rd.getUTCFullYear() === d.getUTCFullYear() && rd.getUTCMonth() === d.getUTCMonth();
      }).length,
    };
  });
}