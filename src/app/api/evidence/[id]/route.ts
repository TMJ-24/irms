import { revalidatePath } from "next/cache";
import { addAudit, mutate } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Evidence download. Binary evidence storage is not connected in this build, so
 * this returns the item's chain-of-custody record. The access is written to the
 * audit trail either way, matching the "every download is audited" policy.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;

  const record = mutate((db) => {
    for (const inc of db.incidents) {
      const ev = inc.evidence.find((e) => e.id === id);
      if (ev) {
        addAudit(db, {
          actor: me.name,
          action: "Downloaded evidence record",
          target: inc.id,
          details: `${ev.filename} (${ev.hash})`,
          category: "Evidence",
        });
        return { inc, ev };
      }
    }
    return null;
  });

  if (!record) return new Response("Evidence item not found", { status: 404 });
  revalidatePath("/", "layout");

  const { inc, ev } = record;
  const text = [
    "NATIONAL CYBER SECURITY CENTRE — EVIDENCE CHAIN-OF-CUSTODY RECORD",
    "FOR OFFICIAL USE ONLY",
    "",
    `Evidence ID:   ${ev.id}`,
    `Filename:      ${ev.filename}`,
    `Type:          ${ev.kind}`,
    `Size:          ${ev.sizeLabel}`,
    `Integrity:     ${ev.hash}`,
    `Uploaded by:   ${ev.uploadedBy}`,
    `Uploaded at:   ${ev.uploadedAt}`,
    "",
    `Incident:      ${inc.id} — ${inc.title}`,
    `Severity:      ${inc.severity}`,
    `Status:        ${inc.status}`,
    "",
    `Retrieved by:  ${me.name} <${me.email}>`,
    `Retrieved at:  ${new Date().toISOString()}`,
    "",
    "Note: the original binary is held in the evidence vault; this record documents custody and integrity.",
  ].join("\r\n");

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ev.filename}.custody.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
