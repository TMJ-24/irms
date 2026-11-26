import Link from "next/link";
import { Gavel, ArrowLeft, ExternalLink, Phone, Mail, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CybercrimePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="w-full">
      <PageHeader
        title="Cybercrime Reports"
        subtitle="Cybercrime is a matter for the Royal Papua New Guinea Constabulary"
      />

      <Card className="border-2 border-[#d03b3b]/20 bg-[#d03b3b]/5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#d03b3b]/15">
            <AlertTriangle size={22} className="text-[#d03b3b]" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-ink">This is a police matter</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">
              Cybercrime — including online fraud, financial scams, identity theft, extortion,
              hacking-for-hire, blackmail and child exploitation material — must be formally lodged
              with the <strong>Cyber Crime Unit of the Royal Papua New Guinea Constabulary (RPNGC)</strong>.
            </p>
            <p className="mt-2 text-[13px] text-ink-secondary">
              This portal handles <em>cybersecurity incidents</em> affecting government information
              systems, not criminal offences. Submitting a cybercrime report here will cause delays —
              please contact RPNGC directly.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-5 space-y-3">
        <h2 className="text-[14px] font-bold text-ink">How to report cybercrime in Papua New Guinea</h2>

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--page)]">
              <Gavel size={18} className="text-ink-muted" />
            </div>
            <div className="flex-1">
              <p className="text-[13.5px] font-semibold text-ink">RPNGC Cyber Crime Unit</p>
              <p className="mt-0.5 text-[12.5px] text-ink-secondary">
                Lodge a formal complaint with the RPNGC Cyber Crime Unit. Bring all available
                evidence including screenshots, transaction records, email headers and device
                information.
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-[12.5px] text-ink-secondary">
                  <Phone size={13} className="text-ink-muted" />
                  <span>+675 322 6477 (National Capital District Constabulary)</span>
                </div>
                <div className="flex items-center gap-2 text-[12.5px] text-ink-secondary">
                  <Mail size={13} className="text-ink-muted" />
                  <span>cyber@police.gov.pg</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-[13px] font-semibold text-ink">Preserve your evidence before reporting</p>
          <ul className="mt-2 space-y-1.5 text-[12.5px] text-ink-secondary">
            {[
              "Take screenshots of all relevant messages, profiles, transactions and receipts",
              "Record URLs, account names, phone numbers and email addresses",
              "Do not delete messages — courts and investigators need originals",
              "Export email headers if you received phishing or scam emails",
              "If financial fraud occurred, contact your bank immediately to freeze the account",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-muted" />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <p className="text-[13px] font-semibold text-ink">Is your situation a cyber incident instead?</p>
          <p className="mt-1 text-[12.5px] text-ink-secondary">
            If a government information system, network or account has been compromised — even as
            part of a criminal act — that is also a cyber incident and should be reported here.
          </p>
          <Link
            href="/report-incident"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-brand-dark"
          >
            Report a cyber incident instead
          </Link>
        </Card>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Link href="/report" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:underline">
          <ArrowLeft size={14} /> Back to report type selection
        </Link>
      </div>
    </div>
  );
}