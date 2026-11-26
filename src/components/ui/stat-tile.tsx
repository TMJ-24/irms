import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { clsx } from "@/lib/clsx";

interface StatTileProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  delta?: { value: string; direction: "up" | "down"; good: boolean };
  tone?: "brand" | "critical" | "warning" | "good" | "neutral";
  hint?: string;
  href?: string;
}

const TONE_STYLES: Record<string, string> = {
  brand: "bg-[#2a78d6]/10 text-[#1c4ed8]",
  critical: "bg-[#d03b3b]/10 text-[#d03b3b]",
  warning: "bg-[#fab219]/15 text-[#8a5a00]",
  good: "bg-[#0ca30c]/10 text-[#0ca30c]",
  neutral: "bg-slate-500/10 text-slate-500",
};

export function StatTile({ label, value, icon: Icon, delta, tone = "brand", hint, href }: StatTileProps) {
  const body = (
    <>
      <div className="flex items-start justify-between">
        <p className="text-[12.5px] font-medium text-ink-muted">{label}</p>
        <span className={clsx("flex h-8 w-8 items-center justify-center rounded-lg", TONE_STYLES[tone])}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-2.5 font-sans text-[28px] font-bold leading-none tracking-tight text-ink">{value}</p>
      <div className="mt-2 flex items-center gap-1.5">
        {delta && (
          <span
            className={clsx(
              "inline-flex items-center gap-0.5 text-[12.5px] font-semibold",
              delta.good ? "text-[#006300]" : "text-[#a92727]"
            )}
          >
            {delta.direction === "up" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {delta.value}
          </span>
        )}
        {hint && <span className="text-[12.5px] text-ink-muted">{hint}</span>}
      </div>
    </>
  );
  const cls = "block rounded-xl bg-[var(--surface)] p-5 shadow-sm";
  return href ? (
    <Link href={href} className={clsx(cls, "transition hover:shadow-md hover:ring-1 hover:ring-brand/30")}>{body}</Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
