import type { Creator } from "./types";

// Les 4 critères de sélection des créateurs (définis par les associés).
export const CRITERIA = [
  { key: "views", label: "50 k à 200 k vues sur ses vidéos" },
  { key: "followers", label: "10 k à 100 k abonnés, pas plus" },
  { key: "nolink", label: "Aucun lien vers un produit ou service qu'il vend" },
  { key: "open", label: "Ouvert aux collaborations (e-mail pro en bio)" },
] as const;

// true = critère rempli, false = non rempli, null = pas encore vérifié
export function evaluate(c: Creator): (boolean | null)[] {
  const range = (v: number | null | undefined, lo: number, hi: number) => (v == null ? null : v >= lo && v <= hi);
  return [
    range(c.avg_views, 50_000, 200_000),
    range(c.followers, 10_000, 100_000),
    c.sales_link == null ? null : !c.sales_link,
    c.pro_contact == null ? null : !!c.pro_contact,
  ];
}
// Score sur 100 : part des critères remplis (les critères non vérifiés ne comptent pas comme remplis).
export const score = (c: Creator) => Math.round((evaluate(c).filter((x) => x === true).length / CRITERIA.length) * 100);
