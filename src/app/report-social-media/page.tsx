import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportSocialMediaForm } from "./report-social-media-form";
import { OPEN_STATUSES } from "@/lib/types";

export default async function ReportSocialMediaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = await getDb();
  // Provide open incidents as optional linkage targets
  const incidentOptions = db.incidents
    .filter((i) => OPEN_STATUSES.includes(i.status))
    .slice(0, 50)
    .map((i) => ({ id: i.id, ref: i.id, title: i.title }));

  return (
    <div className="w-full">
      <PageHeader
        title="Report Social Media Violation"
        subtitle="Use this form to report suspected impersonation, misinformation, hate speech or other violations on social media platforms. The SMMD team will review and take appropriate action."
      />
      <Card>
        <ReportSocialMediaForm incidentOptions={incidentOptions} />
      </Card>
    </div>
  );
}
