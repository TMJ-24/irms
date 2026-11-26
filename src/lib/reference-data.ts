import type { Agency, ImpactArea, IncidentCategory, IncidentSource, Severity } from "./types";

// Static reference data used across the system. Safe to import from client components.
// No sample incidents, users or activity live here — all records are created through the app.

export const AGENCIES: Agency[] = [
  { id: "ag-01", name: "Department of Information & Communications Technology", shortName: "DICT", sector: "Central Government", contactEmail: "soc@dict.gov.pg" },
  { id: "ag-02", name: "Department of Treasury", shortName: "Treasury", sector: "Finance", contactEmail: "it.security@treasury.gov.pg" },
  { id: "ag-03", name: "Internal Revenue Commission", shortName: "IRC", sector: "Revenue", contactEmail: "security@irc.gov.pg" },
  { id: "ag-04", name: "Bank of Papua New Guinea", shortName: "BPNG", sector: "Finance", contactEmail: "cirt@bankpng.gov.pg" },
  { id: "ag-05", name: "PNG Customs Service", shortName: "Customs", sector: "Border & Revenue", contactEmail: "it@customs.gov.pg" },
  { id: "ag-06", name: "Department of Health", shortName: "Health", sector: "Health", contactEmail: "security@health.gov.pg" },
  { id: "ag-07", name: "Department of Education", shortName: "Education", sector: "Education", contactEmail: "it@education.gov.pg" },
  { id: "ag-08", name: "Civil & Identity Registry Office", shortName: "CIRO", sector: "Identity Services", contactEmail: "soc@ciro.gov.pg" },
  { id: "ag-09", name: "Immigration & Citizenship Authority", shortName: "ICA", sector: "Border & Security", contactEmail: "security@ica.gov.pg" },
  { id: "ag-10", name: "PNG Power Ltd", shortName: "PPL", sector: "Critical Infrastructure", contactEmail: "cyber@pngpower.com.pg" },
  { id: "ag-11", name: "Royal Papua New Guinea Constabulary", shortName: "RPNGC", sector: "Law Enforcement", contactEmail: "cyber@police.gov.pg" },
  { id: "ag-12", name: "Department of Justice & Attorney General", shortName: "DJAG", sector: "Justice", contactEmail: "it.security@justice.gov.pg" },
  { id: "ag-13", name: "National Judicial Staff Service", shortName: "NJSS", sector: "Justice", contactEmail: "security@njss.gov.pg" },
  { id: "ag-14", name: "Investment Promotion Authority", shortName: "IPA", sector: "Commerce", contactEmail: "it@ipa.gov.pg" },
];

export const CATEGORIES: IncidentCategory[] = [
  "Phishing", "Malware", "Ransomware", "Unauthorized Access", "Account Compromise",
  "Data Breach", "Denial of Service", "Insider Threat", "Vulnerability Exploitation",
  "Website Defacement", "Email Security", "Network Security", "Cloud Security",
  "Lost/Stolen Device", "Other",
];

export const SOURCES: IncidentSource[] = [
  "Portal Submission", "SIEM Alert", "Helpdesk Ticket", "Email", "Phone",
  "Threat Intelligence", "Third-Party Notification",
];

export const IMPACT_AREAS: ImpactArea[] = [
  "Confidentiality", "Integrity", "Availability", "Privacy", "Financial", "Operational", "Reputational",
];

export const SYSTEMS = [
  "Employee Email (M365)", "Finance ERP", "Citizen Portal", "Payroll System", "Case Management System",
  "VPN Gateway", "Domain Controller - DC01", "Public Website", "Tax Filing Platform", "HR Information System",
  "Border Clearance System", "SCADA Network", "File Server - FS02", "Customer Database",
];

export const SLA_HOURS: Record<Severity, number> = { Critical: 4, High: 8, Medium: 24, Low: 72, Informational: 120 };

export function agencyById(id: string): Agency | undefined {
  return AGENCIES.find((a) => a.id === id);
}

export function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).map((n) => n[0]!.toUpperCase()).join("").slice(0, 3);
}
