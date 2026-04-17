type DataPoint = { label: string; value: number };

// Fixed 520×210 viewBox — bars always distributed evenly across the full width.
// This prevents the "1 giant bar" problem when SVG is stretched with width:100%.

const VW = 520;
const VH = 210;
const PL = 34; // left padding (y-axis labels)
const PR = 8;
const PT = 18; // top padding (bar value labels)
const PB = 42; // bottom padding (x-axis labels)
const PLOT_W = VW - PL - PR;  // 478
const PLOT_H = VH - PT - PB;  // 150

export function BarChart({ data, color = "var(--accent)" }: { data: DataPoint[]; color?: string }) {
  const max   = Math.max(...data.map((d) => d.value), 1);
  const hasData = data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div className="chart-empty">
        <p className="helper-text">No data for this period yet.</p>
      </div>
    );
  }

  const step = PLOT_W / data.length;
  const barW = Math.min(44, Math.max(10, step * 0.55));

  // 5 horizontal grid lines at 0%, 25%, 50%, 75%, 100% of max.
  // Deduplicate so small max values (e.g. max=1) don't produce identical ticks.
  const rawTicks = [0, 1, 2, 3, 4].map((i) => Math.round((max * i) / 4));
  const ticks = [...new Set(rawTicks)];

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="chart-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* ── Grid lines + Y labels ── */}
        {/* key uses index (i) not tick value — tick values can repeat when max is small */}
        {ticks.map((tick, i) => {
          const y = PT + PLOT_H - (tick / max) * PLOT_H;
          return (
            <g key={`tick-${i}`}>
              <line
                x1={PL} y1={y} x2={VW - PR} y2={y}
                stroke="var(--border)"
                strokeWidth={i === 0 ? 1 : 0.7}
                strokeDasharray={i === 0 ? undefined : "4 3"}
              />
              <text
                x={PL - 5} y={y + 3.5}
                textAnchor="end" fontSize={9.5} fill="var(--muted)"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* ── Bars + labels ── */}
        {data.map((d, i) => {
          const barH = Math.max((d.value / max) * PLOT_H, d.value > 0 ? 3 : 0);
          const cx   = PL + i * step + step / 2;
          const bx   = cx - barW / 2;
          const by   = PT + PLOT_H - barH;

          // Shorten labels: "Apr 15" → keep as-is; "Product Team" → "Product T…"
          const raw   = d.label;
          const label = raw.length > 11 ? raw.slice(0, 10) + "…" : raw;
          const rotate = data.length > 8;

          return (
            <g key={i}>
              {/* Bar */}
              <rect x={bx} y={by} width={barW} height={barH} rx={3} fill={color} opacity={0.88} />

              {/* Value above bar */}
              {d.value > 0 && (
                <text
                  x={cx} y={by - 5}
                  textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--text)"
                >
                  {d.value}
                </text>
              )}

              {/* X-axis label */}
              <text
                x={cx}
                y={VH - PB + 14}
                textAnchor={rotate ? "end" : "middle"}
                fontSize={rotate ? 8.5 : 10}
                fill="var(--muted)"
                transform={rotate ? `rotate(-38,${cx},${VH - PB + 14})` : undefined}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
