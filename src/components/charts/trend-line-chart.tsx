"use client";

import { useState } from "react";

interface TrendDatum {
  label: string;
  value: number;
}

export function TrendLineChart({ data, color = "var(--series-1)" }: { data: TrendDatum[]; color?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 560;
  const height = 220;
  const padL = 34;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const max = Math.max(...data.map((d) => d.value), 1);
  const niceMax = Math.ceil(max / 5) * 5 || 5;
  const xFor = (i: number) => padL + (i / (data.length - 1)) * innerW;
  const yFor = (v: number) => padT + innerH - (v / niceMax) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(d.value)}`).join(" ");
  const areaPath = `${linePath} L ${xFor(data.length - 1)} ${padT + innerH} L ${xFor(0)} ${padT + innerH} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((g) => (
          <line
            key={g}
            x1={padL}
            x2={width - padR}
            y1={padT + innerH * (1 - g)}
            y2={padT + innerH * (1 - g)}
            stroke="var(--gridline)"
            strokeWidth={1}
          />
        ))}
        {gridLines.map((g) => (
          <text key={g} x={padL - 8} y={padT + innerH * (1 - g) + 3} textAnchor="end" fontSize="9.5" fill="var(--ink-muted)">
            {Math.round(niceMax * g)}
          </text>
        ))}

        <path d={areaPath} fill="url(#trendFill)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {data.map((d, i) => (
          <circle
            key={d.label}
            cx={xFor(i)}
            cy={yFor(d.value)}
            r={hover === i ? 4.5 : 2.5}
            fill={hover === i ? color : "var(--surface)"}
            stroke={color}
            strokeWidth={2}
          />
        ))}

        {data.map((d, i) => (
          <rect
            key={`hit-${d.label}`}
            x={xFor(i) - innerW / data.length / 2}
            y={padT}
            width={innerW / data.length}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {data.map((d, i) => (
          <text key={`x-${d.label}`} x={xFor(i)} y={height - 8} textAnchor="middle" fontSize="9.5" fill="var(--ink-muted)">
            {d.label}
          </text>
        ))}

        {hover !== null && (
          <line x1={xFor(hover)} x2={xFor(hover)} y1={padT} y2={padT + innerH} stroke="var(--baseline)" strokeWidth={1} strokeDasharray="3 3" />
        )}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-1 -translate-x-1/2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: `${(xFor(hover) / width) * 100}%` }}
        >
          <p className="font-semibold text-ink">{data[hover].value} incidents</p>
          <p className="text-ink-muted">{data[hover].label}</p>
        </div>
      )}
    </div>
  );
}
