import Link from "next/link";
import { CalendarClock, X } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Pill } from "@/components/ui/badge";
import { getDemoDb as getDb } from "@/lib/demo-db";
import { formatDate } from "@/lib/format";
import type { IncidentTask } from "@/lib/types";
import { clsx } from "@/lib/clsx";
import { TaskStatusSelect } from "../incidents/[id]/incident-actions";

const COLUMNS: { key: IncidentTask["status"]; label: string; accent: string }[] = [
  { key: "Open", label: "Open", accent: "border-t-[#eda100]" },
  { key: "In Progress", label: "In Progress", accent: "border-t-[#2a78d6]" },
  { key: "Done", label: "Done", accent: "border-t-[#0ca30c]" },
];

const PRIORITY_TONE: Record<IncidentTask["priority"], "critical" | "warning" | "neutral"> = {
  High: "critical",
  Medium: "warning",
  Low: "neutral",
};

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const { incident: incidentParam } = await searchParams;
  const focus = typeof incidentParam === "string" ? incidentParam : undefined;
  const { tasks: allTasks } = await getDb();
  const now = new Date();
  const tasks = focus ? allTasks.filter((t) => t.incidentId === focus) : allTasks;

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={focus ? `Tasks for ${focus} — change a task's status to move it between columns` : "Investigation and response tasks across all active incidents — change a task's status to move it"}
        actions={focus ? (
          <Link href="/tasks" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-ink-secondary hover:bg-black/5">
            <X size={14} /> Show all tasks
          </Link>
        ) : undefined}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = tasks
            .filter((t) => t.status === col.key)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
          return (
            <div key={col.key} className={clsx("rounded-xl border border-t-4 border-[var(--border)] bg-[var(--surface)] p-3", col.accent)}>
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-[13px] font-bold text-ink">{col.label}</h3>
                <span className="rounded-full bg-[var(--page)] px-2 py-0.5 text-[11.5px] font-semibold text-ink-muted">{items.length}</span>
              </div>
              <div className="space-y-2.5">
                {items.map((t) => {
                  const overdue = t.status !== "Done" && new Date(t.dueDate) < now;
                  return (
                    <div key={t.id} className="rounded-lg border border-[var(--border)] bg-[var(--page)] p-3">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <Link href={`/incidents/${t.incidentId}`} className="text-[11px] font-semibold text-brand hover:underline">{t.incidentId}</Link>
                        <Pill tone={PRIORITY_TONE[t.priority]}>{t.priority}</Pill>
                      </div>
                      <p className="text-[13px] font-medium text-ink">{t.title}</p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px] text-ink-muted">
                        <span className="truncate">{t.assignee}</span>
                        <span className={clsx("flex shrink-0 items-center gap-1", overdue && "font-semibold text-[#a92727]")}>
                          <CalendarClock size={12} /> {formatDate(t.dueDate)}{overdue && " · overdue"}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <TaskStatusSelect task={t} />
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <p className="px-1 py-6 text-center text-[12.5px] text-ink-muted">No tasks</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
