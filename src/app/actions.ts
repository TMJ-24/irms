"use server";

const DEMO_MODE = true;
function demoOk(extra?: Record<string, unknown>) { return { ok: true as const, ...extra }; }


import { revalidatePath } from "next/cache";
import { addAudit, addTimelineEvent, findIncident, mutate, nextId } from "@/lib/db";
import { canManageUsers, getCurrentUser, hashPassword, passwordProblem, revokeUserSessions, verifyPassword } from "@/lib/auth";
import { AGENCIES, CATEGORIES, IMPACT_AREAS, SLA_HOURS, SOURCES, initialsOf } from "@/lib/reference-data";
import {
  ALL_STATUSES,
  type EvidenceItem,
  type ImpactArea,
  type Incident,
  type IncidentCategory,
  type IncidentSource,
  type IncidentStatus,
  type IncidentTask,
  type Severity,
  type ThreatIntelItem,
  type UserRole,
} from "@/lib/types";

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low", "Informational"];
const ROLES: UserRole[] = ["Reporter", "Security Analyst", "Incident Manager", "Cyber Security Manager", "Social Media Officer", "Executive", "System Administrator", "Auditor"];
const SIGNED_OUT = { ok: false as const, error: "Your session has expired. Sign in again to continue." };
const FORBIDDEN = { ok: false as const, error: "Your role is not permitted to manage user accounts." };

function refreshAll() {
  // Every page reads from the shared store, so refresh the whole tree.
  revalidatePath("/", "layout");
}

const clean = (s: unknown, max = 2000) => (typeof s === "string" ? s.trim().slice(0, max) : "");

// Incident intake

export interface ReportIncidentInput {
  title: string;
  description: string;
  agencyId: string;
  source: IncidentSource;
  category: IncidentCategory;
  severity: Severity;
  impacts: ImpactArea[];
  systems: string[];
  reporterName: string;
  reporterEmail: string;
  location?: string;
  detectedAt?: string;
  isOngoing?: boolean;
  businessImpact?: string;
  classifiedDataInvolved?: boolean;
  reporterActionsTaken?: string;
  iocs?: string;
  files: { name: string; size: number; hash: string }[];
}

function evidenceKind(filename: string): EvidenceItem["kind"] {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(ext)) return "Screenshot";
  if (["log", "txt", "csv", "json", "evtx"].includes(ext)) return "Log File";
  if (["eml", "msg"].includes(ext)) return "Email Sample";
  if (["pcap", "pcapng", "cap"].includes(ext)) return "Network Capture";
  if (["exe", "dll", "bin", "zip", "7z"].includes(ext)) return "Malware Sample";
  return "Document";
}

