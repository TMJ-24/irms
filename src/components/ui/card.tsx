import { clsx } from "@/lib/clsx";

export function Card({ children, className, padded = true }: { children: React.ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={clsx("rounded-xl bg-[var(--surface)] shadow-sm", padded && "p-5", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
