"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, UploadCloud, X, ShieldCheck, ArrowRight, Info } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { AGENCIES, CATEGORIES, IMPACT_AREAS, SLA_HOURS, SOURCES, SYSTEMS } from "@/lib/reference-data";
import type { ImpactArea, IncidentCategory, IncidentSource, Severity } from "@/lib/types";
import { SeverityBadge } from "@/components/ui/badge";
import { clsx } from "@/lib/clsx";
import { reportIncident } from "@/app/actions";

const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low", "Informational"];
const IMPACTS: ImpactArea[] = IMPACT_AREAS;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

async function sha256(file: File) {
  try {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch { return ""; }
}

function FL({ text, required = true }: { text: string; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-[13px] font-semibold text-ink">
      {text} {required && <span className="text-[#d03b3b]">*</span>}
    </label>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <p className="mt-1 flex items-center gap-1 text-[11.5px] text-ink-muted">
      <Info size={11} className="shrink-0" /> {text}
    </p>
  );
}

const inputClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export function ReportIncidentForm({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IncidentCategory>("Phishing");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [impacts, setImpacts] = useState<ImpactArea[]>([]);
  const [systems, setSystems] = useState<string[]>([]);
  const [agencyId, setAgencyId] = useState(AGENCIES[0].id);
  const [source, setSource] = useState<IncidentSource>("Portal Submission");
  const [reporterName, setReporterName] = useState(defaultName);
  const [reporterEmail, setReporterEmail] = useState(defaultEmail);
  const [location, setLocation] = useState("");
  // New fields (PDF Section 7)
  const [detectedAt, setDetectedAt] = useState("");
  const [isOngoing, setIsOngoing] = useState(true);
  const [businessImpact, setBusinessImpact] = useState("");
  const [classifiedData, setClassifiedData] = useState(false);
  const [reporterActionsTaken, setReporterActionsTaken] = useState("");
  const [iocs, setIocs] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState<{ id: string; severity: Severity } | null>(null);

  function toggle<T,>(list: T[], value: T, setter: (v: T[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function resetForm() {
    setTitle(""); setDescription(""); setCategory("Phishing"); setSeverity("Medium");
    setImpacts([]); setSystems([]); setAgencyId(AGENCIES[0].id); setSource("Portal Submission");
    setLocation(""); setDetectedAt(""); setIsOngoing(true); setBusinessImpact("");
    setClassifiedData(false); setReporterActionsTaken(""); setIocs("");
    setFiles([]); setError(null); setFileError(null);
  }

  function addFiles(list: FileList | null) {
    const incoming = Array.from(list ?? []);
    const tooBig = incoming.filter((f) => f.size > MAX_FILE_BYTES);
    setFileError(tooBig.length ? `${tooBig.map((f) => f.name).join(", ")} exceed the 25 MB limit.` : null);
    setFiles((prev) => [...prev, ...incoming.filter((f) => f.size <= MAX_FILE_BYTES)]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const hashed = await Promise.all(files.map(async (f) => ({ name: f.name, size: f.size, hash: await sha256(f) })));
        const res = await reportIncident({
          title, description, agencyId, source, category, severity, impacts, systems,
          reporterName, reporterEmail, location,
          detectedAt: detectedAt || undefined,
          isOngoing,
          businessImpact: businessImpact || undefined,
          classifiedDataInvolved: classifiedData,
          reporterActionsTaken: reporterActionsTaken || undefined,
          iocs: iocs || undefined,
          files: hashed,
        });
        if (res.ok) { setSubmitted({ id: res.id, severity }); resetForm(); }
        else setError(res.error);
      } catch { setError("The report could not be submitted — please try again."); }
    });
  }

  if (submitted) {
    const sla = SLA_HOURS[submitted.severity];
    return (
      <Card className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0ca30c]/10">
          <CheckCircle2 size={28} className="text-[#0ca30c]" />
        </div>
        <h2 className="text-lg font-bold text-ink">Incident reported successfully</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Your report has been logged and routed to the NCSC SOC for triage. You will be notified as the investigation progresses.
        </p>
        <div className="mx-auto mt-5 flex max-w-sm items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--page)] px-4 py-3">
          <div className="text-left">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Incident reference</p>
            <p className="text-base font-bold text-ink">{submitted.id}</p>
          </div>
          <SeverityBadge severity={submitted.severity} />
        </div>
        <div className="mx-auto mt-3 flex max-w-sm items-center gap-2 rounded-xl border border-[#2a78d6]/20 bg-[#2a78d6]/5 px-4 py-3 text-left">
          <ShieldCheck size={18} className="shrink-0 text-brand" />
          <p className="text-[12.5px] text-ink-secondary">
            Target response time: <span className="font-semibold text-ink">{sla} hours</span> based on {submitted.severity.toLowerCase()} severity.
          </p>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/incidents/${submitted.id}`} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
            View {submitted.id}
          </Link>
          <button type="button" onClick={() => setSubmitted(null)} className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-black/5">
            Report another incident
          </button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">

        {/* Basic incident info */}
        <Card>
          <CardHeader title="Incident information" subtitle="Describe what happened, when, and where" />
          <div className="space-y-4">
            <div>
              <FL text="Incident title" />
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Suspicious login attempts on VPN gateway" className={inputClass} />
            </div>
            <div>
              <FL text="Description of what was observed" />
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
                placeholder="Describe what was observed, when it started, who is involved, and any actions already taken." className={inputClass} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FL text="Date / time detected" required={false} />
                <input type="datetime-local" value={detectedAt} onChange={(e) => setDetectedAt(e.target.value)} className={inputClass} />
                <Hint text="When you first noticed the event — may be before you are reporting it" />
              </div>
              <div className="flex flex-col justify-center gap-2 pt-2">
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-secondary">
                  <input type="checkbox" checked={isOngoing} onChange={(e) => setIsOngoing(e.target.checked)} className="accent-brand h-4 w-4" />
                  <span>Incident / threat is currently <strong>ongoing</strong></span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-secondary">
                  <input type="checkbox" checked={classifiedData} onChange={(e) => setClassifiedData(e.target.checked)} className="accent-brand h-4 w-4" />
                  <span>Sensitive, personal or <strong>classified data</strong> may be involved</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <FL text="Reporting agency" />
                <select value={agencyId} onChange={(e) => setAgencyId(e.target.value)} className={inputClass}>
                  {AGENCIES.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <FL text="Source of report" />
                <select value={source} onChange={(e) => setSource(e.target.value as IncidentSource)} className={inputClass}>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <FL text="Location / site" required={false} />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Port Moresby HQ, Remote / VPN" className={inputClass} />
            </div>
          </div>
        </Card>

        {/* Classification */}
        <Card>
          <CardHeader title="Classification" subtitle="Help analysts triage and prioritise correctly" />
          <div className="space-y-4">
            <div>
              <FL text="Incident type" />
              <select value={category} onChange={(e) => setCategory(e.target.value as IncidentCategory)} className={inputClass}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <FL text="Severity" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {SEVERITIES.map((s) => (
                  <button key={s} type="button" onClick={() => setSeverity(s)}
                    className={clsx("rounded-lg border px-2 py-2 text-[12.5px] font-semibold transition",
                      severity === s ? "border-brand bg-brand/10 text-brand-dark" : "border-[var(--border)] text-ink-secondary hover:bg-black/5")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FL text="Business or operational impact" required={false} />
              <textarea value={businessImpact} onChange={(e) => setBusinessImpact(e.target.value)} rows={2}
                placeholder="e.g. Finance ERP unavailable — staff cannot process payroll. Estimated X users affected." className={inputClass} />
            </div>
            <div>
              <FL text="Impact areas" required={false} />
              <div className="flex flex-wrap gap-2">
                {IMPACTS.map((i) => (
                  <button key={i} type="button" onClick={() => toggle(impacts, i, setImpacts)}
                    className={clsx("rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition",
                      impacts.includes(i) ? "border-brand bg-brand/10 text-brand-dark" : "border-[var(--border)] text-ink-secondary hover:bg-black/5")}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Affected systems */}
        <Card>
          <CardHeader title="Affected systems" subtitle="Select all systems believed to be involved" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SYSTEMS.map((s) => (
              <label key={s} className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-[12.5px] text-ink-secondary hover:bg-black/5">
                <input type="checkbox" checked={systems.includes(s)} onChange={() => toggle(systems, s, setSystems)} className="accent-brand" />
                {s}
              </label>
            ))}
          </div>
        </Card>

        {/* IOCs */}
        <Card>
          <CardHeader title="Indicators of compromise (IOCs)" subtitle="Enter any known indicators — one per line or comma-separated" />
          <textarea value={iocs} onChange={(e) => setIocs(e.target.value)} rows={4}
            placeholder={"IP addresses, domains, URLs, email addresses, file hashes, filenames, registry keys...\ne.g.\n185.220.101.5\nmalicious-domain.com\nphishing@example.net\nSHA256: a1b2c3..."}
            className={inputClass} />
          <Hint text="Leave blank if unknown. Analysts can add IOCs later during investigation." />
        </Card>

        {/* Actions already taken */}
        <Card>
          <CardHeader title="Actions already taken" subtitle="What has the reporting organisation done so far?" />
          <textarea value={reporterActionsTaken} onChange={(e) => setReporterActionsTaken(e.target.value)} rows={3}
            placeholder="e.g. Isolated the affected workstation, reset the compromised account password, notified the IT helpdesk." className={inputClass} />
        </Card>

        {/* Evidence */}
        <Card>
          <CardHeader title="Evidence & attachments" subtitle="Screenshots, logs, email headers, PCAPs or other supporting files" />
          <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] px-4 py-8 text-center hover:border-brand/50 hover:bg-brand/5">
            <UploadCloud size={26} className="text-ink-muted" />
            <p className="text-[13px] font-medium text-ink-secondary">Click to upload or drag and drop</p>
            <p className="text-[11.5px] text-ink-muted">PNG, JPG, PDF, LOG, PCAP, EML — up to 25 MB each</p>
            <input type="file" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          </label>
          {fileError && <p role="alert" className="mt-2 text-[12px] font-medium text-[#a92727]">{fileError}</p>}
          {files.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg bg-[var(--page)] px-3 py-1.5 text-[12.5px] text-ink-secondary">
                  <span className="truncate">{f.name} <span className="text-ink-muted">({Math.max(1, Math.round(f.size / 1024))} KB)</span></span>
                  <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} aria-label={`Remove ${f.name}`} className="text-ink-muted hover:text-[#d03b3b]">
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Your details" subtitle="So analysts can follow up if needed" />
          <div className="space-y-4">
            <div>
              <FL text="Full name" />
              <input required value={reporterName} onChange={(e) => setReporterName(e.target.value)} placeholder="Jane Doe" className={inputClass} />
            </div>
            <div>
              <FL text="Email address" />
              <input required type="email" value={reporterEmail} onChange={(e) => setReporterEmail(e.target.value)} placeholder="jane.doe@agency.gov.pg" className={inputClass} />
            </div>
          </div>
        </Card>

        <Card className="bg-[#2a78d6]/5">
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand" />
            <div>
              <p className="text-[13px] font-semibold text-ink">SLA target response</p>
              <p className="mt-1 text-[12.5px] text-ink-secondary">
                Based on the severity selected, this incident should receive an initial response within{" "}
                <span className="font-semibold text-ink">{SLA_HOURS[severity]} hours</span>.
              </p>
            </div>
          </div>
        </Card>

        <Card className="border border-[#eda100]/30 bg-[#eda100]/5">
          <p className="text-[13px] font-semibold text-ink">Reporting cybercrime?</p>
          <p className="mt-1 text-[12.5px] text-ink-secondary">Online fraud, scams or criminal offences must be reported to the RPNGC Cyber Crime Unit, not this portal.</p>
          <Link href="/report/cybercrime" className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
            See cybercrime reporting guidance <ArrowRight size={12} />
          </Link>
        </Card>

        {error && <p role="alert" className="rounded-lg border border-[#d03b3b]/30 bg-[#d03b3b]/10 px-3 py-2 text-[12.5px] font-medium text-[#a92727]">{error}</p>}
        <button type="submit" disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark disabled:opacity-70">
          {pending ? "Submitting..." : <><span>Submit incident report</span> <ArrowRight size={16} /></>}
        </button>
        <p className="text-center text-[11.5px] text-ink-muted">
          Submitting this form creates an auditable record. False reporting may be subject to disciplinary action.
        </p>
      </div>
    </form>
  );
}