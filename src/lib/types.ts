export type Severity = "Critical" | "High" | "Medium" | "Low" | "Informational";

export type IncidentStatus =
  | "Reported"
  | "Triage"
  | "Assigned"
  | "Investigating"
  | "Containment"
  | "Eradication"
  | "Recovery"
  | "Monitoring"
  | "Resolved"
  | "Closed"
  | "Rejected"
  | "Duplicate"
  | "False Positive";

export const OPEN_STATUSES: IncidentStatus[] = [
  "Reported",
  "Triage",
  "Assigned",
  "Investigating",
  "Containment",
  "Eradication",
  "Recovery",
  "Monitoring",
];

export const CLOSED_STATUSES: IncidentStatus[] = [
  "Resolved",
  "Closed",
  "Rejected",
  "Duplicate",
  "False Positive",
];

export type IncidentCategory =
  | "Phishing"
  | "Malware"
  | "Ransomware"
  | "Unauthorized Access"
  | "Account Compromise"
  | "Data Breach"
  | "Denial of Service"
  | "Insider Threat"
  | "Vulnerability Exploitation"
  | "Website Defacement"
  | "Email Security"
  | "Network Security"
  | "Cloud Security"
  | "Lost/Stolen Device"
  | "Other";

export type ImpactArea =
  | "Confidentiality"
  | "Integrity"
  | "Availability"
  | "Privacy"
  | "Financial"
  | "Operational"
  | "Reputational";

export type IncidentSource =
  | "Portal Submission"
  | "SIEM Alert"
  | "Helpdesk Ticket"
  | "Email"
  | "Phone"
  | "Threat Intelligence"
  | "Third-Party Notification";

export type UserRole =
  | "Reporter"
  | "Security Analyst"
  | "Incident Manager"
  | "Cyber Security Manager"
  | "Executive"
  | "System Administrator"
  | "Auditor";

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  agencyId?: string;
  initials: string;
  active: boolean;
}

export interface GeneratedReport {
  id: string;
  name: string;
  level: "Operational" | "Management" | "Executive" | "Audit";
  generatedBy: string;
  generatedAt: string;
  format: "CSV";
  exportType: "incidents" | "operational" | "management" | "executive" | "audit";
}

export interface Agency {
  id: string;
  name: string;
  shortName: string;
  sector: string;
  contactEmail: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  title: string;
  description?: string;
  kind: "status" | "assignment" | "action" | "escalation" | "note" | "system";
}

export interface EvidenceItem {
  id: string;
  filename: string;
  kind: "Screenshot" | "Log File" | "Email Sample" | "Network Capture" | "Document" | "Malware Sample" | "Report";
  uploadedBy: string;
  uploadedAt: string;
  sizeLabel: string;
  hash: string;
}

export interface IncidentComment {
  id: string;
  author: string;
  timestamp: string;
  body: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: Severity;
  impact: ImpactArea[];
  status: IncidentStatus;
  agencyId: string;
  source: IncidentSource;
  reportedBy: string;
  reporterEmail?: string;
  reportedAt: string;
  assignedTo?: string;
  assignedAt?: string;
  slaHours: number;
  slaDueAt: string;
  isMajorIncident: boolean;
  affectedSystems: string[];
  location: string;
  actionsTaken: string[];
  rootCause?: string;
  lessonsLearned?: string;
  timeline: TimelineEvent[];
  evidence: EvidenceItem[];
  comments: IncidentComment[];
}

export interface IncidentTask {
  id: string;
  incidentId: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: "Open" | "In Progress" | "Done";
  priority: "High" | "Medium" | "Low";
}

export interface ThreatIntelItem {
  id: string;
  title: string;
  type: "Advisory" | "IOC Feed" | "Vulnerability" | "Campaign" | "Malware";
  severity: Severity;
  publishedAt: string;
  source: string;
  description: string;
  iocs: string[];
  relatedCategory: IncidentCategory;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  details: string;
  category: "Incident" | "User" | "System" | "Report" | "Evidence";
}

export const ALL_STATUSES: IncidentStatus[] = [...OPEN_STATUSES, ...CLOSED_STATUSES];
