import { ReportIncidentForm } from "./report-incident-form";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/auth";

export default async function ReportIncidentPage() {
  const user = await getCurrentUser();
  return (
    <div>
      <PageHeader
        title="Report a Cyber Security Incident"
        subtitle="Submit as much detail as you have available — you can update the report as the investigation progresses."
      />
      <ReportIncidentForm defaultName={user?.name ?? ""} defaultEmail={user?.email ?? ""} />
    </div>
  );
}
