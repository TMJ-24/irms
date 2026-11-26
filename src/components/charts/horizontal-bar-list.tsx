interface BarDatum {
  label: string;
  value: number;
  sublabel?: string;
}

export function HorizontalBarList({
  data,
  color = "var(--series-1)",
  valueSuffix = "",
  maxItems = 8,
}: {
  data: BarDatum[];
  color?: string;
  valueSuffix?: string;
  maxItems?: number;
}) {
  const items = data.slice(0, maxItems);
  const max = Math.max(...items.map((d) => d.value), 1);
  if (items.length === 0 || items.every((d) => d.value === 0)) {
    return <p className="py-6 text-center text-[12.5px] text-ink-muted">No data yet.</p>;
  }

  return (
    <div className="space-y-3.5">
      {items.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-[12.5px]">
            <span className="truncate font-medium text-ink-secondary">{d.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-ink">
              {d.value}
              {valueSuffix}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--page)]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max((d.value / max) * 100, 3)}%`, backgroundColor: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
