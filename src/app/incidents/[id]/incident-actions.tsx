"use client";

import { useState, useTransition } from "react";
import { ArrowUpCircle, Flame, MessageSquare, Plus, X } from "lucide-react";
import {
  addComment,
  addResponseAction,
  createTask,
  declareMajorIncident,
  escalateIncident,
  reassignIncident,
  recordFindings,
  updateIncidentStatus,
  updateTaskStatus,
  type ActionResult,
} from "@/app/actions";
import { ALL_STATUSES, type IncidentStatus, type IncidentTask } from "@/lib/types";
import { clsx } from "@/lib/clsx";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";
const primaryBtn =
  "rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-brand-dark disabled:opacity-60";
const secondaryBtn =
  "rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-[13px] font-semibold text-ink-secondary hover:bg-black/5 disabled:opacity-60";

/** Runs a server action, tracks pending state and surfaces errors. */
function useAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(fn: () => Promise<ActionResult>, onOk?: () => void) {
    setError(null);
    start(async () => {
      try {
        const res = await fn();
        if (res.ok) onOk?.();
        else setError(res.error);
      } catch {
        setError("Something went wrong — please try again.");
      }
    });
  }
  return { pending, error, run, setError };
}

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return <p role="alert" className="mt-2 text-[12.5px] font-medium text-[#a92727]">{error}</p>;
}

type Panel = "status" | "escalate" | "reassign" | "major" | null;

export function IncidentActionBar({
  incidentId,
  status,
  assignedTo,
  isMajor,
  assignees,
}: {
  incidentId: string;
  status: IncidentStatus;
  assignedTo?: string;
  isMajor: boolean;
  assignees: { name: string; role: string }[];
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const { pending, error, run, setError } = useAction();
  const [nextStatus, setNextStatus] = useState<IncidentStatus>(status);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [raise, setRaise] = useState(false);
  const [assignee, setAssignee] = useState(assignedTo ?? assignees[0]?.name ?? "");

  function open(p: Panel) {
    setError(null);
    setPanel(panel === p ? null : p);
    setNextStatus(status);
    setAssignee(assignedTo ?? assignees[0]?.name ?? "");
  }
  const close = () => {
    setPanel(null);
    setNote("");
    setReason("");
    setRaise(false);
  };

  return (
    <div className="w-full lg:w-auto">
      <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
        <button type="button" onClick={() => open("status")} className={secondaryBtn} aria-expanded={panel === "status"}>
          Update status
        </button>
        <button
          type="button"
          onClick={() => open("escalate")}
          aria-expanded={panel === "escalate"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/10 px-3.5 py-2 text-[13px] font-semibold text-[#a92727] hover:bg-[#d03b3b]/20"
        >
          <ArrowUpCircle size={15} /> Escalate
        </button>
        {!isMajor && (
          <button type="button" onClick={() => open("major")} aria-expanded={panel === "major"} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d03b3b]/30 px-3.5 py-2 text-[13px] font-semibold text-[#a92727] hover:bg-[#d03b3b]/10">
            <Flame size={15} /> Declare major
          </button>
        )}
        <button type="button" onClick={() => open("reassign")} className={primaryBtn} aria-expanded={panel === "reassign"}>
          {assignedTo ? "Reassign" : "Assign"}
        </button>
      </div>

      {panel && (
        <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm lg:w-[420px] lg:ml-auto">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13.5px] font-semibold text-ink">
              {panel === "status" && "Update incident status"}
              {panel === "escalate" && "Escalate incident"}
              {panel === "reassign" && (assignedTo ? "Reassign incident" : "Assign incident")}
              {panel === "major" && "Declare Major Cyber Incident"}
            </p>
            <button type="button" onClick={close} aria-label="Close" className="text-ink-muted hover:text-ink"><X size={16} /></button>
          </div>

          {panel === "status" && (
            <form onSubmit={(e) => { e.preventDefault(); run(() => updateIncidentStatus(incidentId, nextStatus, note), close); }} className="space-y-3">
              <select aria-label="New status" value={nextStatus} onChange={(e) => setNextStatus(e.target.value as IncidentStatus)} className={inputClass}>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}{s === status ? " (current)" : ""}</option>)}
              </select>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Optional note for the timeline…" className={inputClass} />
              <button type="submit" disabled={pending || nextStatus === status} className={primaryBtn}>{pending ? "Saving…" : "Save status"}</button>
            </form>
          )}

          {panel === "escalate" && (
            <form onSubmit={(e) => { e.preventDefault(); run(() => escalateIncident(incidentId, reason, raise), close); }} className="space-y-3">
              <textarea required value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Why does this need Incident Manager attention?" className={inputClass} />
              <label className="flex items-center gap-2 text-[12.5px] text-ink-secondary">
                <input type="checkbox" checked={raise} onChange={(e) => setRaise(e.target.checked)} className="accent-brand" />
                Also raise severity by one level (tightens the SLA)
              </label>
              <button type="submit" disabled={pending} className="rounded-lg bg-[#d03b3b] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#a92727] disabled:opacity-60">
                {pending ? "Escalating…" : "Escalate"}
              </button>
            </form>
          )}

          {panel === "reassign" && (
            <form onSubmit={(e) => { e.preventDefault(); run(() => reassignIncident(incidentId, assignee), close); }} className="space-y-3">
              <select aria-label="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} className={inputClass}>
                {assignees.map((a) => <option key={a.name} value={a.name}>{a.name} — {a.role}{a.name === assignedTo ? " (current)" : ""}</option>)}
              </select>
              <button type="submit" disabled={pending || assignee === assignedTo} className={primaryBtn}>{pending ? "Saving…" : "Assign"}</button>
            </form>
          )}

          {panel === "major" && (
            <div className="space-y-3">
              <p className="text-[12.5px] text-ink-secondary">
                This activates the Incident Response Team, triggers executive notification and places {incidentId} on the Major Cyber Incident track.
              </p>
              <button type="button" disabled={pending} onClick={() => run(() => declareMajorIncident(incidentId), close)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#d03b3b] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#a92727] disabled:opacity-60">
                <Flame size={15} /> {pending ? "Declaring…" : "Confirm declaration"}
              </button>
            </div>
          )}
          <ErrorText error={error} />
        </div>
      )}
    </div>
  );
}

export function CommentForm({ incidentId }: { incidentId: string }) {
  const [body, setBody] = useState("");
  const { pending, error, run } = useAction();
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); run(() => addComment(incidentId, body), () => setBody("")); }}
      className="mt-4 border-t border-[var(--border)] pt-4"
    >
      <div className="flex items-center gap-2">
        <MessageSquare size={16} className="shrink-0 text-ink-muted" />
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add an internal note…"
          aria-label="Internal note"
          className={inputClass}
        />
        <button type="submit" disabled={pending || !body.trim()} className={clsx(primaryBtn, "shrink-0")}>{pending ? "Posting…" : "Post"}</button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

