import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { byAgency, byCategory, dashboardKpis, isMine, isOpen } from "@/lib/stats";
import { PageHeader } from "@/components/ui/page-header";
import { ReportsView } from "./reports-view";

export default async function ReportsPage() {
  const { incidents, reports } = await getDb();
  const user = await getCurrentUser();
  const now = new Date();
  const kpis = dashboardKpis(incidents, now);

  const mine = user ? incidents.filter((i) => isMine(i, user)) : [];
  const myOpen = mine.filter(isOpen);
  const weekAhead = now.getTime() + 7 * 86400000;
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const lastEventTime = (i: (typeof incidents)[number]) =>
    new Date(i.timeline[i.timeline.length - 1]?.timestamp ?? i.reportedAt).getTime();

  return (
    <div>
      <PageHeader title="Reports" subtitle="Operational, management and executive reporting for the National Cyber Security Centre" />
      <ReportsView
        userName={user?.name ?? ""}
        operational={{
          myOpen: myOpen.length,
          myCriticalHigh: myOpen.filter((i) => i.severity === "Critical" || i.severity === "High").length,
          slaDueThisWeek: myOpen.filter((i) => {
            const due = new Date(i.slaDueAt).getTime();
            return due >= now.getTime() && due <= weekAhead;
          }).length,
          myOverdue: myOpen.filter((i) => new Date(i.slaDueAt) < now).length,
          closedThisMonth: mine.filter((i) => !isOpen(i) && lastEventTime(i) >= monthStart).length,
        }}
        management={{
          total: kpis.total,
          open: kpis.open,
          slaBreaches: kpis.slaBreaches,
          avgResolution: `${kpis.avgResolution.toFixed(0)}h`,
          agencies: byAgency(incidents, now).slice(0, 6).map((a) => ({ label: a.agency.shortName, value: a.total })),
        }}
        executive={{
          critical: kpis.critical,
          majors: incidents.filter((i) => i.isMajorIncident).length,
          agenciesAffected: new Set(incidents.map((i) => i.agencyId)).size,
          slaCompliance: `${kpis.slaCompliance}%`,
          categories: byCategory(incidents).slice(0, 6),
        }}
        recent={reports.slice(0, 10)}
      />
    </div>
  );
}
