"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export type ShellUser = { name: string; email: string; role: string; initials: string };

export function AppShell({ children, alertCount, user }: { children: React.ReactNode; alertCount: number; user: ShellUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [trackedPathname, setTrackedPathname] = useState(pathname);

  if (pathname !== trackedPathname) {
    setTrackedPathname(pathname);
    setMobileOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="ml-2 mt-4 h-9 w-9 shrink-0 rounded-full bg-white/10 text-white"
              aria-label="Close navigation"
            >
              <X size={18} className="mx-auto" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} alertCount={alertCount} user={user} />
        <main className="scroll-thin flex-1 overflow-y-auto bg-[var(--page)]">
          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
