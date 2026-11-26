"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Gavel, MessageSquareWarning, ArrowRight, CheckCircle2 } from "lucide-react";
import type { ReportType } from "@/lib/types";
import { clsx } from "@/lib/clsx";

const TYPES = [
  {
    type: "Cyber Incident" as ReportType,
    icon: ShieldAlert,
    title: "Cyber Incident",
    routed: "Routed to NCSC Incident Response Team",
    desc: "A cybersecurity event that has compromised, disrupted or poses a threat to a government information system, network or account.",
    tags: ["Malware / Ransomware", "Phishing", "Data Breach", "Unauthorised Access", "DDoS", "Account Compromise"],
    href: "/report-incident",
    iconColor: "text-[#2a78d6]",
    iconBg: "bg-[#2a78d6]/10",
    routedColor: "text-[#2a78d6]",
    tagColor: "bg-[var(--page)] text-ink-secondary",
  },
  {
    type: "Cybercrime" as ReportType,
    icon: Gavel,
    title: "Cybercrime",
    routed: "Routed to RPNGC Cyber Crime Unit",
    desc: "A criminal offence committed using digital technology. This is a police matter — it must be lodged directly with the Royal Papua New Guinea Constabulary.",
    tags: ["Online Fraud", "Financial Scams", "Identity Theft", "Extortion", "Hacking-for-hire", "Child Exploitation"],
    href: "/report/cybercrime",
    iconColor: "text-[#d03b3b]",
    iconBg: "bg-[#d03b3b]/10",
    routedColor: "text-[#d03b3b]",
    tagColor: "bg-[var(--page)] text-ink-secondary",
  },
  {
    type: "Social Media" as ReportType,
    icon: MessageSquareWarning,
    title: "Social Media Violation",
    routed: "Routed to NCSC SMMD Team",
    desc: "Harmful or abusive content on social media platforms targeting government institutions, officials or the general public in Papua New Guinea.",
    tags: ["Impersonation", "Misinformation", "Hate Speech", "Scam Pages", "Harassment", "Explicit Content"],
    href: "/report-social-media",
    iconColor: "text-[#eda100]",
    iconBg: "bg-[#eda100]/10",
    routedColor: "text-[#eda100]",
    tagColor: "bg-[var(--page)] text-ink-secondary",
  },
];

export function ReportTypeSelector() {
  const [selected, setSelected] = useState<ReportType | null>(null);
  const router = useRouter();

  function proceed() {
    const t = TYPES.find((t) => t.type === selected);
    if (t) router.push(t.href);
  }

  return (
    <div className="w-full space-y-3">
      {TYPES.map((item) => {
        const { type, icon: Icon, title, routed, desc, tags, iconColor, iconBg, routedColor, tagColor } = item;
        const isSelected = selected === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => setSelected(type)}
            className={clsx(
              "group w-full rounded-2xl border bg-[var(--surface)] text-left shadow-sm transition-all duration-200",
              isSelected
                ? "border-brand ring-2 ring-brand/20 shadow-md"
                : "border-[var(--border)] hover:border-[var(--border)] hover:shadow-md"
            )}
          >
            <div className="flex items-start gap-5 p-6">

              {/* Icon */}
              <span className={clsx(
                "mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
                iconBg
              )}>
                <Icon size={28} className={iconColor} />
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[16px] font-bold text-ink">{title}</p>
                    <p className={clsx("mt-0.5 text-[12px] font-semibold", routedColor)}>{routed}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-brand" />
                  )}
                </div>

                <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-secondary">{desc}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={clsx(
                        "rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[11.5px] font-medium",
                        tagColor
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight
                size={18}
                className={clsx(
                  "mt-1 shrink-0 transition-transform duration-200",
                  isSelected ? "translate-x-1 text-brand" : "text-ink-muted group-hover:translate-x-1 group-hover:text-ink-secondary"
                )}
              />
            </div>
          </button>
        );
      })}

      {/* Continue CTA */}
      <div className="pt-3">
        <button
          type="button"
          disabled={!selected}
          onClick={proceed}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-brand px-6 py-4 text-[15px] font-semibold text-white shadow-md shadow-brand/25 transition hover:bg-brand-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {selected ? (
            <><span>Continue with <strong>{selected}</strong> report</span><ArrowRight size={18} /></>
          ) : (
            <span>Select a report type above to continue</span>
          )}
        </button>
      </div>
    </div>
  );
}