import { clsx } from "@/lib/clsx";
import { SEVERITY_STYLES, STATUS_STYLES } from "@/lib/style-maps";
import type { IncidentStatus, Severity } from "@/lib/types";

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const s = SEVERITY_STYLES[severity];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset", s.bg, s.text, s.ring, className)}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", s.dot)} />
      {severity}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: IncidentStatus; className?: string }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset", s.bg, s.text, s.ring, className)}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", s.dot)} />
      {status}
    </span>
  );
}

export function Pill({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "brand" | "good" | "warning" | "critical"; className?: string }) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-500/10 text-slate-600 ring-slate-400/20",
    brand: "bg-[#2a78d6]/10 text-[#1c4ed8] ring-[#2a78d6]/25",
    good: "bg-[#0ca30c]/10 text-[#006300] ring-[#0ca30c]/25",
    warning: "bg-[#fab219]/15 text-[#8a5a00] ring-[#fab219]/25",
    critical: "bg-[#d03b3b]/10 text-[#a92727] ring-[#d03b3b]/25",
  };
  return (
    <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset", tones[tone], className)}>
      {children}
    </span>
  );
}
