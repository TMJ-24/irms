import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { mutate, readDb, type Database } from "./db";
import type { AppUser, UserRole } from "./types";

export const SESSION_COOKIE = "irms_session";
const SESSION_HOURS = 12;
const REMEMBER_DAYS = 30;
export const MIN_PASSWORD_LENGTH = 12;

/** Roles allowed to manage user accounts. */
export const USER_ADMIN_ROLES: UserRole[] = ["System Administrator", "Cyber Security Manager"];

export function canManageUsers(user: AppUser | null | undefined) {
  return !!user && USER_ADMIN_ROLES.includes(user.role);
}

// ---------------------------------------------------------------------------
// Passwords (scrypt, per-user random salt)
// ---------------------------------------------------------------------------

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | undefined) {
  if (!stored) {
    // Spend comparable time when the account doesn't exist to avoid user enumeration.
    scryptSync(password, "irms-dummy-salt", 64);
    return false;
  }
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return "Password must contain both letters and numbers.";
  return null;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

function pruneSessions(db: Database) {
  const now = Date.now();
  db.sessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
}

/** Create a session for a user and set the cookie. Call only from Server Actions / Route Handlers. */
export async function startSession(userId: string, remember: boolean) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expires = new Date(now.getTime() + (remember ? REMEMBER_DAYS * 24 : SESSION_HOURS) * 3600000);
  mutate((db) => {
    pruneSessions(db);
    db.sessions.push({ tokenHash: sha256(token), userId, createdAt: now.toISOString(), expiresAt: expires.toISOString() });
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.IRMS_INSECURE_COOKIES !== "1",
    path: "/",
    ...(remember ? { expires } : {}),
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const hash = sha256(token);
    mutate((db) => {
      db.sessions = db.sessions.filter((s) => s.tokenHash !== hash);
    });
  }
  store.delete(SESSION_COOKIE);
}

/** End every session belonging to a user (used when an account is disabled or its password reset). */
export function revokeUserSessions(db: Database, userId: string) {
  db.sessions = db.sessions.filter((s) => s.userId !== userId);
}

/** The signed-in, active user for this request, or null. */
export async function getCurrentUser(): Promise<AppUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = readDb();
  const hash = sha256(token);
  const session = db.sessions.find((s) => s.tokenHash === hash);
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null;
  const user = db.users.find((u) => u.id === session.userId);
  return user && user.active ? user : null;
}

// ---------------------------------------------------------------------------
// Brute-force protection (per email, in memory)
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const attempts = ((globalThis as unknown as { __irmsAttempts?: Map<string, { count: number; until: number }> }).__irmsAttempts ??= new Map());

export function loginLockedFor(email: string): number {
  const a = attempts.get(email);
  if (!a || a.until <= Date.now()) return 0;
  return Math.ceil((a.until - Date.now()) / 60000);
}

export function recordLoginFailure(email: string) {
  const a = attempts.get(email) ?? { count: 0, until: 0 };
  a.count += 1;
  if (a.count >= MAX_ATTEMPTS) {
    a.until = Date.now() + LOCK_MINUTES * 60000;
    a.count = 0;
  }
  attempts.set(email, a);
}

export function clearLoginFailures(email: string) {
  attempts.delete(email);
}
