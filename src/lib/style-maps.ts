import type { IncidentStatus, Severity } from "./types";

export const SEVERITY_STYLES: Record<Severity, { bg: string; text: string; dot: string; ring: string }> = {
  Critical: { bg: "bg-[#d03b3b]/10", text: "text-[#a92727]", dot: "bg-[#d03b3b]", ring: "ring-[#d03b3b]/25" },
  High: { bg: "bg-[#ec835a]/15", text: "text-[#b5501f]", dot: "bg-[#ec835a]", ring: "ring-[#ec835a]/25" },
  Medium: { bg: "bg-[#fab219]/15", text: "text-[#8a5a00]", dot: "bg-[#fab219]", ring: "ring-[#fab219]/25" },
  Low: { bg: "bg-[#0ca30c]/10", text: "text-[#006300]", dot: "bg-[#0ca30c]", ring: "ring-[#0ca30c]/25" },
  Informational: { bg: "bg-slate-500/10", text: "text-slate-600", dot: "bg-slate-400", ring: "ring-slate-400/25" },
};

export const SEVERITY_ORDER: Severity[] = ["Critical", "High", "Medium", "Low", "Informational"];

/** Plain hex colours for SVG charts (Tailwind classes can't be used as stroke/fill values). */
export const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "#d03b3b",
  High: "#ec835a",
  Medium: "#fab219",
  Low: "#0ca30c",
  Informational: "#94a3b8",
};

export const STATUS_COLORS: Record<IncidentStatus, string> = {
  Reported: "#2a78d6",
  Triage: "#eda100",
  Assigned: "#5b9be6",
  Investigating: "#4a3aa7",
  Containment: "#d03b3b",
  Eradication: "#e87ba4",
  Recovery: "#1baf7a",
  Monitoring: "#127a54",
  Resolved: "#0ca30c",
  Closed: "#64748b",
  Rejected: "#94a3b8",
  Duplicate: "#a8a29e",
  "False Positive": "#cbd5e1",
};

const openStyle = { bg: "bg-[#2a78d6]/10", text: "text-[#1c4ed8]", dot: "bg-[#2a78d6]", ring: "ring-[#2a78d6]/25" };
const closedStyle = { bg: "bg-[#0ca30c]/10", text: "text-[#006300]", dot: "bg-[#0ca30c]", ring: "ring-[#0ca30c]/25" };
const negativeStyle = { bg: "bg-slate-500/10", text: "text-slate-500", dot: "bg-slate-400", ring: "ring-slate-400/25" };
const criticalStyle = { bg: "bg-[#d03b3b]/10", text: "text-[#a92727]", dot: "bg-[#d03b3b]", ring: "ring-[#d03b3b]/25" };

export const STATUS_STYLES: Record<IncidentStatus, { bg: string; text: string; dot: string; ring: string }> = {
  Reported: openStyle,
  Triage: { bg: "bg-[#eda100]/15", text: "text-[#8a5a00]", dot: "bg-[#eda100]", ring: "ring-[#eda100]/25" },
  Assigned: openStyle,
  Investigating: { bg: "bg-[#4a3aa7]/10", text: "text-[#4a3aa7]", dot: "bg-[#4a3aa7]", ring: "ring-[#4a3aa7]/25" },
  Containment: criticalStyle,
  Eradication: criticalStyle,
  Recovery: { bg: "bg-[#1baf7a]/10", text: "text-[#127a54]", dot: "bg-[#1baf7a]", ring: "ring-[#1baf7a]/25" },
  Monitoring: { bg: "bg-[#1baf7a]/10", text: "text-[#127a54]", dot: "bg-[#1baf7a]", ring: "ring-[#1baf7a]/25" },
  Resolved: closedStyle,
  Closed: { bg: "bg-slate-500/10", text: "text-slate-600", dot: "bg-slate-500", ring: "ring-slate-400/25" },
  Rejected: negativeStyle,
  Duplicate: negativeStyle,
  "False Positive": negativeStyle,
};

export const IMPACT_ICON_LABEL: Record<string, string> = {
  Confidentiality: "Confidentiality",
  Integrity: "Integrity",
  Availability: "Availability",
  Privacy: "Privacy",
  Financial: "Financial",
  Operational: "Operational",
  Reputational: "Reputational",
};
