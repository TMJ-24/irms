"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Flame, CheckCircle2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { declareMajorIncident } from "@/app/actions";

export function DeclareMajorIncidentPanel({ candidates }: { candidates: { id: string; title: string; severity: string }[] }) {
  const [selected, setSelected] = useState(candidates[0]?.id ?? "");
  const [declared, setDeclared] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Keep the selection valid as the candidate list changes after a declaration.
  const current = candidates.some((c) => c.id === selected) ? selected : candidates[0]?.id ?? "";

  function declare() {
    setError(null);
    const id = current;
    start(async () => {
      try {
        const res = await declareMajorIncident(id);
        if (res.ok) setDeclared(id);
        else setError(res.error);
      } catch {
        setError("Declaration failed — please try again.");
      }
    });
  }

  if (declared) {
    return (
      <Card className="border-[#d03b3b]/30 bg-[#d03b3b]/5">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#d03b3b]" />
          <div>
            <p className="text-[13px] font-bold text-ink">
              <Link href={`/incidents/${declared}`} className="hover:underline">{declared}</Link> declared as Major Cyber Incident
            </p>
            <p className="mt-1 text-[12.5px] text-ink-secondary">
              The Incident Response Team has been notified and the declaration is recorded on the incident timeline and audit log.
            </p>
            <button type="button" onClick={() => setDeclared(null)} className="mt-3 text-[12.5px] font-semibold text-brand hover:underline">
              Declare another
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Declare a Major Incident" subtitle="Escalate an open critical or high-severity incident" />
      {candidates.length === 0 ? (
        <p className="text-[12.5px] text-ink-muted">No open critical or high-severity incidents are eligible right now.</p>
      ) : (
        <>
          <select
            aria-label="Incident to declare"
            value={current}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>{c.id} [{c.severity}] — {c.title}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={!current || pending}
            onClick={declare}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#d03b3b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#d03b3b]/30 transition hover:bg-[#a92727] disabled:opacity-50"
          >
            <Flame size={16} /> {pending ? "Declaring…" : "Declare Major Incident"}
          </button>
        </>
      )}
      {error && <p role="alert" className="mt-2 text-[12.5px] font-medium text-[#a92727]">{error}</p>}
    </Card>
  );
}
