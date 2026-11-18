import type { Sale } from "./types";
import { krinaiShare, netOf } from "./money";

const MONTHS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];

// Revenu KrinAi sur les n derniers mois (en dollars).
export function monthly(sales: Sale[], n = 6, now = Date.now()) {
  const d = new Date(now);
  const out: { label: string; value: number; key: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({ label: MONTHS[m.getMonth()], value: 0, key: `${m.getFullYear()}-${m.getMonth()}` });
  }
  for (const s of sales) {
    if (!s.at) continue;
    const t = new Date(s.at);
    const row = out.find((o) => o.key === `${t.getFullYear()}-${t.getMonth()}`);
    if (row) row.value += krinaiShare(netOf(s.gross, s.fees));
  }
  return out;
}

// Nombre de ventes par semaine sur les n dernières semaines.
export function weekly(sales: Sale[], n = 8, now = Date.now()) {
  const W = 7 * 86400_000;
  const out = Array.from({ length: n }, () => 0);
  for (const s of sales) {
    if (!s.at) continue;
    const idx = n - 1 - Math.floor((now - s.at) / W);
    if (idx >= 0 && idx < n) out[idx]++;
  }
  return out;
}
