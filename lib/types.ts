// Types côté interface. Les noms de champs suivent ceux stockés dans Firestore (snake_case).
import { STEPS } from "./contract";

export type Step = (typeof STEPS)[number];
export type Job = {
  id: string; handle: string; creator_id?: string; step: Step; status: string; message: string;
  gate?: string | null; progress?: { done: number; total: number } | null;
  requested_by?: string; created_at?: number; updated_at?: number;
};
export type Creator = {
  id: string; handle: string; profile_url?: string; niche: string; accord: string;
  followers?: number | null; avg_views?: number | null; sales_link?: boolean | null; pro_contact?: boolean | null;
  added_by?: string; created_at?: number;
};
export type Ebook = { id: string; title: string; creator_id?: string; creator_handle?: string; status: string; price?: number; pdf_url?: string; epub_url?: string; updated_at?: number };
export type Sale = { id: string; ebook_title?: string; creator_handle?: string; gross: number; fees?: number; at?: number };

export const STEP_LABEL: Record<Step, string> = {
  extraction: "Extraction", transcription: "Transcription", fiches: "Fiches", plan: "Plan", redaction: "Rédaction",
  controle: "Contrôle", mise_en_page: "Mise en page", validation: "Validation", en_vente: "En vente",
};
export const STEP_TOOL: Record<Step, string> = {
  extraction: "n8n · Apify", transcription: "Whisper (local)", fiches: "Claude", plan: "Claude", redaction: "Claude",
  controle: "Claude", mise_en_page: "Pandoc", validation: "Créateur", en_vente: "Whop",
};
export const GATE_LABEL: Record<string, string> = {
  plan_valide_par_createur: "Plan à valider avec le créateur",
  relecture_associe: "Relecture du brouillon par un associé",
  validation_ecrite_createur: "Validation écrite du créateur",
};
export const STATUS_LABEL: Record<string, string> = {
  queued: "En file", running: "En cours", done: "Terminé", error: "Erreur", waiting_human: "À valider",
};
