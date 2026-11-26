"use server";

import { redirect } from "next/navigation";
import { addAudit, mutate, nextId, readDb } from "@/lib/db";
import {
  clearLoginFailures, endSession, getCurrentUser, hashPassword, loginLockedFor, passwordProblem,
  recordLoginFailure, startSession, verifyPassword,
} from "@/lib/auth";
import { initialsOf } from "@/lib/reference-data";

export type AuthResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** First-run only: create the initial System Administrator account. */
export async function setupAdministrator(input: { name: string; email: string; password: string; confirm: string }): Promise<AuthResult> {
  const name = String(input.name ?? "").trim().slice(0, 120);
  const email = String(input.email ?? "").trim().toLowerCase().slice(0, 200);
  const password = String(input.password ?? "");
  if (!name) return { ok: false, error: "Full name is required." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "A valid email address is required." };
  const problem = passwordProblem(password);
  if (problem) return { ok: false, error: problem };
  if (password !== input.confirm) return { ok: false, error: "Passwords do not match." };

  const userId = mutate((db) => {
    if (db.users.length > 0) return null; // setup already completed
    const id = nextId(db, "user", "u-", 3);
    db.users.push({ id, name, email, role: "System Administrator", initials: initialsOf(name), active: true });
    db.credentials[id] = hashPassword(password);
    addAudit(db, { actor: name, action: "Initial system setup", target: email, details: `First administrator account created for ${name}`, category: "User" });
    addAudit(db, { actor: name, action: "Signed in", target: email, details: "Session started after initial setup", category: "User" });
    return id;
  });
  if (!userId) return { ok: false, error: "Setup has already been completed. Sign in instead." };

  await startSession(userId, false);
  return { ok: true };
}

export async function signIn(input: { email: string; password: string; remember: boolean }): Promise<AuthResult> {
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");
  if (!email || !password) return { ok: false, error: "Enter your email address and password." };

  const locked = loginLockedFor(email);
  if (locked) return { ok: false, error: `Too many failed attempts. Try again in ${locked} minute${locked === 1 ? "" : "s"}.` };

  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email);
  const valid = verifyPassword(password, user ? db.credentials[user.id] : undefined);

  if (!user || !valid) {
    recordLoginFailure(email);
    mutate((d) => addAudit(d, { actor: "Unknown", action: "Failed sign-in", target: email, details: "Invalid email or password", category: "User" }));
    return { ok: false, error: "Incorrect email address or password." };
  }
  if (!user.active) {
    mutate((d) => addAudit(d, { actor: user.name, action: "Blocked sign-in", target: email, details: "Account is disabled", category: "User" }));
    return { ok: false, error: "This account has been disabled. Contact your system administrator." };
  }

  clearLoginFailures(email);
  await startSession(user.id, !!input.remember);
  mutate((d) => addAudit(d, { actor: user.name, action: "Signed in", target: user.email, details: input.remember ? "Persistent session (30 days)" : "Session (12 hours)", category: "User" }));
  return { ok: true };
}

export async function signOut() {
  const user = await getCurrentUser();
  await endSession();
  if (user) mutate((d) => addAudit(d, { actor: user.name, action: "Signed out", target: user.email, details: "Session ended", category: "User" }));
  redirect("/login");
}
