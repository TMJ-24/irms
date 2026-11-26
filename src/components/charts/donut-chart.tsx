interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({ data, centerLabel, centerValue }: { data: DonutDatum[]; centerLabel?: string; centerValue?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = 40;
  const stroke = 15;
  const circumference = 2 * Math.PI * radius;

  const cumulativeStarts = data.map((_, i) => data.slice(0, i).reduce((sum, item) => sum + item.value, 0));

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <svg width={168} height={168} viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--gridline)" strokeWidth={stroke} />
          {data.map((d, i) => {
            const fraction = d.value / total;
            const dash = fraction * circumference;
            const gap = circumference - dash;
            const offset = -((cumulativeStarts[i] / total) * circumference);
            return (
              <circle
                key={d.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
              >
                <title>{`${d.label}: ${d.value} (${Math.round(fraction * 100)}%)`}</title>
              </circle>
            );
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] font-bold leading-none text-ink">{centerValue}</span>
            <span className="mt-1 text-[11px] text-ink-muted">{centerLabel}</span>
          </div>
        )}
      </div>
      <ul className="w-full min-w-0 space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: d.color }} />
              <span className="truncate text-ink-secondary">{d.label}</span>
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-ink">
              {d.value} <span className="font-normal text-ink-muted">({Math.round((d.value / total) * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
