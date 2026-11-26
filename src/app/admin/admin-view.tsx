"use client";

import { useState, useTransition } from "react";
import { Users, ShieldCheck, Settings2, UserPlus, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Pill } from "@/components/ui/badge";
import { addUser, changeUserRole, resetUserPassword, setUserActive, type ActionResult } from "@/app/actions";
import { clsx } from "@/lib/clsx";
import type { AppUser, Severity, UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["Reporter", "Security Analyst", "Incident Manager", "Cyber Security Manager", "Social Media Officer", "Executive", "System Administrator", "Auditor"];

const ROLE_CAPABILITIES: Record<UserRole, string[]> = {
  "Reporter": ["Submit and view own incidents"],
  "Security Analyst": ["Investigate, update and manage incidents"],
  "Incident Manager": ["Assign, escalate, approve and close incidents"],
  "Cyber Security Manager": ["Division-wide monitoring and reporting", "Declare Major Cyber Incidents"],
  "Social Media Officer": ["Review, verify and action social media violation reports", "Liaise with platform trust & safety teams"],
  "Executive": ["Read-only dashboards and reports"],
  "System Administrator": ["Users, roles, configuration and system administration"],
  "Auditor": ["Read-only access to incident history and audit logs"],
};

const TABS = [
  { key: "users", label: "Users", icon: Users },
  { key: "roles", label: "Roles & Permissions", icon: ShieldCheck },
  { key: "system", label: "System Configuration", icon: Settings2 },
] as const;

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

function Toggle({ defaultOn = true, label }: { defaultOn?: boolean; label: string }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className={clsx("relative h-6 w-11 shrink-0 rounded-full transition", on ? "bg-brand" : "bg-[var(--gridline)]")}
      aria-pressed={on}
      aria-label={label}
    >
      <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function AdminView({
  users, currentUserId, canManage, minPasswordLength, slaHours,
}: { users: AppUser[]; currentUserId: string; canManage: boolean; minPasswordLength: number; slaHours: Record<Severity, number> }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("users");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("Security Analyst");
  const [password, setPassword] = useState("");
  const [resetFor, setResetFor] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function run(fn: () => Promise<ActionResult>, okMsg: string, onOk?: () => void, id?: string) {
    setError(null);
    setNotice(null);
    setBusyId(id ?? null);
    start(async () => {
      try {
        const res = await fn();
        if (res.ok) {
          setNotice(okMsg);
          onOk?.();
        } else {
          setError(res.error);
        }
      } catch {
        setError("Something went wrong — please try again.");
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <div>
      <PageHeader
        title="Administration"
        subtitle="Manage users, roles, permissions and system-wide configuration"
        actions={canManage ? (
          <button
            type="button"
            onClick={() => { setTab("users"); setAdding((v) => !v); setError(null); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-brand-dark"
          >
            <UserPlus size={15} /> Add user
          </button>
        ) : undefined}
      />

      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-[var(--border)] pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={clsx(
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition",
              tab === t.key ? "bg-brand text-white" : "bg-[var(--surface)] text-ink-secondary ring-1 ring-inset ring-[var(--border)] hover:bg-black/5"
            )}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {(error || notice) && (
        <p
          role={error ? "alert" : "status"}
          className={clsx(
            "mb-4 rounded-lg px-3 py-2 text-[12.5px] font-medium",
            error ? "border border-[#d03b3b]/30 bg-[#d03b3b]/10 text-[#a92727]" : "border border-[#0ca30c]/30 bg-[#0ca30c]/10 text-[#006300]"
          )}
        >
          {error ?? notice}
        </p>
      )}

      {!canManage && (
        <p className="mb-4 rounded-lg bg-[var(--page)] px-3 py-2 text-[12.5px] text-ink-muted">
          You have read-only access. Only System Administrators and Cyber Security Managers can manage user accounts.
        </p>
      )}

      {tab === "users" && users.length <= 1 && canManage && !adding && (
        <p className="mb-4 rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 text-[12.5px] text-ink-secondary">
          You are the only user. Use <span className="font-semibold">Add user</span> to create accounts for analysts, incident managers and other staff.
        </p>
      )}

      {tab === "users" && adding && canManage && (
        <Card className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-ink">Add user</h3>
            <button type="button" onClick={() => setAdding(false)} aria-label="Close" className="text-ink-muted hover:text-ink"><X size={16} /></button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => addUser({ name, email, role, password }), `${name} added as ${role}. Share the temporary password with them securely.`, () => { setName(""); setEmail(""); setPassword(""); setAdding(false); });
            }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" aria-label="Full name" className={inputClass} />
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@ncsc.gov.pg" aria-label="Email" className={inputClass} />
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} aria-label="Role" className={inputClass}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input
              required
              type="text"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={`Temporary password (${minPasswordLength}+ chars)`}
              aria-label="Temporary password"
              className={inputClass}
            />
            <button type="submit" disabled={pending} className="rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
              {pending && !busyId ? "Adding…" : "Create account"}
            </button>
          </form>
        </Card>
      )}

      {tab === "users" && (
        <Card padded={false}>
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[11.5px] uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-2.5 font-semibold">User</th>
                  <th className="px-3 py-2.5 font-semibold">Role</th>
                  <th className="px-3 py-2.5 font-semibold">Email</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const self = u.id === currentUserId;
                  const busy = busyId === u.id;
                  return (
                    <tr key={u.id} className={clsx("border-b border-[var(--border)] last:border-0 hover:bg-[var(--page)]", !u.active && "opacity-60")}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2a78d6] to-[#4a3aa7] text-[11px] font-bold text-white">
                            {u.initials}
                          </span>
                          <span className="text-[13px] font-medium text-ink">
                            {u.name} {self && <span className="text-ink-muted">(you)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {self || !canManage ? (
                          <Pill tone="brand">{u.role}</Pill>
                        ) : (
                          <select
                            aria-label={`Role for ${u.name}`}
                            value={u.role}
                            disabled={busy}
                            onChange={(e) => run(() => changeUserRole(u.id, e.target.value as UserRole), `${u.name} is now ${e.target.value}.`, undefined, u.id)}
                            className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[12px] font-semibold text-ink-secondary focus:outline-none disabled:opacity-60"
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-3 text-[12.5px] text-ink-muted">{u.email}</td>
                      <td className="px-3 py-3">{u.active ? <Pill tone="good">Active</Pill> : <Pill tone="neutral">Disabled</Pill>}</td>
                      <td className="px-5 py-3 text-right">
                        {canManage && resetFor === u.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              run(() => resetUserPassword(u.id, resetPw), `Password reset for ${u.name}. Their existing sessions were signed out.`, () => { setResetFor(null); setResetPw(""); }, u.id);
                            }}
                            className="inline-flex items-center gap-1.5"
                          >
                            <input
                              autoFocus
                              required
                              type="text"
                              autoComplete="new-password"
                              value={resetPw}
                              onChange={(e) => setResetPw(e.target.value)}
                              placeholder="New password"
                              aria-label={`New password for ${u.name}`}
                              className="w-40 rounded-md border border-[var(--border)] bg-[var(--page)] px-2 py-1 text-[12px] focus:outline-none"
                            />
                            <button type="submit" disabled={busy} className="rounded-md bg-brand px-2 py-1 text-[12px] font-semibold text-white disabled:opacity-60">Save</button>
                            <button type="button" onClick={() => setResetFor(null)} className="text-ink-muted hover:text-ink" aria-label="Cancel"><X size={14} /></button>
                          </form>
                        ) : canManage && (
                          <button
                            type="button"
                            onClick={() => { setResetFor(u.id); setResetPw(""); setError(null); }}
                            className="mr-2 rounded-lg px-2.5 py-1 text-[12px] font-semibold text-ink-secondary ring-1 ring-inset ring-[var(--border)] hover:bg-black/5"
                          >
                            Reset password
                          </button>
                        )}
                        {canManage && !self && resetFor !== u.id && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => run(() => setUserActive(u.id, !u.active), `${u.name} ${u.active ? "disabled" : "re-enabled"}.`, undefined, u.id)}
                            className={clsx(
                              "rounded-lg px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset disabled:opacity-60",
                              u.active ? "text-[#a92727] ring-[#d03b3b]/30 hover:bg-[#d03b3b]/10" : "text-[#006300] ring-[#0ca30c]/30 hover:bg-[#0ca30c]/10"
                            )}
                          >
                            {busy ? "Saving…" : u.active ? "Disable" : "Enable"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "roles" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ROLES.map((r) => (
            <Card key={r}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-brand" />
                <h3 className="text-[14px] font-bold text-ink">{r}</h3>
              </div>
              <ul className="mt-2.5 space-y-1.5">
                {ROLE_CAPABILITIES[r].map((c) => (
                  <li key={c} className="text-[12.5px] text-ink-secondary">• {c}</li>
                ))}
              </ul>
              <p className="mt-2.5 text-[11.5px] text-ink-muted">
                {users.filter((u) => u.role === r && u.active).length} active user(s) assigned
              </p>
            </Card>
          ))}
        </div>
      )}

      {tab === "system" && (
        <>
          <p className="mb-3 text-[12.5px] text-ink-muted">
            Configuration toggles below are display-only in this build; they are not yet persisted or enforced.
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Security controls" />
              <div className="space-y-3.5">
                {([
                  ["Multi-factor authentication enforced", true],
                  ["IP allow-listing for admin console", true],
                  ["Session auto-lock after 15 minutes idle", true],
                  ["Immutable audit trail", true],
                ] as const).map(([label, on]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[13px] text-ink-secondary">{label}</span>
                    <Toggle defaultOn={on} label={label} />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="SLA response targets" subtitle="Hours to first response, by severity (applied to all new incidents)" />
              <div className="space-y-3">
                {(Object.entries(slaHours) as [Severity, number][]).map(([label, hrs]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg bg-[var(--page)] px-3 py-2.5">
                    <span className="text-[13px] font-medium text-ink">{label}</span>
                    <span className="text-[13px] font-bold text-ink">{hrs}h</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Data retention" />
              <div className="space-y-3.5">
                {[
                  ["Incident records", "7 years"],
                  ["Evidence & attachments", "7 years"],
                  ["Audit logs", "10 years (WORM storage)"],
                  ["Session logs", "12 months"],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[13px] text-ink-secondary">{label}</span>
                    <span className="text-[13px] font-semibold text-ink">{val}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Notifications" />
              <div className="space-y-3.5">
                {([
                  ["Email alerts for new critical incidents", true],
                  ["SMS escalation for SLA breach", true],
                  ["Daily digest to Cyber Security Manager", true],
                  ["Weekly executive summary", false],
                ] as const).map(([label, on]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[13px] text-ink-secondary">{label}</span>
                    <Toggle defaultOn={on} label={label} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
