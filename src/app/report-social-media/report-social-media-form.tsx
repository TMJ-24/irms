"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Paperclip, X } from "lucide-react";
import { SOCIAL_PLATFORMS, SOCIAL_VIOLATION_TYPES } from "@/lib/reference-data";
import { reportSocialMedia, type ReportSocialMediaInput } from "@/app/actions";
import { clsx } from "@/lib/clsx";

function hashFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buf = e.target?.result as ArrayBuffer;
        const digest = await crypto.subtle.digest("SHA-256", buf);
        resolve(Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join(""));
      } catch {
        resolve("unavailable");
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export function ReportSocialMediaForm({ incidentOptions }: { incidentOptions: { id: string; ref: string; title: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(fd: FormData) {
    setError(""); setSuccess("");
    const fileData = await Promise.all(
      files.map(async (f) => ({ name: f.name, size: f.size, hash: await hashFile(f) }))
    );
    const input: ReportSocialMediaInput = {
      platform: fd.get("platform") as ReportSocialMediaInput["platform"],
      contentUrl: String(fd.get("contentUrl") ?? ""),
      violationType: fd.get("violationType") as ReportSocialMediaInput["violationType"],
      description: String(fd.get("description") ?? ""),
      reporterName: String(fd.get("reporterName") ?? ""),
      reporterEmail: String(fd.get("reporterEmail") ?? ""),
      linkedIncidentId: String(fd.get("linkedIncidentId") ?? "") || undefined,
      files: fileData,
    };
    start(async () => {
      const r = await reportSocialMedia(input);
      if (!r.ok) { setError(r.error); return; }
      setSuccess(`Report ${r.ref} submitted successfully. The SMMD team will review it shortly.`);
      setTimeout(() => router.push(`/social-media/${r.id}`), 2000);
    });
  }

  return (
    <form action={submit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/8 px-4 py-3 text-[13.5px] text-[#a92727]">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-[#0ca30c]/30 bg-[#0ca30c]/8 px-4 py-3 text-[13.5px] text-[#006300]">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Platform *" name="platform" as="select">
          <option value="">Select platform…</option>
          {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </Field>
        <Field label="Violation Type *" name="violationType" as="select">
          <option value="">Select violation…</option>
          {SOCIAL_VIOLATION_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
        </Field>
      </div>

      <Field label="Content URL (link to the post or account) *" name="contentUrl" placeholder="https://www.facebook.com/…" />

      <Field label="Description *" name="description" as="textarea" rows={5}
        placeholder="Describe the violation — what was posted, why it is harmful, and any other relevant details." />

      {incidentOptions.length > 0 && (
        <Field label="Link to a cyber incident (optional)" name="linkedIncidentId" as="select">
          <option value="">None — standalone social media report</option>
          {incidentOptions.map((i) => <option key={i.id} value={i.id}>{i.ref} — {i.title}</option>)}
        </Field>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Your Name *" name="reporterName" placeholder="Full name" />
        <Field label="Your Email" name="reporterEmail" type="email" placeholder="your@email.gov.pg" />
      </div>

      {/* Evidence upload */}
      <div>
        <label className="block text-[13px] font-semibold text-ink-secondary mb-1.5">
          Screenshots / Evidence (optional)
        </label>
        <div
          className="rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--page)] px-4 py-5 text-center text-[13px] text-ink-muted cursor-pointer hover:border-brand/40 transition"
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip size={18} className="mx-auto mb-1 text-ink-muted" />
          Click to attach screenshots, logs or other evidence
        </div>
        <input ref={fileRef} type="file" multiple className="hidden" accept="image/*,.pdf,.txt,.log,.csv"
          onChange={(e) => { if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)].slice(0, 10)); }} />
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--page)] px-3 py-2 text-[12.5px]">
                <span className="truncate text-ink-secondary">{f.name}</span>
                <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-ink-muted hover:text-[#a92727]">
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className={clsx(
            "rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          )}
        >
          {pending ? "Submitting…" : "Submit Social Media Report"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label, name, as: Tag = "input", children, placeholder, type = "text", rows,
}: {
  label: string; name: string; as?: "input" | "select" | "textarea";
  children?: React.ReactNode; placeholder?: string; type?: string; rows?: number;
}) {
  const cls = "w-full rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2.5 text-[13.5px] text-ink placeholder:text-ink-muted focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/15";
  return (
    <div>
      <label className="block text-[13px] font-semibold text-ink-secondary mb-1.5">{label}</label>
      {Tag === "textarea" ? (
        <textarea name={name} rows={rows ?? 4} placeholder={placeholder} className={cls} />
      ) : Tag === "select" ? (
        <select name={name} className={cls}>{children}</select>
      ) : (
        <input name={name} type={type} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}
