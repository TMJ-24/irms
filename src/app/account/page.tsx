import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { getCurrentUser, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <PageHeader title="My account" subtitle="Your profile and sign-in security" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" />
          <dl className="space-y-3 text-[13px]">
            {[["Name", user.name], ["Email", user.email], ["Role", user.role]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[12px] text-ink-muted">Name, email and role are managed by your system administrator.</p>
        </Card>
        <Card>
          <CardHeader title="Change password" subtitle={`At least ${MIN_PASSWORD_LENGTH} characters, including letters and numbers`} />
          <ChangePasswordForm />
        </Card>
      </div>
    </div>
  );
}
