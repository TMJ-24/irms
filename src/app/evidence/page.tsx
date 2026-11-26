import Link from "next/link";
import { Paperclip, Download, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/badge";
import { getDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

const KIND_TONE: Record<string, "brand" | "good" | "warning" | "neutral" | "critical"> = {
  Screenshot: "brand",
  "Log File": "neutral",
  "Email Sample": "warning",
  "Network Capture": "critical",
  Document: "good",
  Report: "good",
  "Malware Sample": "critical",
};

export default async function EvidencePage() {
  const { incidents } = await getDb();
  const rows = incidents.flatMap((inc) => inc.evidence.map((ev) => ({ ev, incident: inc })))
    .sort((a, b) => new Date(b.ev.uploadedAt).getTime() - new Date(a.ev.uploadedAt).getTime());

  return (
    <div>
      <PageHeader
        title="Evidence Repository"
        subtitle={`${rows.length} items across all incidents — access restricted, encrypted at rest, fully audited`}
      />

      <Card className="mb-4 flex items-start gap-2.5 bg-[#2a78d6]/5">
        <Lock size={17} className="mt-0.5 shrink-0 text-brand" />
        <p className="text-[12.5px] text-ink-secondary">
          Evidence files are stored in encrypted object storage with least-privilege access controls. Every view and download is written to the immutable audit trail.
        </p>
      </Card>

      <Card padded={false}>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11.5px] uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-2.5 font-semibold">File</th>
                <th className="px-3 py-2.5 font-semibold">Type</th>
                <th className="px-3 py-2.5 font-semibold">Incident</th>
                <th className="px-3 py-2.5 font-semibold">Uploaded by</th>
                <th className="px-3 py-2.5 font-semibold">Uploaded</th>
                <th className="px-3 py-2.5 font-semibold">Size</th>
                <th className="px-5 py-2.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ ev, incident }) => (
                <tr key={ev.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--page)]">
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2">
                      <Paperclip size={14} className="shrink-0 text-ink-muted" />
                      <span className="truncate text-[13px] font-medium text-ink" title={ev.hash}>{ev.filename}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3"><Pill tone={KIND_TONE[ev.kind] ?? "neutral"}>{ev.kind}</Pill></td>
                  <td className="px-3 py-3">
                    <Link href={`/incidents/${incident.id}`} className="text-[12.5px] font-semibold text-brand hover:underline">{incident.id}</Link>
                  </td>
                  <td className="px-3 py-3 text-[12.5px] text-ink-secondary">{ev.uploadedBy}</td>
                  <td className="px-3 py-3 text-[12px] text-ink-muted">{formatDateTime(ev.uploadedAt)}</td>
                  <td className="px-3 py-3 text-[12px] text-ink-muted">{ev.sizeLabel}</td>
                  <td className="px-5 py-3 text-right">
                    <a
                      href={`/api/evidence/${encodeURIComponent(ev.id)}`}
                      className="inline-flex rounded-lg p-1.5 text-ink-muted hover:bg-black/5 hover:text-brand"
                      aria-label={`Download custody record for ${ev.filename}`}
                      title="Download chain-of-custody record (access is audited)"
                    >
                      <Download size={15} />
                    </a>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-[13px] text-ink-muted">No evidence has been uploaded yet. Evidence is attached when incidents are reported.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
