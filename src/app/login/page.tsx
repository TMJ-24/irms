import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";
import { getDb } from "@/lib/db";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In - Incident Reporting Management System",
};

export default async function LoginPage() {
  const { users } = await getDb();
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--sidebar-bg)] px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 15%, #2a78d6 0, transparent 45%), radial-gradient(circle at 85% 85%, #4a3aa7 0, transparent 45%)",
        }}
      />

      <div className="relative w-full max-w-xl">
        <div className="rounded-2xl bg-[var(--surface)] p-7 shadow-2xl sm:p-9">
          <div className="flex flex-col items-center text-center">
            <Image src="/ncsc-logo.png" alt="National Cyber Security Centre PNG" width={104} height={104} className="h-[104px] w-[104px] shrink-0 drop-shadow-md" priority />
            <p className="mt-4 text-[16px] font-bold tracking-tight text-ink">National Cyber Security Centre</p>
            <p className="text-[12.5px] text-ink-muted">Government of Papua New Guinea</p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-brand">
              Incident Reporting &amp; Management System
            </p>
          </div>

          <div className="my-6 h-px bg-[var(--border)]" />

          <LoginForm setupRequired={users.length === 0} minPasswordLength={MIN_PASSWORD_LENGTH} />

          <div className="mt-6 flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--page)] px-3.5 py-3">
            <Lock size={12} className="mt-0.5 shrink-0 text-ink-muted" />
            <p className="text-[11px] leading-snug text-ink-muted">
              This system is the property of the Government of Papua New Guinea. FOR OFFICIAL USE ONLY &mdash; unauthorised access is prohibited and monitored, and all activity is logged to an immutable audit trail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}