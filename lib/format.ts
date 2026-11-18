export const nf = new Intl.NumberFormat("fr-FR");
export const compact = (n?: number | null) => n == null ? "—" : n >= 1e6 ? (n / 1e6).toFixed(1).replace(".", ",") + " M" : n >= 1e3 ? Math.round(n / 1e3) + " k" : String(n);
export const usd = (n: number) => nf.format(Math.round(n)) + " $";
export const usd2 = (n: number) => n.toFixed(2).replace(".", ",") + " $";
export function ago(ts?: number): string {
  if (!ts) return "";
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}
export function initials(s: string): string {
  const t = s.replace(/[^\p{L}\p{N} ._-]/gu, "").split(/[ ._-]+/).filter(Boolean);
  return ((t[0]?.[0] ?? "?") + (t[1]?.[0] ?? t[0]?.[1] ?? "")).toUpperCase();
}
const G = ["#6A5BFF,#12C2A3", "#F5576C,#F5A524", "#3B82F6,#8E82FF", "#12C2A3,#3B82F6", "#F5A524,#E5484D"];
export const gradientFor = (s: string) => {
  let h = 0; for (const c of s) h += c.charCodeAt(0);
  return `linear-gradient(135deg,${G[h % G.length]})`;
};
export const greeting = () => { const h = new Date().getHours(); return h < 5 ? "Bonne nuit" : h < 18 ? "Bonjour" : "Bonsoir"; };
