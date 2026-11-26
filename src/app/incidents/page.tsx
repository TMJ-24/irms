import { Suspense } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getDemoDb as getDb } from "@/lib/demo-db";
import { agencyById } from "@/lib/reference-data";
import { isMine } from "@/lib/stats";
import { getCurrentUser } from "@/lib/auth";
import { IncidentsExplorer, type IncidentRow } from "./incidents-explorer";

export default async function IncidentsPage() {
  const { incidents } = await getDb();
  const user = await getCurrentUser();
  const rows: IncidentRow[] = [...incidents]
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
    .map((i) => {
      const agency = agencyById(i.agencyId);
      return {
        id: i.id,
        title: i.title,
        category: i.category,
        severity: i.severity,
        status: i.status,
        agencyId: i.agencyId,
        agencyName: agency?.shortName ?? "—",
        assignedTo: i.assignedTo,
        reportedAt: i.reportedAt,
        slaDueAt: i.slaDueAt,
        isMine: !!user && isMine(i, user),
        searchText: [i.id, i.title, i.description, agency?.name, agency?.shortName, i.category, i.reportedBy, i.assignedTo, ...i.affectedSystems]
          .filter(Boolean).join(" ").toLowerCase(),
      };
    });

  return (
    <div>
      <PageHeader
        title="Incidents"
        subtitle="Search, filter and manage all reported cyber security incidents"
        actions={
          <a
            href="/api/export?type=incidents"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-ink-secondary transition hover:bg-black/5"
          >
            <Download size={15} /> Export CSV
          </a>
        }
      />
      <Suspense fallback={null}>
        <IncidentsExplorer rows={rows} nowIso={new Date().toISOString()} />
      </Suspense>
    </div>
  );
}
