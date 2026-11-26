import { getDb } from "@/lib/db";
import { canManageUsers, getCurrentUser, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { SLA_HOURS } from "@/lib/reference-data";
import { AdminView } from "./admin-view";

export default async function AdminPage() {
  const { users } = await getDb();
  const me = await getCurrentUser();
  return (
    <AdminView
      users={users}
      currentUserId={me?.id ?? ""}
      canManage={canManageUsers(me)}
      minPasswordLength={MIN_PASSWORD_LENGTH}
      slaHours={SLA_HOURS}
    />
  );
}
