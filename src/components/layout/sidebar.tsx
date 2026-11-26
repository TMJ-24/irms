"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus2,
  ShieldAlert,
  Search,
  ListChecks,
  FolderLock,
  History,
  BellRing,
  FileBarChart,
  BarChart3,
  Building2,
  Radar,
  ScrollText,
  Settings,
  ChevronDown,
  Flame,
} from "lucide-react";
import { useState } from "react";
import { clsx } from "@/lib/clsx";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children?: { label: string; href: string }[];
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Report Incident", href: "/report-incident", icon: FilePlus2 },
    ],
  },
  {
    label: "Incident Management",
    items: [
      {
        label: "Incidents",
        href: "/incidents",
        icon: ShieldAlert,
        children: [
          { label: "All Incidents", href: "/incidents" },
          { label: "My Incidents", href: "/incidents?view=mine" },
          { label: "Critical", href: "/incidents?severity=Critical" },
          { label: "Open", href: "/incidents?status=open" },
          { label: "Closed", href: "/incidents?status=closed" },
        ],
      },
      { label: "Investigations", href: "/investigations", icon: Search },
      { label: "Tasks", href: "/tasks", icon: ListChecks },
      { label: "Evidence", href: "/evidence", icon: FolderLock },
      { label: "Incident Timeline", href: "/timeline", icon: History },
      { label: "Alerts & Escalations", href: "/alerts", icon: BellRing },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Reports", href: "/reports", icon: FileBarChart },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Agencies", href: "/agencies", icon: Building2 },
      { label: "Threat Intelligence", href: "/threat-intelligence", icon: Radar },
    ],
  },
  {
    label: "Governance",
    items: [
      { label: "Audit Logs", href: "/audit-logs", icon: ScrollText },
      { label: "Administration", href: "/admin", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string) {
  const base = href.split("?")[0];
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(base + "/");
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>("Incidents");

  return (
    <div className="flex h-full w-72 flex-col bg-[var(--sidebar-bg)] text-[var(--sidebar-ink)]">
      <div className="flex items-center gap-3 border-b border-[var(--sidebar-border)] px-5 py-5">
        <Image src="/ncsc-logo.png" alt="National Cyber Security Centre PNG" width={52} height={52} className="h-[52px] w-[52px] shrink-0" priority />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-white">National Cyber Security Centre</p>
          <p className="truncate text-[11px] text-[var(--sidebar-ink-muted)]">Incident Reporting &amp; Management</p>
        </div>
      </div>

      <Link
        href="/major-incident"
        onClick={onNavigate}
        className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-[#d03b3b]/40 bg-[#d03b3b]/15 px-3 py-2.5 text-sm font-semibold text-[#ff9c9c] transition hover:bg-[#d03b3b]/25"
      >
        <Flame size={16} className="shrink-0" />
        Declare Major Incident
      </Link>

      <nav className="scroll-thin mt-4 flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-2.5 pb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[var(--sidebar-ink-muted)]">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                if (item.children) {
                  const expanded = openGroup === item.label || active;
                  return (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={() => setOpenGroup(expanded ? null : item.label)}
                        className={clsx(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition",
                          active ? "bg-[var(--sidebar-active)] text-white" : "text-[var(--sidebar-ink)] hover:bg-white/5"
                        )}
                      >
                        <Icon size={17} className="shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown size={14} className={clsx("transition-transform", expanded && "rotate-180")} />
                      </button>
                      {expanded && (
                        <ul className="mt-0.5 ml-[27px] space-y-0.5 border-l border-white/10 pl-3">
                          {item.children.map((child) => (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={onNavigate}
                                className="block rounded-md px-2.5 py-1.5 text-[13px] text-[var(--sidebar-ink-muted)] transition hover:bg-white/5 hover:text-white"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                }
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={clsx(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition",
                        active ? "bg-[var(--sidebar-active)] text-white" : "text-[var(--sidebar-ink)] hover:bg-white/5"
                      )}
                    >
                      <Icon size={17} className="shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--sidebar-border)] px-4 py-3">
        <p className="text-[10.5px] leading-snug text-[var(--sidebar-ink-muted)]">
          Property of the Government of Papua New Guinea — FOR OFFICIAL USE ONLY
        </p>
      </div>
    </div>
  );
}
