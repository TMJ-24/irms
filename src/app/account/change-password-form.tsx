"use client";

import { useState, useTransition } from "react";
import { changeOwnPassword } from "@/app/actions";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          try {
            const res = await changeOwnPassword(current, next, confirm);
            if (res.ok) {
              setMsg({ ok: true, text: "Password changed." });
              setCurrent(""); setNext(""); setConfirm("");
            } else setMsg({ ok: false, text: res.error });
          } catch {
            setMsg({ ok: false, text: "Something went wrong — please try again." });
          }
        });
      }}
      className="space-y-3"
    >
      <input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" aria-label="Current password" className={inputClass} />
      <input type="password" required autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password" aria-label="New password" className={inputClass} />
      <input type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" aria-label="Confirm new password" className={inputClass} />
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-[12.5px] font-medium text-[#006300]" : "text-[12.5px] font-medium text-[#a92727]"}>
          {msg.text}
        </p>
      )}
      <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
