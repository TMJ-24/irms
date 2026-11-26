import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { getDemoDb as getDb } from "@/lib/demo-db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SocialMediaExplorer } from "./social-media-explorer";
import { SOCIAL_OPEN_STATUSES, SOCIAL_CLOSED_STATUSES } from "@/lib/types";
import { MessageSquareWarning, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export default async function SocialMediaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = await getDb();
  const reports = db.socialReports ?? [];

  const open = reports.filter((r) => SOCIAL_OPEN_STATUSES.includes(r.status));
  const closed = reports.filter((r) => SOCIAL_CLOSED_STATUSES.includes(r.status));
  const actioned = reports.filter((r) => r.status === "Action Taken / Content Removed");
  const escalated = reports.filter((r) => r.status === "Escalated");

  return (
    <div>
      <PageHeader
        title="Social Media Monitoring & Reporting"
        subtitle="Track, investigate and action social media violations reported against government entities"
        actions={
          <Link
            href="/report-social-media"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <Plus size={15} /> Report a violation
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total reports" value={String(reports.length)} icon={MessageSquareWarning} tone="brand" hint="all time" />
        <StatTile label="Open" value={String(open.length)} icon={Clock} tone="warning" hint="under investigation" />
        <StatTile label="Actioned" value={String(actioned.length)} icon={CheckCircle2} tone="good" hint="platform took down content" />
        <StatTile label="Escalated" value={String(escalated.length)} icon={AlertTriangle} tone="critical" hint="requires senior oversight" />
      </div>

      <SocialMediaExplorer reports={reports} />
    </div>
  );
}
