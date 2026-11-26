"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell, Search, ChevronDown, Plus, Settings, History, LogOut, PanelLeftOpen, Menu,
} from "lucide-react";
import { signOut } from "@/app/login/actions";
import type { ShellUser } from "./app-shell";
import { useState } from "react";

export function Topbar({
  onMenuClick, sidebarOpen, alertCount, user,
}: {
  onMenuClick: () => void;
  sidebarOpen: boolean;
  alertCount: number;
  user: ShellUser;
}) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/incidents?q=${encodeURIComponent(q)}` : "/incidents");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 backdrop-blur sm:px-5">

      {/* On desktop: only show expand button when sidebar is collapsed.
          On mobile: always show hamburger to open the drawer. */}
      {!sidebarOpen ? (
        /* Sidebar is collapsed — show expand button on all sizes */
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-ink-secondary transition hover:bg-black/5"
          aria-label="Expand navigation"
          title="Expand sidebar"
        >
          <PanelLeftOpen size={20} />
        </button>
      ) : (
        /* Sidebar is open — only show hamburger on mobile (desktop has the collapse btn in sidebar header) */
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-ink-secondary transition hover:bg-black/5 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Search */}
      <form
        onSubmit={handleSearch}
        role="search"
        className="hidden flex-1 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2 sm:flex sm:max-w-md"
      >
        <Search size={16} className="text-ink-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search incidents by ID, title, agency, system…"
          aria-label="Search incidents"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
      </form>

      <div className="flex flex-1 items-center justify-end gap-2">
        <Link
          href="/report-incident"
          className="hidden items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark sm:flex"
        >
          <Plus size={16} />
          Report Incident
        </Link>

        <Link
          href="/alerts"
          className="relative rounded-lg p-2 text-ink-secondary hover:bg-black/5"
          aria-label={`Alerts & escalations (${alertCount} requiring attention)`}
          title={`${alertCount} alert(s) requiring attention`}
        >
          <Bell size={19} />
          {alertCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d03b3b] px-1 text-[10px] font-bold text-white ring-2 ring-[var(--surface)]">
              {alertCount > 99 ? "99+" : alertCount}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 hover:bg-black/5"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2a78d6] to-[#4a3aa7] text-xs font-bold text-white">
              {user.initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-[13px] font-semibold leading-tight text-ink">{user.name}</span>
              <span className="block text-[11px] leading-tight text-ink-muted">{user.role}</span>
            </span>
            <ChevronDown size={14} className="hidden text-ink-muted sm:block" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <div
                role="menu"
                className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-lg"
              >
                <div className="border-b border-[var(--border)] px-3 py-2">
                  <p className="text-sm font-semibold text-ink">{user.name}</p>
                  <p className="text-xs text-ink-muted">{user.email}</p>
                </div>
                <Link
                  href="/account"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-[var(--page)]"
                >
                  <Settings size={15} className="text-ink-muted" /> My account
                </Link>
                <Link
                  href={`/audit-logs?actor=${encodeURIComponent(user.name)}`}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-[var(--page)]"
                >
                  <History size={15} className="text-ink-muted" /> My activity
                </Link>
                <div className="mt-1 border-t border-[var(--border)] pt-1">
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-[#a92727] hover:bg-[#d03b3b]/10"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}