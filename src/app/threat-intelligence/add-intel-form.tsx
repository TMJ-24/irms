"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { addThreatIntel } from "@/app/actions";
import { CATEGORIES } from "@/lib/reference-data";
import type { IncidentCategory, Severity, ThreatIntelItem } from "@/lib/types";

const TYPES: ThreatIntelItem["type"][] = ["Advisory", "IOC Feed", "Vulnerability", "Campaign", "Malware"];
const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low", "Informational"];
const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--page)] px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

export function AddIntelForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ThreatIntelItem["type"]>("Advisory");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [iocs, setIocs] = useState("");
  const [category, setCategory] = useState<IncidentCategory>("Phishing");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
        <Plus size={15} /> Publish advisory
      </button>
    );
  }

  return (
    <Card className="mb-4 w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-ink">Publish threat intelligence</h3>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-ink-muted hover:text-ink"><X size={16} /></button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          start(async () => {
            try {
              const res = await addThreatIntel({ title, type, severity, source, description, iocs, relatedCategory: category });
              if (res.ok) {
                setTitle(""); setSource(""); setDescription(""); setIocs(""); setOpen(false);
              } else setError(res.error);
            } catch {
              setError("Something went wrong — please try again.");
            }
          });
        }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Title" className={`${inputClass} sm:col-span-2`} />
        <select value={type} onChange={(e) => setType(e.target.value as ThreatIntelItem["type"])} aria-label="Type" className={inputClass}>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)} aria-label="Severity" className={inputClass}>
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input required value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source (e.g. PNG National CERT)" aria-label="Source" className={inputClass} />
        <select value={category} onChange={(e) => setCategory(e.target.value as IncidentCategory)} aria-label="Related incident category" className={inputClass}>
          {CATEGORIES.map((c) => <option key={c} value={c}>Related: {c}</option>)}
        </select>
        <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description and recommended actions" aria-label="Description" className={`${inputClass} sm:col-span-2`} />
        <textarea rows={2} value={iocs} onChange={(e) => setIocs(e.target.value)} placeholder="Indicators of compromise — one per line or comma-separated (domains, IPs, hashes, CVEs)" aria-label="Indicators of compromise" className={`${inputClass} font-mono sm:col-span-2`} />
        {error && <p role="alert" className="text-[12.5px] font-medium text-[#a92727] sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
            {pending ? "Publishing…" : "Publish"}
          </button>
        </div>
      </form>
    </Card>
  );
}
