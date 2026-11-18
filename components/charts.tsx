import { useId } from "react";
import { usd } from "@/lib/format";

export function Spark({ data, w = 96, h = 36 }: { data: number[]; w?: number; h?: number }) {
  const id = useId();
  const m = Math.max(...data, 1);
  const pts = data.map((v, i) => [(i * (w - 4)) / Math.max(1, data.length - 1) + 2, h - 4 - (v / m) * (h - 10)]);
  const line = pts.map((p) => p.join(",")).join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--ac)" stopOpacity=".28" /><stop offset="1" stopColor="var(--ac)" stopOpacity="0" /></linearGradient></defs>
      <polygon points={`2,${h} ${line} ${w - 2},${h}`} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke="var(--ac)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AreaChart({ data, label }: { data: { label: string; value: number }[]; label: string }) {
  const id = useId();
  const W = 600, H = 230, m = Math.max(...data.map((d) => d.value), 1) * 1.15;
  const x = (i: number) => 44 + (i * (W - 70)) / Math.max(1, data.length - 1);
  const y = (v: number) => H - 30 - (v / m) * (H - 56);
  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="chart">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--ac)" stopOpacity=".28" /><stop offset="1" stopColor="var(--ac)" stopOpacity="0" /></linearGradient></defs>
      {[0, 1, 2, 3].map((k) => { const yy = H - 30 - (k * (H - 56)) / 3; return <g key={k}><line x1="40" x2={W - 8} y1={yy} y2={yy} stroke="var(--ln)" strokeDasharray="3 5" /><text x="0" y={yy + 3}>{Math.round((m * k) / 3)}</text></g>; })}
      <polygon points={`${x(0)},${H - 30} ${pts} ${x(data.length - 1)},${H - 30}`} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => <g key={i}><circle cx={x(i)} cy={y(d.value)} r={i === data.length - 1 ? 4.5 : 3} fill={i === data.length - 1 ? "var(--ac)" : "var(--sf)"} stroke="var(--ac)" strokeWidth="1.8"><title>{d.label} : {usd(d.value)}</title></circle><text x={x(i)} y={H - 8} textAnchor="middle">{d.label}</text></g>)}
    </svg>
  );
}

export function BarChart({ data, label }: { data: number[]; label: string }) {
  const id = useId();
  const m = Math.max(...data, 1);
  return (
    <svg viewBox="0 0 330 160" role="img" aria-label={label} className="chart">
      {data.map((v, i) => { const h = Math.max(3, (v / m) * 115); return <g key={i}><rect x={10 + i * 39} y={130 - h} width="25" height={h} rx="6" fill="var(--ac)" opacity={i === data.length - 1 ? 1 : 0.38}><title>S{i + 1} : {v} ventes</title></rect><text x={22.5 + i * 39} y="150" textAnchor="middle">S{i + 1}</text></g>; })}
    </svg>
  );
}

const COLS = ["var(--ac)", "color-mix(in srgb,var(--ac) 60%,var(--bg))", "color-mix(in srgb,var(--ac) 35%,var(--bg))", "var(--mu2)"];
export function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const C = 2 * Math.PI * 42;
  let off = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 110 110" role="img" aria-label="Répartition par niche" width="150" height="150">
        <circle cx="55" cy="55" r="42" fill="none" stroke="var(--sf2)" strokeWidth="10" />
        {data.map((d, i) => { const l = (d.value / total) * C; const el = <circle key={i} cx="55" cy="55" r="42" fill="none" stroke={COLS[i % 4]} strokeWidth="10" strokeDasharray={`${Math.max(0, l - 3)} ${C - l + 3}`} strokeDashoffset={-off} transform="rotate(-90 55 55)" strokeLinecap="round" />; off += l; return el; })}
      </svg>
      <ul className="legend">{data.map((d, i) => <li key={i}><i style={{ background: COLS[i % 4] }} />{d.label} <b>{Math.round((d.value / total) * 100)} %</b></li>)}</ul>
    </div>
  );
}

// Anneau à graduations (comme le tableau de bord Syncylla)
export function TickRing({ pct, label, sub }: { pct: number; label?: string; sub?: string }) {
  const N = 60, on = Math.round((pct / 100) * N);
  return (
    <div className="tickring" role="img" aria-label={`${pct} % ${label ?? ""}`}>
      <svg viewBox="0 0 200 200" width="190" height="190">
        {Array.from({ length: N }, (_, i) => {
          const a = (i / N) * 2 * Math.PI - Math.PI / 2;
          const r1 = 78, r2 = i < on ? 94 : 88;
          return <line key={i} x1={100 + r1 * Math.cos(a)} y1={100 + r1 * Math.sin(a)} x2={100 + r2 * Math.cos(a)} y2={100 + r2 * Math.sin(a)} stroke={i < on ? "var(--ac)" : "var(--ln2)"} strokeWidth="3" strokeLinecap="round" />;
        })}
      </svg>
      <div className="mid"><b>{pct}<small>%</small></b><span>{label}</span>{sub && <em>{sub}</em>}</div>
    </div>
  );
}

export function Ring({ pct, size = 150 }: { pct: number; size?: number }) {
  const id = useId();
  const C = 2 * Math.PI * 44;
  return (
    <svg viewBox="0 0 110 110" width={size} height={size} role="img" aria-label={`Progression ${pct} %`} className="ring">
            <circle cx="55" cy="55" r="44" fill="none" stroke="var(--sf3)" strokeWidth="9" />
      <circle cx="55" cy="55" r="44" fill="none" stroke="var(--ac)" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform="rotate(-90 55 55)" style={{ transition: "stroke-dashoffset .6s" }} />
      <text x="55" y="62" textAnchor="middle">{pct} %</text>
    </svg>
  );
}
