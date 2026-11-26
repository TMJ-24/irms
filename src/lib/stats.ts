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