export function ResponseActionForm({ incidentId }: { incidentId: string }) {
  const [text, setText] = useState("");
  const { pending, error, run } = useAction();
  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => addResponseAction(incidentId, text), () => setText("")); }} className="mt-4 border-t border-[var(--border)] pt-4">
      <div className="flex items-center gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Record a response action, e.g. Blocked IOC at firewall" aria-label="Response action" className={inputClass} />
        <button type="submit" disabled={pending || !text.trim()} className={clsx(secondaryBtn, "shrink-0")}>{pending ? "Saving…" : "Add"}</button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

export function FindingsForm({ incidentId, rootCause, lessonsLearned }: { incidentId: string; rootCause?: string; lessonsLearned?: string }) {
  const [editing, setEditing] = useState(false);
  const [rc, setRc] = useState(rootCause ?? "");
  const [ll, setLl] = useState(lessonsLearned ?? "");
  const { pending, error, run } = useAction();

  if (!editing) {
    return (
      <button type="button" onClick={() => { setRc(rootCause ?? ""); setLl(lessonsLearned ?? ""); setEditing(true); }} className="mt-3 text-[12.5px] font-semibold text-brand hover:underline">
        {rootCause || lessonsLearned ? "Edit findings" : "Record root cause & lessons learned"}
      </button>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); run(() => recordFindings(incidentId, rc, ll), () => setEditing(false)); }} className="mt-3 space-y-3">
      <textarea value={rc} onChange={(e) => setRc(e.target.value)} rows={2} placeholder="Root cause" aria-label="Root cause" className={inputClass} />
      <textarea value={ll} onChange={(e) => setLl(e.target.value)} rows={2} placeholder="Lessons learned / recommendations" aria-label="Lessons learned" className={inputClass} />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryBtn}>{pending ? "Saving…" : "Save findings"}</button>
        <button type="button" onClick={() => setEditing(false)} className={secondaryBtn}>Cancel</button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

export function TaskStatusSelect({ task }: { task: IncidentTask }) {
  const { pending, error, run } = useAction();
  return (
    <div>
      <select
        aria-label={`Status of ${task.id}`}
        value={task.status}
        disabled={pending}
        onChange={(e) => run(() => updateTaskStatus(task.id, e.target.value as IncidentTask["status"]))}
        className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1 text-[11.5px] font-semibold text-ink-secondary focus:outline-none disabled:opacity-60"
      >
        <option value="Open">Open</option>
        <option value="In Progress">In Progress</option>
        <option value="Done">Done</option>
      </select>
      {error && <p role="alert" className="mt-1 text-[11px] text-[#a92727]">{error}</p>}
    </div>
  );
}

export function NewTaskForm({ incidentId, defaultDue }: { incidentId: string; defaultDue: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<IncidentTask["priority"]>("Medium");
  const [due, setDue] = useState(defaultDue);
  const { pending, error, run } = useAction();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
        <Plus size={13} /> Add task
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); run(() => createTask(incidentId, title, priority, due), () => { setTitle(""); setOpen(false); }); }}
      className="mt-3 space-y-2"
    >
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" aria-label="Task title" className={inputClass} />
      <div className="flex gap-2">
        <select aria-label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as IncidentTask["priority"])} className={inputClass}>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <input type="date" aria-label="Due date" required value={due} onChange={(e) => setDue(e.target.value)} className={inputClass} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryBtn}>{pending ? "Adding…" : "Add task"}</button>
        <button type="button" onClick={() => setOpen(false)} className={secondaryBtn}>Cancel</button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}
