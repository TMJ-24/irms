"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export type ShellUser = { name: string; email: string; role: string; initials: string };

export function AppShell({
  children, alertCount, user,
}: {
  children: React.ReactNode;
  alertCount: number;
  user: ShellUser;
}) {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  function handleToggle() {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setDesktopOpen((v) => !v);
    } else {
      setMobileOpen((v) => !v);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Desktop sidebar */}
      <div
        className={[
          "hidden lg:flex flex-col transition-all duration-300 ease-in-out shrink-0",
          desktopOpen ? "w-72" : "w-0 overflow-hidden",
        ].join(" ")}
      >
        {desktopOpen && (
          <Sidebar onToggle={handleToggle} sidebarOpen={desktopOpen} />
        )}
      </div>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-2xl">
            <Sidebar
              onNavigate={() => setMobileOpen(false)}
              onToggle={() => setMobileOpen(false)}
              sidebarOpen={mobileOpen}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={handleToggle}
          sidebarOpen={desktopOpen}
          alertCount={alertCount}
          user={user}
        />
        <main className="scroll-thin flex-1 overflow-y-auto bg-[var(--page)]">
          <div className="px-4 py-6 sm:px-5 lg:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}