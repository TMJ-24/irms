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
  | "Post-Incident Review"
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
  "Post-Incident Review",
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
  | "Social Media Officer"
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
  /** When the incident was actually detected (may predate reporting) */
  detectedAt?: string;
  /** Is the threat/incident currently still active? */
  isOngoing?: boolean;
  /** Business or operational impact as described by the reporter */
  businessImpact?: string;
  /** Whether sensitive, personal or classified data may be involved */
  classifiedDataInvolved?: boolean;
  /** Actions already taken by the reporting organisation before submission */
  reporterActionsTaken?: string;
  /** Indicators of compromise: IPs, domains, URLs, hashes, email addresses, filenames */
  iocs?: string[];
  assignedTo?: string;
  assignedAt?: string;
  /** ISO timestamp when containment was completed (for MTTC KPI) */
  containedAt?: string;
  slaHours: number;
  slaDueAt: string;
  isMajorIncident: boolean;
  affectedSystems: string[];
  location: string;
  actionsTaken: string[];
  rootCause?: string;
  lessonsLearned?: string;
  /** Threat actor / TTP assessment */
  ttpAssessment?: string;
  /** Residual risk after incident closure */
  residualRisk?: string;
  /** Stakeholder notifications sent during the incident */
  stakeholderNotifications?: string[];
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

// ---------------------------------------------------------------------------
// Social Media Reporting & Handling (SMMD)
// ---------------------------------------------------------------------------

export type SocialPlatform =
  | "Facebook"
  | "Instagram"
  | "X (Twitter)"
  | "YouTube"
  | "TikTok"
  | "LinkedIn"
  | "WhatsApp"
  | "Other";

export type SocialViolationType =
  | "Impersonation / Fake Account"
  | "Misinformation / Disinformation"
  | "Explicit / Sexual Content"
  | "Hate Speech / Incitement"
  | "Violence or Incitement"
  | "Harassment / Cyberbullying"
  | "Scams / Fraudulent Content"
  | "Unauthorized Use of Government Content"
  | "Defamation"
  | "Child Safety Violation"
  | "Coordinated Inauthentic Behaviour"
  | "Other";

export type SocialReportStatus =
  | "Received"
  | "Under Review"
  | "Verified"
  | "Submitted to Platform"
  | "Pending Action"
  | "Action Taken / Content Removed"
  | "Platform Rejected"
  | "No Violation Found"
  | "Escalated"
  | "Closed"
  | "No Action Required";

export const SOCIAL_OPEN_STATUSES: SocialReportStatus[] = [
  "Received",
  "Under Review",
  "Verified",
  "Submitted to Platform",
  "Pending Action",
  "Platform Rejected",
  "Escalated",
];

export const SOCIAL_CLOSED_STATUSES: SocialReportStatus[] = [
  "Action Taken / Content Removed",
  "No Violation Found",
  "Closed",
  "No Action Required",
];

export interface SocialTimeline {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  note?: string;
}

export interface SocialMediaReport {
  id: string;
  /** e.g. SMMD-2025-001 */
  ref: string;
  linkedIncidentId?: string;
  platform: SocialPlatform;
  contentUrl: string;
  violationType: SocialViolationType;
  description: string;
  evidence: EvidenceItem[];
  reportedBy: string;
  reporterEmail?: string;
  reportedAt: string;
  status: SocialReportStatus;
  assignedOfficer?: string;
  platformRef?: string;
  outcomeNote?: string;
  submittedAt?: string;
  closedAt?: string;
  timeline: SocialTimeline[];
}

// ---------------------------------------------------------------------------
// Unified report type (three-way routing)
// ---------------------------------------------------------------------------

export type ReportType = "Cyber Incident" | "Cybercrime" | "Social Media";