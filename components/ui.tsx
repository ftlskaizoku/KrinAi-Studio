import { useEffect, useRef, useState, type ReactNode } from "react";
import { initials, nf } from "@/lib/format";
import { Icon } from "./Icons";

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return <span className="av" style={{ width: size, height: size, fontSize: size * 0.34 }}>{initials(name)}</span>;
}
export function Pill({ tone = "", children }: { tone?: "ok" | "wa" | "ac" | "bad" | ""; children: ReactNode }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
export function Bar({ pct, tone = "" }: { pct: number; tone?: string }) {
  return <div className={`bar ${tone}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} /></div>;
}
export function Card({ children, className = "", color, style }: { children: ReactNode; className?: string; color?: string; style?: React.CSSProperties }) {
  return <section className={`card ${color ? "topc" : ""} ${className}`} style={{ ...(color ? ({ "--c": color } as React.CSSProperties) : {}), ...style }}>{children}</section>;
}
// Nombre qui monte en douceur jusqu'à sa valeur (désactivé si l'utilisateur réduit les animations).
export function Count({ to }: { to: number }) {
  const [v, setV] = useState(to);
  const from = useRef(to);
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setV(to); from.current = to; return; }
    const a = from.current, t0 = performance.now(), D = 800;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
      setV(Math.round(a + (to - a) * e));
      if (k < 1) raf = requestAnimationFrame(step); else from.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{nf.format(v)}</>;
}

export function Kpi({ icon, title, value, delta, tone, children }: { icon: string; title: string; value: ReactNode; delta?: string; tone?: "up" | "down"; color?: string; children?: ReactNode }) {
  return (
    <Card className="kpi">
      <div className="kpi-h"><span>{title}</span><span className="chip"><Icon n={icon} size={16} /></span></div>
      <b className="big">{typeof value === "number" ? <Count to={value} /> : value}</b>
      {delta && <em className={`delta ${tone ?? ""}`}>{delta}</em>}
      {children}
    </Card>
  );
}
export function Head({ title, sub, children }: { title: ReactNode; sub?: string; children?: ReactNode }) {
  return <header className="pghead"><div><h1>{title}</h1>{sub && <p className="sub">{sub}</p>}</div>{children}</header>;
}
export function Empty({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <div className="empty"><span><Icon n={icon} size={26} /></span><b>{title}</b><p>{text}</p></div>;
}
