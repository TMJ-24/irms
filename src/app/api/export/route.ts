import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { addAudit, mutate, nextId } from "@/lib/db";
import { agencyById } from "@/lib/reference-data";
import { getCurrentUser } from "@/lib/auth";
import { analystWorkload, byAgency, byCategory, dashboardKpis, isMine, isOpen, isSlaBreached } from "@/lib/stats";
import type { GeneratedReport, Incident } from "@/lib/types";

type Row = (string | number | boolean | undefined)[];

function csv(rows: Row[]) {
  return rows
    .map((r) => r.map((v) => {
      const s = v === undefined ? "" : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(","))
    .join("\r\n");
}

function incidentRows(list: Incident[], now: Date): Row[] {
  return [
    ["ID", "Title", "Agency", "Category", "Severity", "Status", "Assigned To", "Reported By", "Reported At", "SLA Due", "SLA Breached", "Major Incident"],
    ...list.map((i) => [
      i.id, i.title, agencyById(i.agencyId)?.shortName, i.category, i.severity, i.status, i.assignedTo ?? "Unassigned",
      i.reportedBy, i.reportedAt, i.slaDueAt, isSlaBreached(i, now), i.isMajorIncident,
    ]),
  ];
}

const REPORTS: Record<GeneratedReport["exportType"], { name: string; level: GeneratedReport["level"] }> = {
  incidents: { name: "Incident Register Export", level: "Operational" },
  operational: { name: "Operational Caseload Report", level: "Operational" },
  management: { name: "Management Division Performance Report", level: "Management" },
  executive: { name: "Executive Government-wide Risk Summary", level: "Executive" },
  audit: { name: "Audit Log Export", level: "Audit" },
};

export async function GET(request: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });
  const type = (request.nextUrl.searchParams.get("type") ?? "incidents") as GeneratedReport["exportType"];
  if (!Object.hasOwn(REPORTS, type)) return new Response("Unknown export type", { status: 400 });
  const def = REPORTS[type];

  const now = new Date();
  const body = mutate((db) => {
    let rows: Row[];
    const kpis = dashboardKpis(db.incidents, now);
    switch (type) {
      case "operational":
        rows = incidentRows(db.incidents.filter((i) => isMine(i, me) && isOpen(i)), now);
        break;
      case "management":
        rows = [
          ["Metric", "Value"],
          ["Total incidents", kpis.total], ["Open incidents", kpis.open], ["Resolved / closed", kpis.resolved],
          ["SLA breaches (open)", kpis.slaBreaches], ["SLA compliance %", kpis.slaCompliance],
          ["Avg response (h)", kpis.avgResponse.toFixed(1)], ["Avg resolution (h)", kpis.avgResolution.toFixed(1)],
          [],
          ["Agency", "Total", "Open", "Critical", "SLA Breaches"],
          ...byAgency(db.incidents, now).map((a) => [a.agency.shortName, a.total, a.open, a.critical, a.slaBreaches]),
          [],
          ["Analyst", "Open incidents"],
          ...analystWorkload(db.incidents, db.users).map((w) => [w.label, w.value]),
        ];
        break;
      case "executive":
        rows = [
          ["Metric", "Value"],
          ["Critical incidents", kpis.critical],
          ["Major incidents declared", db.incidents.filter((i) => i.isMajorIncident).length],
          ["Agencies affected", new Set(db.incidents.map((i) => i.agencyId)).size],
          ["SLA compliance %", kpis.slaCompliance],
          [],
          ["Category", "Incidents"],
          ...byCategory(db.incidents).map((c) => [c.label, c.value]),
          [],
          ["Major incidents"],
          ...incidentRows(db.incidents.filter((i) => i.isMajorIncident), now),
        ];
        break;
      case "audit":
        rows = [
          ["ID", "Timestamp", "Actor", "Action", "Target", "Category", "Details"],
          ...db.auditLogs.map((l) => [l.id, l.timestamp, l.actor, l.action, l.target, l.category, l.details]),
        ];
        break;
      default:
        rows = incidentRows(db.incidents, now);
    }

    const report: GeneratedReport = {
      id: nextId(db, "report", "RPT-"),
      name: def.name,
      level: def.level,
      generatedBy: me.name,
      generatedAt: now.toISOString(),
      format: "CSV",
      exportType: type,
    };
    db.reports.unshift(report);
    addAudit(db, { actor: me.name, action: type === "audit" ? "Exported audit log" : "Generated report", target: report.id, details: `${def.name} (CSV)`, category: "Report" });
    return csv(rows);
  });

  revalidatePath("/", "layout");
  const stamp = now.toISOString().slice(0, 10);
  return new Response("﻿" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="irms-${type}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
