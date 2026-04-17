type Slice = { label: string; value: number; color: string };

export function DonutChart({ data }: { data: Slice[] }) {
  const total = data.reduce((n, d) => n + d.value, 0);
  if (!total) {
    return <p className="helper-text" style={{ textAlign: "center", padding: "2rem" }}>No data yet</p>;
  }

  const cx = 80, cy = 80, r = 60, inner = 36;
  let angle = -Math.PI / 2;

  const arcs = data.map((d) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const xi1 = cx + inner * Math.cos(angle);
    const yi1 = cy + inner * Math.sin(angle);
    const xi2 = cx + inner * Math.cos(angle - sweep);
    const yi2 = cy + inner * Math.sin(angle - sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const path = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
      `L ${xi1} ${yi1}`,
      `A ${inner} ${inner} 0 ${large} 0 ${xi2} ${yi2}`,
      "Z",
    ].join(" ");
    return { ...d, path, pct: Math.round((d.value / total) * 100) };
  });

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 160 160" className="donut-svg">
        {arcs.map((a, i) => (
          <path key={i} d={a.path} fill={a.color} opacity={0.9} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--text)">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="var(--muted)">total</text>
      </svg>

      <div className="donut-legend">
        {arcs.map((a, i) => (
          <div key={i} className="donut-legend-item">
            <span className="donut-dot" style={{ background: a.color }} />
            <span>{a.label}</span>
            <span className="donut-pct">{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
