import type { ReactNode } from "react";
import { gradientFor, initials } from "@/lib/format";
import { Icon } from "./Icons";

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return <span className="av" style={{ background: gradientFor(name), width: size, height: size, fontSize: size * 0.34 }}>{initials(name)}</span>;
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
export function Kpi({ icon, title, value, delta, color, children }: { icon: string; title: string; value: ReactNode; delta?: string; color: string; children?: ReactNode }) {
  return (
    <Card color={color} className="kpi">
      <div className="kpi-h"><span>{title}</span><span className="chip" style={{ color }}><Icon n={icon} size={18} /></span></div>
      <b className="big">{value}</b>
      {delta && <em className="delta">{delta}</em>}
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
