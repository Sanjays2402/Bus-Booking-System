import { useMemo } from 'react';

export interface RevenueDatum {
  label: string;
  value: number;
  meta?: string;
}

interface RevenueBarChartProps {
  data: RevenueDatum[];
  height?: number;
  /** Currency prefix shown on the value labels. */
  prefix?: string;
}

/**
 * Lightweight pure-SVG horizontal bar chart. No runtime chart library, so it
 * adds zero to the JS bundle beyond what React already costs and matches the
 * glassmorphism palette used across the app.
 */
export default function RevenueBarChart({
  data,
  height = 220,
  prefix = '$',
}: RevenueBarChartProps) {
  const max = useMemo(
    () => data.reduce((acc, d) => (d.value > acc ? d.value : acc), 0) || 1,
    [data],
  );

  if (data.length === 0) {
    return <p className="text-white/30 text-sm">No revenue yet</p>;
  }

  const rowHeight = 36;
  const totalHeight = Math.max(height, data.length * rowHeight + 12);

  return (
    <svg
      role="img"
      aria-label="Revenue chart"
      viewBox={`0 0 480 ${totalHeight}`}
      className="w-full"
      style={{ height: totalHeight }}
    >
      <defs>
        <linearGradient id="bar-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const widthPct = (d.value / max) * 320;
        const y = i * rowHeight + 6;
        return (
          <g key={`${d.label}-${i}`}>
            <text
              x={0}
              y={y + 14}
              fill="rgba(255,255,255,0.9)"
              fontSize="12"
              fontFamily="Inter, sans-serif"
            >
              {d.label}
            </text>
            <rect
              x={120}
              y={y}
              width={320}
              height={20}
              rx={6}
              fill="rgba(255,255,255,0.06)"
            />
            <rect
              x={120}
              y={y}
              width={Math.max(widthPct, 4)}
              height={20}
              rx={6}
              fill="url(#bar-grad)"
            />
            <text
              x={Math.min(120 + widthPct + 8, 460)}
              y={y + 14}
              fill="rgba(255,255,255,0.85)"
              fontSize="11"
              fontFamily="Inter, sans-serif"
              fontWeight={600}
            >
              {prefix}
              {d.value.toFixed(2)}
              {d.meta ? ` · ${d.meta}` : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
