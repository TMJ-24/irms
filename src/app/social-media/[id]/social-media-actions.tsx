"use client";

import { useState, useTransition } from "react";
import {
  updateSocialMediaStatus,
  assignSocialMediaOfficer,
  recordSocialMediaPlatformRef,
  addSocialMediaNote,
} from "@/app/actions";
import { SOCIAL_STATUSES } from "@/lib/reference-data";
import { type SocialReportStatus } from "@/lib/types";

function SuccessMsg({ msg }: { msg: string }) {
  return <p className="mt-2 text-[12.5px] font-semibold text-[#006300]">{msg}</p>;
}
function ErrMsg({ msg }: { msg: string }) {
  return <p className="mt-2 text-[12.5px] font-semibold text-[#a92727]">{msg}</p>;
}

export function SocialStatusSelect({ reportId, current }: { reportId: string; current: SocialReportStatus }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [note, setNote] = useState("");
  const [chosen, setChosen] = useState<SocialReportStatus | "">("");

  function apply() {
    if (!chosen) return;
    setErr(""); setOk("");
    start(async () => {
      const r = await updateSocialMediaStatus(reportId, chosen, note || undefined);
      if (!r.ok) setErr(r.error);
      else setOk("Status updated to " + chosen + ".");
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <select value={chosen} onChange={(e) => setChosen(e.target.value as SocialReportStatus)}
          className="rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2 text-[13px] focus:outline-none">
          <option value="">Change status...</option>
          {SOCIAL_STATUSES.filter((s) => s !== current).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" disabled={!chosen || pending} onClick={apply}
          className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50 hover:bg-brand-dark">
          {pending ? "Saving..." : "Update"}
        </button>
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note for the status change..."
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2 text-[13px] focus:outline-none" />
      {err && <ErrMsg msg={err} />}
      {ok && <SuccessMsg msg={ok} />}
    </div>
  );
}

export function AssignOfficerForm({ reportId, officers }: { reportId: string; officers: { name: string; role: string }[] }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [chosen, setChosen] = useState("");

  function assign() {
    if (!chosen) return;
    setErr(""); setOk("");
    start(async () => {
      const r = await assignSocialMediaOfficer(reportId, chosen);
      if (!r.ok) setErr(r.error);
      else setOk("Assigned to " + chosen + ".");
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <select value={chosen} onChange={(e) => setChosen(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2 text-[13px] focus:outline-none">
          <option value="">Select officer...</option>
          {officers.map((o) => <option key={o.name} value={o.name}>{o.name} ({o.role})</option>)}
        </select>
        <button type="button" disabled={!chosen || pending} onClick={assign}
          className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50 hover:bg-brand-dark">
          {pending ? "Assigning..." : "Assign"}
        </button>
      </div>
      {err && <ErrMsg msg={err} />}
      {ok && <SuccessMsg msg={ok} />}
    </div>
  );
}

export function PlatformRefForm({ reportId }: { reportId: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [ref, setRef] = useState("");
  const [outcome, setOutcome] = useState("");

  function save() {
    setErr(""); setOk("");
    start(async () => {
      const r = await recordSocialMediaPlatformRef(reportId, ref, outcome || undefined);
      if (!r.ok) setErr(r.error);
      else setOk("Platform reference saved.");
    });
  }

  return (
    <div className="mt-3 space-y-2">
      <input value={ref} onChange={(e) => setRef(e.target.value)}
        placeholder="Platform ticket / reference number..."
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2 text-[13px] focus:outline-none" />
      <textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={3}
        placeholder="Outcome / platform response (optional)..."
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2 text-[13px] focus:outline-none resize-none" />
      <button type="button" disabled={!ref || pending} onClick={save}
        className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50 hover:bg-brand-dark">
        {pending ? "Saving..." : "Save Platform Reference"}
      </button>
      {err && <ErrMsg msg={err} />}
      {ok && <SuccessMsg msg={ok} />}
    </div>
  );
}

export function AddSocialNoteForm({ reportId }: { reportId: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [text, setText] = useState("");

  function add() {
    setErr(""); setOk("");
    start(async () => {
      const r = await addSocialMediaNote(reportId, text);
      if (!r.ok) setErr(r.error);
      else { setOk("Note added."); setText(""); }
    });
  }

  return (
    <div className="mt-4 space-y-2">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
        placeholder="Add an internal note..."
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2.5 text-[13.5px] focus:outline-none resize-none" />
      <div className="flex justify-end">
        <button type="button" disabled={!text.trim() || pending} onClick={add}
          className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50 hover:bg-brand-dark">
          {pending ? "Adding..." : "Add Note"}
        </button>
      </div>
      {err && <ErrMsg msg={err} />}
      {ok && <SuccessMsg msg={ok} />}
    </div>
  );
}