function sizeLabel(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export async function reportIncident(input: ReportIncidentInput): Promise<ActionResult<{ id: string }>> {
  if (DEMO_MODE) { await getCurrentUser(); return { ok: true, id: "INC-2025-DEMO" }; }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  const title = clean(input.title, 200);
  const description = clean(input.description, 5000);
  const reporterName = clean(input.reporterName, 120);
  const reporterEmail = clean(input.reporterEmail, 200);

  if (!title) return { ok: false, error: "Incident title is required." };
  if (!description) return { ok: false, error: "Description is required." };
  if (!reporterName) return { ok: false, error: "Your name is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) return { ok: false, error: "A valid email address is required." };
  if (!AGENCIES.some((a) => a.id === input.agencyId)) return { ok: false, error: "Select a valid agency." };
  if (!CATEGORIES.includes(input.category)) return { ok: false, error: "Select a valid incident type." };
  if (!SEVERITIES.includes(input.severity)) return { ok: false, error: "Select a valid severity." };
  if (!SOURCES.includes(input.source)) return { ok: false, error: "Select a valid source." };

  const id = mutate((db) => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const incidentId = nextId(db, "incident", `INC-${year}-`, 3);
    const slaHours = SLA_HOURS[input.severity];

    const incident: Incident = {
      id: incidentId,
      title,
      description,
      category: input.category,
      severity: input.severity,
      impact: (input.impacts ?? []).filter((i) => IMPACT_AREAS.includes(i)),
      status: "Reported",
      agencyId: input.agencyId,
      source: input.source,
      reportedBy: reporterName,
      reporterEmail,
      reportedAt: now.toISOString(),
      slaHours,
      slaDueAt: new Date(now.getTime() + slaHours * 3600000).toISOString(),
      isMajorIncident: false,
      affectedSystems: (input.systems ?? []).map((s) => clean(s, 120)).filter(Boolean),
      location: clean(input.location, 120) || "Not specified",
      actionsTaken: [],
      timeline: [],
      evidence: (input.files ?? []).slice(0, 20).map((f, i) => ({
        id: `${incidentId}-ev-${i}`,
        filename: clean(f.name, 200),
        kind: evidenceKind(f.name),
        uploadedBy: reporterName,
        uploadedAt: now.toISOString(),
        sizeLabel: sizeLabel(Number(f.size) || 0),
        hash: /^[0-9a-f]{64}$/.test(f.hash) ? `sha256:${f.hash}` : "sha256:unavailable",
      })),
      comments: [],
    };

    db.incidents.unshift(incident);
    addTimelineEvent(db, incident, {
      kind: "system",
      actor: reporterName,
      title: "Incident reported",
      description: `Submitted via ${input.source.toLowerCase()} — ${input.severity} severity, ${slaHours}h response SLA.`,
    });
    for (const ev of incident.evidence) {
      addAudit(db, { actor: reporterName, action: "Uploaded evidence", target: incident.id, details: `${ev.filename} (${ev.sizeLabel}, ${ev.hash})`, category: "Evidence" });
    }
    if (input.severity === "Critical") {
      addTimelineEvent(db, incident, {
        kind: "escalation",
        actor: "System",
        title: "Escalated to Incident Manager",
        description: "Reported as Critical — Incident Manager automatically notified per escalation policy.",
      });
    }
    return incident.id;
  });

  refreshAll();
  return { ok: true, id };
}

// Incident workflow

export async function updateIncidentStatus(incidentId: string, status: IncidentStatus, note?: string): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  if (!ALL_STATUSES.includes(status)) return { ok: false, error: "Unknown status." };
  const res = mutate((db): ActionResult => {
    const inc = findIncident(db, incidentId);
    if (!inc) return { ok: false, error: "Incident not found." };
    if (inc.status === status) return { ok: false, error: `Incident is already ${status}.` };
    const from = inc.status;
    inc.status = status;
    const extra = clean(note, 1000);
    addTimelineEvent(db, inc, {
      kind: "status",
      actor: me.name,
      title: `Status changed to ${status}`,
      description: `${from} → ${status}${extra ? ` — ${extra}` : ""}`,
    });
    // Closing an incident closes its outstanding tasks.
    if (status === "Closed" || status === "Resolved" || status === "Rejected" || status === "Duplicate" || status === "False Positive") {
      for (const t of db.tasks) if (t.incidentId === inc.id && t.status !== "Done") t.status = "Done";
    }
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

export async function escalateIncident(incidentId: string, reason: string, raiseSeverity: boolean): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  const why = clean(reason, 1000);
  if (!why) return { ok: false, error: "Give a reason for the escalation." };
  const res = mutate((db): ActionResult => {
    const inc = findIncident(db, incidentId);
    if (!inc) return { ok: false, error: "Incident not found." };
    let description = why;
    if (raiseSeverity) {
      const idx = SEVERITIES.indexOf(inc.severity);
      if (idx > 0) {
        const next = SEVERITIES[idx - 1];
        description = `Severity raised ${inc.severity} → ${next}. ${why}`;
        inc.severity = next;
        inc.slaHours = SLA_HOURS[next];
        inc.slaDueAt = new Date(new Date(inc.reportedAt).getTime() + inc.slaHours * 3600000).toISOString();
      }
    }
    addTimelineEvent(db, inc, { kind: "escalation", actor: me.name, title: "Escalated to Incident Manager", description });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

export async function reassignIncident(incidentId: string, assignee: string): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  const res = mutate((db): ActionResult => {
    const inc = findIncident(db, incidentId);
    if (!inc) return { ok: false, error: "Incident not found." };
    const user = db.users.find((u) => u.name === assignee && u.active);
    if (!user) return { ok: false, error: "Select an active user." };
    if (inc.assignedTo === user.name) return { ok: false, error: `Already assigned to ${user.name}.` };
    const prev = inc.assignedTo;
    inc.assignedTo = user.name;
    inc.assignedAt ??= new Date().toISOString();
    if (inc.status === "Reported" || inc.status === "Triage") inc.status = "Assigned";
    for (const t of db.tasks) if (t.incidentId === inc.id && t.status !== "Done") t.assignee = user.name;
    addTimelineEvent(db, inc, {
      kind: "assignment",
      actor: me.name,
      title: `Assigned to ${user.name}`,
      description: prev ? `Reassigned from ${prev}.` : "Initial assignment.",
    });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

export async function addComment(incidentId: string, body: string): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  const text = clean(body, 2000);
  if (!text) return { ok: false, error: "Note cannot be empty." };
  const res = mutate((db): ActionResult => {
    const inc = findIncident(db, incidentId);
    if (!inc) return { ok: false, error: "Incident not found." };
    const now = new Date().toISOString();
    inc.comments.push({ id: nextId(db, "event", `${inc.id}-cm-live-`), author: me.name, timestamp: now, body: text });
    addTimelineEvent(db, inc, { kind: "note", actor: me.name, title: "Internal note added", description: text });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

export async function addResponseAction(incidentId: string, action: string): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  const text = clean(action, 300);
  if (!text) return { ok: false, error: "Describe the action taken." };
  const res = mutate((db): ActionResult => {
    const inc = findIncident(db, incidentId);
    if (!inc) return { ok: false, error: "Incident not found." };
    inc.actionsTaken.push(text);
    addTimelineEvent(db, inc, { kind: "action", actor: me.name, title: "Response action recorded", description: text });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

export async function recordFindings(incidentId: string, rootCause: string, lessonsLearned: string): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  const rc = clean(rootCause, 2000);
  const ll = clean(lessonsLearned, 2000);
  if (!rc && !ll) return { ok: false, error: "Enter a root cause or lessons learned." };
  const res = mutate((db): ActionResult => {
    const inc = findIncident(db, incidentId);
    if (!inc) return { ok: false, error: "Incident not found." };
    if (rc) inc.rootCause = rc;
    if (ll) inc.lessonsLearned = ll;
    addTimelineEvent(db, inc, { kind: "note", actor: me.name, title: "Root cause / lessons learned updated" });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

export async function declareMajorIncident(incidentId: string): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  const res = mutate((db): ActionResult => {
    const inc = findIncident(db, incidentId);
    if (!inc) return { ok: false, error: "Incident not found." };
    if (inc.isMajorIncident) return { ok: false, error: `${inc.id} is already a Major Cyber Incident.` };
    inc.isMajorIncident = true;
    addTimelineEvent(db, inc, {
      kind: "escalation",
      actor: me.name,
      title: "Declared Major Cyber Incident",
      description: "Incident Response Team activated and executive notification initiated.",
    });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

// Tasks

export async function updateTaskStatus(taskId: string, status: IncidentTask["status"]): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  if (!["Open", "In Progress", "Done"].includes(status)) return { ok: false, error: "Unknown task status." };
  const res = mutate((db): ActionResult => {
    const task = db.tasks.find((t) => t.id === taskId);
    if (!task) return { ok: false, error: "Task not found." };
    const from = task.status;
    task.status = status;
    addAudit(db, { actor: me.name, action: "Updated task status", target: task.incidentId, details: `${task.id} "${task.title}": ${from} → ${status}`, category: "Incident" });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

export async function createTask(incidentId: string, title: string, priority: IncidentTask["priority"], dueDate: string): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  const text = clean(title, 200);
  if (!text) return { ok: false, error: "Task title is required." };
  if (!["High", "Medium", "Low"].includes(priority)) return { ok: false, error: "Select a priority." };
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return { ok: false, error: "Select a valid due date." };
  const res = mutate((db): ActionResult => {
    const inc = findIncident(db, incidentId);
    if (!inc) return { ok: false, error: "Incident not found." };
    const task: IncidentTask = {
      id: nextId(db, "task", "TSK-"),
      incidentId: inc.id,
      title: text,
      assignee: inc.assignedTo ?? "Unassigned",
      dueDate: due.toISOString(),
      status: "Open",
      priority,
    };
    db.tasks.unshift(task);
    addTimelineEvent(db, inc, { kind: "action", actor: me.name, title: "Task created", description: `${task.id}: ${task.title}` });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

// Threat intelligence

export async function addThreatIntel(input: {
  title: string; type: ThreatIntelItem["type"]; severity: Severity; source: string;
  description: string; iocs: string; relatedCategory: IncidentCategory;
}): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  const title = clean(input.title, 200);
  const source = clean(input.source, 120);
  const description = clean(input.description, 3000);
  if (!title || !source || !description) return { ok: false, error: "Title, source and description are required." };
  if (!["Advisory", "IOC Feed", "Vulnerability", "Campaign", "Malware"].includes(input.type)) return { ok: false, error: "Select a type." };
  if (!SEVERITIES.includes(input.severity)) return { ok: false, error: "Select a severity." };
  if (!CATEGORIES.includes(input.relatedCategory)) return { ok: false, error: "Select a related category." };
  const iocs = clean(input.iocs, 3000).split(/[\n,]+/).map((x) => x.trim()).filter(Boolean).slice(0, 50);
  const res = mutate((db): ActionResult => {
    const id = nextId(db, "intel", `TI-${new Date().getUTCFullYear()}-`, 3);
    db.threatIntel.unshift({ id, title, type: input.type, severity: input.severity, publishedAt: new Date().toISOString(), source, description, iocs, relatedCategory: input.relatedCategory });
    addAudit(db, { actor: me.name, action: "Published threat intelligence", target: id, details: title, category: "System" });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

// Administration

export async function addUser(input: { name: string; email: string; role: UserRole; password: string }): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  if (!canManageUsers(me)) return FORBIDDEN;
  const name = clean(input.name, 120);
  const email = clean(input.email, 200).toLowerCase();
  if (!name) return { ok: false, error: "Name is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "A valid email is required." };
  if (!ROLES.includes(input.role)) return { ok: false, error: "Select a role." };
  const problem = passwordProblem(String(input.password ?? ""));
  if (problem) return { ok: false, error: `Temporary password: ${problem}` };
  const res = mutate((db): ActionResult => {
    if (db.users.some((u) => u.email.toLowerCase() === email)) return { ok: false, error: "A user with that email already exists." };
    if (db.users.some((u) => u.name.toLowerCase() === name.toLowerCase())) return { ok: false, error: "A user with that name already exists." };
    const id = nextId(db, "user", "u-", 3);
    db.users.push({ id, name, email, role: input.role, initials: initialsOf(name), active: true });
    db.credentials[id] = hashPassword(input.password);
    addAudit(db, { actor: me.name, action: "Created user account", target: email, details: `${name} — ${input.role}`, category: "User" });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

export async function setUserActive(userId: string, active: boolean): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  if (!canManageUsers(me)) return FORBIDDEN;
  if (userId === me.id && !active) return { ok: false, error: "You cannot disable your own account." };
  const res = mutate((db): ActionResult => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return { ok: false, error: "User not found." };
    user.active = active;
    if (!active) revokeUserSessions(db, user.id);
    addAudit(db, { actor: me.name, action: active ? "Re-enabled user account" : "Disabled user account", target: user.email, details: `${user.name} — ${user.role}`, category: "User" });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

export async function changeUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  if (!canManageUsers(me)) return FORBIDDEN;
  if (!ROLES.includes(role)) return { ok: false, error: "Select a role." };
  if (userId === me.id) return { ok: false, error: "You cannot change your own role." };
  const res = mutate((db): ActionResult => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return { ok: false, error: "User not found." };
    if (user.role === role) return { ok: true };
    const from = user.role;
    user.role = role;
    addAudit(db, { actor: me.name, action: "Updated user role", target: user.email, details: `${user.name}: ${from} → ${role}`, category: "User" });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

export async function resetUserPassword(userId: string, password: string): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  if (!canManageUsers(me)) return FORBIDDEN;
  const problem = passwordProblem(String(password ?? ""));
  if (problem) return { ok: false, error: problem };
  const res = mutate((db): ActionResult => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return { ok: false, error: "User not found." };
    db.credentials[user.id] = hashPassword(password);
    if (user.id !== me.id) revokeUserSessions(db, user.id);
    addAudit(db, { actor: me.name, action: "Reset user password", target: user.email, details: `${user.name} — existing sessions ended`, category: "User" });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

export async function changeOwnPassword(current: string, next: string, confirm: string): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  if (next !== confirm) return { ok: false, error: "New passwords do not match." };
  const problem = passwordProblem(String(next ?? ""));
  if (problem) return { ok: false, error: problem };
  const res = mutate((db): ActionResult => {
    if (!verifyPassword(String(current ?? ""), db.credentials[me.id])) return { ok: false, error: "Current password is incorrect." };
    db.credentials[me.id] = hashPassword(next);
    addAudit(db, { actor: me.name, action: "Changed own password", target: me.email, details: "Password updated", category: "User" });
    return { ok: true };
  });
  return res;
}


// Appendix A — advanced case record actions

export async function recordAdvancedFindings(
  incidentId: string,
  data: {
    ttpAssessment?: string;
    residualRisk?: string;
    rootCause?: string;
    lessonsLearned?: string;
  }
): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  const res = mutate((db): ActionResult => {
    const inc = findIncident(db, incidentId);
    if (!inc) return { ok: false, error: "Incident not found." };
    if (data.rootCause !== undefined) inc.rootCause = clean(data.rootCause, 2000) || undefined;
    if (data.lessonsLearned !== undefined) inc.lessonsLearned = clean(data.lessonsLearned, 2000) || undefined;
    if (data.ttpAssessment !== undefined) inc.ttpAssessment = clean(data.ttpAssessment, 2000) || undefined;
    if (data.residualRisk !== undefined) inc.residualRisk = clean(data.residualRisk, 1000) || undefined;
    addTimelineEvent(db, inc, { kind: "note", actor: me.name, title: "Advanced findings updated" });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

export async function addStakeholderNotification(incidentId: string, note: string): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  const text = clean(note, 500);
  if (!text) return { ok: false, error: "Notification note cannot be empty." };
  const res = mutate((db): ActionResult => {
    const inc = findIncident(db, incidentId);
    if (!inc) return { ok: false, error: "Incident not found." };
    inc.stakeholderNotifications = [...(inc.stakeholderNotifications ?? []), `${new Date().toISOString()} — ${me.name}: ${text}`];
    addTimelineEvent(db, inc, { kind: "action", actor: me.name, title: "Stakeholder notified", description: text });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

export async function markContained(incidentId: string): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  const res = mutate((db): ActionResult => {
    const inc = findIncident(db, incidentId);
    if (!inc) return { ok: false, error: "Incident not found." };
    if (inc.containedAt) return { ok: false, error: "Incident is already marked as contained." };
    inc.containedAt = new Date().toISOString();
    addTimelineEvent(db, inc, { kind: "action", actor: me.name, title: "Threat contained", description: "Containment timestamp recorded for MTTC KPI." });
    return { ok: true };
  });
  if (res.ok) refreshAll();
  return res;
}

// Social Media Reporting & Handling (SMMD)

import {
  SOCIAL_PLATFORMS,
  SOCIAL_VIOLATION_TYPES,
} from "@/lib/reference-data";
import {
  type SocialMediaReport,
  type SocialPlatform,
  type SocialReportStatus,
  type SocialViolationType,
  SOCIAL_OPEN_STATUSES,
  SOCIAL_CLOSED_STATUSES,
} from "@/lib/types";

const ALL_SOCIAL_STATUSES: SocialReportStatus[] = [
  ...SOCIAL_OPEN_STATUSES,
  ...SOCIAL_CLOSED_STATUSES,
];

function smmdRef(db: import("@/lib/db").Database): string {
  db.counters.smmd += 1;
  const year = new Date().getUTCFullYear();
  return `SMMD-${year}-${String(db.counters.smmd).padStart(3, "0")}`;
}

export interface ReportSocialMediaInput {
  platform: SocialPlatform;
  contentUrl: string;
  violationType: SocialViolationType;
  description: string;
  reporterName: string;
  reporterEmail?: string;
  linkedIncidentId?: string;
  files: { name: string; size: number; hash: string }[];
}

export async function reportSocialMedia(
  input: ReportSocialMediaInput
): Promise<ActionResult<{ id: string; ref: string }>> {
  if (DEMO_MODE) { await getCurrentUser(); return { ok: true, id: "SMMD-2025-DEMO", ref: "SMMD-2025-DEMO" }; }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;

  const platform = input.platform;
  const contentUrl = clean(input.contentUrl, 500);
  const violationType = input.violationType;
  const description = clean(input.description, 3000);
  const reporterName = clean(input.reporterName, 120);

  if (!SOCIAL_PLATFORMS.includes(platform))
    return { ok: false, error: "Select a valid platform." };
  if (!SOCIAL_VIOLATION_TYPES.includes(violationType))
    return { ok: false, error: "Select a valid violation type." };
  if (!description)
    return { ok: false, error: "Description is required." };
  if (!reporterName)
    return { ok: false, error: "Your name is required." };

  const result = mutate((db) => {
    const now = new Date();
    const ref = smmdRef(db);
    const id = `sm-${db.counters.smmd}-${now.getTime()}`;

    const report: SocialMediaReport = {
      id,
      ref,
      linkedIncidentId: input.linkedIncidentId || undefined,
      platform,
      contentUrl,
      violationType,
      description,
      reportedBy: reporterName,
      reporterEmail: clean(input.reporterEmail ?? "", 200) || undefined,
      reportedAt: now.toISOString(),
      status: "Received",
      evidence: (input.files ?? []).slice(0, 10).map((f, i) => ({
        id: `${id}-ev-${i}`,
        filename: clean(f.name, 200),
        kind: evidenceKind(f.name),
        uploadedBy: reporterName,
        uploadedAt: now.toISOString(),
        sizeLabel: sizeLabel(Number(f.size) || 0),
        hash: /^[0-9a-f]{64}$/.test(f.hash)
          ? `sha256:${f.hash}`
          : "sha256:unavailable",
      })),
      timeline: [
        {
          id: `${id}-t-0`,
          timestamp: now.toISOString(),
          actor: reporterName,
          action: "Report submitted",
          note: `${platform} — ${violationType}`,
        },
      ],
    };

    db.socialReports.unshift(report);
    addAudit(db, {
      actor: reporterName,
      action: "Submitted social media report",
      target: ref,
      details: `${platform}: ${violationType}`,
      category: "Incident",
    });
    return { id, ref };
  });

  refreshAll();
  return { ok: true, ...result };
}

export async function updateSocialMediaStatus(
  reportId: string,
  status: SocialReportStatus,
  note?: string
): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;
  if (!ALL_SOCIAL_STATUSES.includes(status))
    return { ok: false, error: "Unknown status." };

  const res = mutate((db): ActionResult => {
    const report = db.socialReports.find((r) => r.id === reportId);
    if (!report) return { ok: false, error: "Report not found." };
    if (report.status === status)
      return { ok: false, error: `Report is already ${status}.` };

    const from = report.status;
    report.status = status;

    const now = new Date().toISOString();
    if (status === "Submitted to Platform") report.submittedAt = now;
    if (
      status === "Closed" ||
      status === "No Action Required" ||
      status === "Action Taken / Content Removed" ||
      status === "Platform Rejected"
    ) {
      report.closedAt = now;
    }

    report.timeline.push({
      id: `${report.id}-t-${report.timeline.length}`,
      timestamp: now,
      actor: me.name,
      action: `Status: ${from} → ${status}`,
      note: clean(note ?? "", 500) || undefined,
    });

    addAudit(db, {
      actor: me.name,
      action: "Updated social media report status",
      target: report.ref,
      details: `${from} → ${status}`,
      category: "Incident",
    });
    return { ok: true };
  });

  if (res.ok) refreshAll();
  return res;
}

export async function assignSocialMediaOfficer(
  reportId: string,
  officerName: string
): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;

  const res = mutate((db): ActionResult => {
    const report = db.socialReports.find((r) => r.id === reportId);
    if (!report) return { ok: false, error: "Report not found." };
    const officer = db.users.find((u) => u.name === officerName && u.active);
    if (!officer) return { ok: false, error: "Select an active user." };

    report.assignedOfficer = officer.name;
    if (report.status === "Received") report.status = "Under Review";

    const now = new Date().toISOString();
    report.timeline.push({
      id: `${report.id}-t-${report.timeline.length}`,
      timestamp: now,
      actor: me.name,
      action: `Assigned to ${officer.name}`,
    });

    addAudit(db, {
      actor: me.name,
      action: "Assigned social media officer",
      target: report.ref,
      details: officer.name,
      category: "Incident",
    });
    return { ok: true };
  });

  if (res.ok) refreshAll();
  return res;
}

export async function recordSocialMediaPlatformRef(
  reportId: string,
  platformRef: string,
  outcomeNote?: string
): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;

  const ref = clean(platformRef, 200);
  if (!ref) return { ok: false, error: "Platform reference is required." };

  const res = mutate((db): ActionResult => {
    const report = db.socialReports.find((r) => r.id === reportId);
    if (!report) return { ok: false, error: "Report not found." };

    report.platformRef = ref;
    if (outcomeNote) report.outcomeNote = clean(outcomeNote, 1000);

    const now = new Date().toISOString();
    report.timeline.push({
      id: `${report.id}-t-${report.timeline.length}`,
      timestamp: now,
      actor: me.name,
      action: "Platform reference recorded",
      note: ref,
    });

    addAudit(db, {
      actor: me.name,
      action: "Recorded platform reference",
      target: report.ref,
      details: ref,
      category: "Incident",
    });
    return { ok: true };
  });

  if (res.ok) refreshAll();
  return res;
}

export async function addSocialMediaNote(
  reportId: string,
  note: string
): Promise<ActionResult> {
  if (DEMO_MODE) { await getCurrentUser(); return demoOk(); }
  const me = await getCurrentUser();
  if (!me) return SIGNED_OUT;

  const text = clean(note, 2000);
  if (!text) return { ok: false, error: "Note cannot be empty." };

  const res = mutate((db): ActionResult => {
    const report = db.socialReports.find((r) => r.id === reportId);
    if (!report) return { ok: false, error: "Report not found." };

    report.timeline.push({
      id: `${report.id}-t-${report.timeline.length}`,
      timestamp: new Date().toISOString(),
      actor: me.name,
      action: "Note added",
      note: text,
    });

    addAudit(db, {
      actor: me.name,
      action: "Added note to social media report",
      target: report.ref,
      details: text.slice(0, 100),
      category: "Incident",
    });
    return { ok: true };
  });

  if (res.ok) refreshAll();
  return res;
}
