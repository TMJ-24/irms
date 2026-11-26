"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { setupAdministrator, signIn } from "./actions";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

function PasswordInput({ id, value, onChange, placeholder, autoComplete }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${inputClass} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/10 px-3 py-2 text-[12.5px] font-medium text-[#a92727]">
      {error}
    </p>
  );
}

export function LoginForm({ setupRequired, minPasswordLength }: { setupRequired: boolean; minPasswordLength: number }) {
  return setupRequired ? <SetupForm minPasswordLength={minPasswordLength} /> : <SignInForm />;
}

function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        const res = await signIn({ email, password, remember });
        if (res.ok) {
          router.replace("/");
          router.refresh();
        }
        else {
          setError(res.error);
          setPassword("");
        }
      } catch {
        setError("Sign-in failed — please try again.");
      }
    });
  }

  return (
    <div className="w-full">
      <h2 className="text-[20px] font-bold tracking-tight text-ink">Sign in to your account</h2>
      <p className="mt-1.5 text-[13px] text-ink-muted">Use the account issued to you by your system administrator.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink" htmlFor="email">Email address</label>
          <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@agency.gov.pg" className={inputClass} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-[13px] font-semibold text-ink" htmlFor="password">Password</label>
            <button type="button" onClick={() => setShowReset((v) => !v)} className="text-[12px] font-semibold text-brand hover:underline">Forgot password?</button>
          </div>
          <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" placeholder="••••••••••••" />
        </div>

        {showReset && (
          <p role="status" className="rounded-lg bg-brand/5 px-3 py-2 text-[12px] text-ink-secondary">
            Passwords are reset by your IRMS system administrator. Contact them to have a new temporary password issued.
          </p>
        )}

        <label className="flex items-center gap-2 text-[12.5px] text-ink-secondary">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-brand" />
          Keep me signed in on this device for 30 days
        </label>

        <ErrorBox error={error} />

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark disabled:opacity-70"
        >
          {pending ? "Signing in…" : <>Sign in <ArrowRight size={16} /></>}
        </button>
      </form>
    </div>
  );
}

function SetupForm({ minPasswordLength }: { minPasswordLength: number }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    start(async () => {
      try {
        const res = await setupAdministrator({ name, email, password, confirm });
        if (res.ok) {
          router.replace("/");
          router.refresh();
        }
        else setError(res.error);
      } catch {
        setError("Setup failed — please try again.");
      }
    });
  }

  return (
    <div className="w-full">
      <h2 className="text-[20px] font-bold tracking-tight text-ink">Set up the system</h2>
      <p className="mt-1.5 text-[13px] text-ink-muted">
        No accounts exist yet. Create the first System Administrator account — you can add other staff from Administration once signed in.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink" htmlFor="name">Full name</label>
          <input id="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink" htmlFor="setup-email">Email address</label>
          <input id="setup-email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@agency.gov.pg" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink" htmlFor="setup-password">Password</label>
          <PasswordInput id="setup-password" value={password} onChange={setPassword} autoComplete="new-password" />
          <p className="mt-1 text-[11.5px] text-ink-muted">At least {minPasswordLength} characters, including letters and numbers.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-semibold text-ink" htmlFor="setup-confirm">Confirm password</label>
          <PasswordInput id="setup-confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        </div>

        <ErrorBox error={error} />

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark disabled:opacity-70"
        >
          {pending ? "Creating account…" : <>Create administrator account <ArrowRight size={16} /></>}
        </button>
      </form>

      <div className="mt-5 flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand" />
        <p className="text-[11.5px] leading-snug text-ink-muted">
          This screen is only available until the first account is created. All sign-ins and account changes are recorded in the audit trail.
        </p>
      </div>
    </div>
  );
}
