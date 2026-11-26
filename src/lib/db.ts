import fs from "node:fs";
import path from "node:path";
import { connection } from "next/server";
import type { AppUser, AuditLogEntry, GeneratedReport, Incident, IncidentTask, SocialMediaReport, ThreatIntelItem, TimelineEvent } from "./types";

/**
 * Server-side data store for IRMS, persisted to `.data/irms-db.json`.
 *
 * The store starts empty â€” no sample data. The first administrator account is
 * created from the sign-in page on first run; everything else is created through
 * the application. Delete the file to reset the system completely.
 */

export interface Session {
  /** SHA-256 of the session token held in the browser cookie. */
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface Database {
  version: number;
  createdAt: string;
  users: AppUser[];
  /** Password hashes, keyed by user id. Never sent to the client. */
  credentials: Record<string, string>;
  sessions: Session[];
  incidents: Incident[];
  tasks: IncidentTask[];
  auditLogs: AuditLogEntry[];
  threatIntel: ThreatIntelItem[];
  reports: GeneratedReport[];
  socialReports: SocialMediaReport[];
  counters: { incident: number; audit: number; task: number; report: number; user: number; event: number; intel: number; smmd: number };
}

const DB_VERSION = 3;
const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "irms-db.json");

const g = globalThis as unknown as { __irmsDb?: Database };

function createDatabase(): Database {
  return {
    version: DB_VERSION,
    createdAt: new Date().toISOString(),
    users: [],
    credentials: {},
    sessions: [],
    incidents: [],
    tasks: [],
    auditLogs: [],
    threatIntel: [],
    reports: [],
    socialReports: [],
    counters: { incident: 0, audit: 1000, task: 1000, report: 1000, user: 0, event: 0, intel: 0, smmd: 0 },
  };
}

function load(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Database;
      if (parsed.version === DB_VERSION) return parsed;
      // Older formats contained generated demo data â€” start clean instead of migrating it.
      fs.renameSync(DB_FILE, `${DB_FILE}.v${parsed.version ?? "old"}.bak`);
    }
  } catch (err) {
    console.warn("[irms] could not read database file, starting empty:", err);
  }
  const fresh = createDatabase();
  persist(fresh);
  return fresh;
}

function persist(data: Database) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data));
    fs.renameSync(tmp, DB_FILE);
  } catch (err) {
    console.warn("[irms] could not persist database file:", err);
  }
}

function instance(): Database {
  if (!g.__irmsDb) g.__irmsDb = load();
  return g.__irmsDb;
}

/** Read access for Server Components. Opts the route into request-time rendering. */
export async function getDb(): Promise<Database> {
  await connection();
  return instance();
}

/** Synchronous access for code already running at request time (auth, route handlers). */
export function readDb(): Database {
  return instance();
}

/** Apply a mutation and persist. Only call from Server Actions / Route Handlers. */
export function mutate<T>(fn: (db: Database) => T): T {
  const db = instance();
  const result = fn(db);
  persist(db);
  return result;
}

export function findIncident(db: Database, id: string): Incident | undefined {
  return db.incidents.find((i) => i.id === id);
}

export function nextId(db: Database, key: keyof Database["counters"], prefix: string, pad = 0) {
  db.counters[key] += 1;
  return `${prefix}${String(db.counters[key]).padStart(pad, "0")}`;
}

export function addAudit(db: Database, entry: Omit<AuditLogEntry, "id" | "timestamp"> & { timestamp?: string }) {
  const log: AuditLogEntry = {
    id: nextId(db, "audit", "AUD-"),
    timestamp: entry.timestamp ?? new Date().toISOString(),
    ...entry,
  };
  db.auditLogs.unshift(log);
  return log;
}

/** Append a timeline event to an incident and mirror it into the audit trail. */
export function addTimelineEvent(db: Database, incident: Incident, evt: Omit<TimelineEvent, "id" | "timestamp">) {
  const timestamp = new Date().toISOString();
  const event: TimelineEvent = { id: nextId(db, "event", `${incident.id}-evt-`), timestamp, ...evt };
  incident.timeline.push(event);
  addAudit(db, {
    timestamp,
    actor: evt.actor,
    action: evt.title,
    target: incident.id,
    details: evt.description ?? `${evt.title} on ${incident.id}`,
    category: "Incident",
  });
  return event;
}


