/**
 * getDemoDb — returns a Database-shaped object with real users/sessions
 * merged with static demo data. No DB mutations occur for non-auth operations.
 */
import { readDb } from "./db";
import {
  DEMO_INCIDENTS, DEMO_TASKS, DEMO_THREAT_INTEL,
  DEMO_AUDIT_LOGS, DEMO_SOCIAL_REPORTS, DEMO_REPORTS,
} from "./demo-data";

export async function getDemoDb() {
  const live = readDb();
  return {
    // Real — auth and user management stay live
    users: live.users,
    credentials: live.credentials,
    sessions: live.sessions,
    // Mock — everything else is demo data
    incidents: DEMO_INCIDENTS,
    tasks: DEMO_TASKS,
    threatIntel: DEMO_THREAT_INTEL,
    auditLogs: [...DEMO_AUDIT_LOGS, ...live.auditLogs],
    reports: DEMO_REPORTS,
    socialReports: DEMO_SOCIAL_REPORTS,
    counters: { inc: 15, user: live.users.length, task: 12, intel: 5, smmd: 5 },
    version: 3,
    createdAt: live.createdAt,
  };
}

/** Convenience re-export so pages only need to import from one place */
export { DEMO_INCIDENTS, DEMO_TASKS, DEMO_SOCIAL_REPORTS, DEMO_THREAT_INTEL, DEMO_AUDIT_LOGS };