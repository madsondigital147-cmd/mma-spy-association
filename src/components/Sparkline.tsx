// gráfico de área simples em SVG — série de nº de anúncios ao longo dos snapshots
export function Sparkline({
  points,
  height = 120,
}: {
  points: { at: string; v: number }[];
  height?: number;
}) {
  if (points.length < 2) {
    return (
      <div style={{ color: "var(--faint)", fontSize: 12, padding: "24px 0", textAlign: "center" }}>
        precisa de 2+ rodadas em dias diferentes pra montar o gráfico
      </div>
    );
  }
  const w = 640;
  const pad = 6;
  const vs = points.map((p) => p.v);
  const max = Math.max(...vs, 1);
  const min = Math.min(...vs, 0);
  const range = Math.max(max - min, 1);
  const x = (i: number) => pad + (i * (w - 2 * pad)) / (points.length - 1);
  const y = (v: number) => height - pad - ((v - min) / range) * (height - 2 * pad);
  const line = points.map((p, i) => `${x(i)},${y(p.v)}`).join(" ");
  const area = `${pad},${height - pad} ${line} ${w - pad},${height - pad}`;
  const last = points[points.length - 1].v;
  const first = points[0].v;
  const up = last >= first;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={up ? "#00b8ff" : "#e24b4a"} stopOpacity="0.35" />
          <stop offset="100%" stopColor={up ? "#00b8ff" : "#e24b4a"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spark)" />
      <polyline points={line} fill="none" stroke={up ? "#00b8ff" : "#e24b4a"} strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.v)} r="2.5" fill={up ? "#00b8ff" : "#e24b4a"} />
      ))}
    </svg>
  );
}
