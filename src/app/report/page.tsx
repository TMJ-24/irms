import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportTypeSelector } from "./report-type-selector";

export default async function UnifiedReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div>
      <PageHeader
        title="Submit a Report"
        subtitle="Select the category that best describes your report. Your submission will be automatically routed to the correct team."
      />
      <ReportTypeSelector />
    </div>
  );
}