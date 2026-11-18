// Données d'exemple pour le mode démo (NEXT_PUBLIC_DEMO=1). Aucune de ces valeurs n'est réelle.
import type { Creator, Ebook, Job, Sale } from "./types";

const H = 3600_000, D = 24 * H;
const now = () => Date.now();

export const demoCreators = (): Creator[] => [
  { id: "mr.rois", handle: "mr.rois", niche: "Mindset", accord: "signe", followers: 64_000, avg_views: 88_000, sales_link: false, pro_contact: true },
  { id: "chef.amina", handle: "chef.amina", niche: "Cooking", accord: "signe", followers: 48_000, avg_views: 72_000, sales_link: false, pro_contact: true },
  { id: "coach.malik", handle: "coach.malik", niche: "Fitness", accord: "signe", followers: 92_000, avg_views: 140_000, sales_link: false, pro_contact: true },
  { id: "career.nia", handle: "career.nia", niche: "Career", accord: "en_discussion", followers: 35_000, avg_views: 61_000, sales_link: false, pro_contact: true },
  { id: "parent.zoe", handle: "parent.zoe", niche: "Parenting", accord: "aucun", followers: 22_000, avg_views: 54_000, sales_link: true, pro_contact: true },
  { id: "finance.leo", handle: "finance.leo", niche: "Finance", accord: "aucun", followers: 130_000, avg_views: 40_000, sales_link: false, pro_contact: false },
  { id: "dog.sam", handle: "dog.sam", niche: "Dog Trainers", accord: "aucun", followers: 18_000, avg_views: null, sales_link: null, pro_contact: null },
];

export const demoJobs = (): Job[] => [
  { id: "demo-j1", handle: "mr.rois", step: "plan", status: "waiting_human", message: "Plan à valider", gate: "plan_valide_par_createur", updated_at: now() - 2 * H, created_at: now() - 2 * D },
  { id: "demo-j2", handle: "chef.amina", step: "transcription", status: "running", message: "Vidéo 14 sur 20 transcrite", progress: { done: 14, total: 20 }, updated_at: now() - 4 * 60_000, created_at: now() - 3 * H },
  { id: "demo-j3", handle: "coach.malik", step: "controle", status: "waiting_human", message: "Rapport de contrôle prêt", gate: "relecture_associe", updated_at: now() - 5 * H, created_at: now() - 4 * D },
  { id: "demo-j4", handle: "career.nia", step: "redaction", status: "running", message: "Chapitre 3 sur 8", progress: { done: 3, total: 8 }, updated_at: now() - 22 * 60_000, created_at: now() - 3 * D },
  { id: "demo-j5", handle: "parent.zoe", step: "en_vente", status: "done", message: "En vente sur Whop", updated_at: now() - 6 * D, created_at: now() - 12 * D },
];

export const demoEbooks = (): Ebook[] => [
  { id: "e1", title: "The Quiet Code", creator_handle: "mr.rois", status: "validation", price: 19, updated_at: now() - 2 * H },
  { id: "e2", title: "Meal Prep Basics", creator_handle: "chef.amina", status: "production", price: 15, updated_at: now() - 3 * H },
  { id: "e3", title: "Strong After 40", creator_handle: "coach.malik", status: "vente", price: 19, pdf_url: "#", epub_url: "#", updated_at: now() - 9 * D },
  { id: "e4", title: "Calm Parenting", creator_handle: "parent.zoe", status: "vente", price: 12, pdf_url: "#", epub_url: "#", updated_at: now() - 6 * D },
];

export const demoSales = (): Sale[] => {
  // Ventes réparties sur ~6 mois, de plus en plus nombreuses.
  const out: Sale[] = [];
  const books: [string, string, number][] = [["Strong After 40", "coach.malik", 19], ["Calm Parenting", "parent.zoe", 12], ["Strong After 40", "coach.malik", 19]];
  let n = 0;
  for (let w = 0; w < 26; w++) {
    const count = Math.round(1 + w * 0.9);
    for (let k = 0; k < count; k++) {
      const [t, c, p] = books[n % books.length];
      out.push({ id: `s${n++}`, ebook_title: t, creator_handle: c, gross: p, at: now() - (25 - w) * 7 * D + k * 5 * H });
    }
  }
  return out;
};
