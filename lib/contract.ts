// Source de vérité du contrat entre l'app et l'orchestrateur (n8n, Activepieces ou autre).
// Toute modification se discute à trois. Les changements de cette version sont COMPATIBLES :
// un orchestrateur qui envoie l'ancien format continue de fonctionner.
import { z } from "zod";

export const STEPS = ["extraction","transcription","fiches","plan","redaction","controle","mise_en_page","validation","en_vente"] as const;
export const STATUSES = ["queued","running","done","error","waiting_human"] as const;

// 1. App -> orchestrateur : lancer un job
export const JobRequest = z.object({
  job_id: z.string(),
  type: z.literal("extraction"),
  creator: z.object({ id: z.string(), handle: z.string(), profile_url: z.string().url(), niche: z.string() }),
  options: z.object({ limit: z.number().int().positive().default(20), language: z.string().default("fr") }),
  // Nouveau : d'où viennent les contenus. "profile" = lien du profil ; "files" = vidéos déposées par le créateur.
  source: z.object({ mode: z.enum(["profile", "files"]).default("profile"), urls: z.array(z.string().url()).default([]) }).optional(),
  callback_url: z.string().url(),
  requested_by: z.string(),
});

// 2. Orchestrateur -> app : avancement, résultats, pauses
// Pour reprendre après une porte : soit UNE adresse qui reçoit la décision en JSON (n8n, pièce Activepieces à webhook),
// soit DEUX adresses, une pour approuver et une pour refuser (liens d'approbation d'Activepieces).
const Waiting = z.object({
  gate: z.string(),
  resume_url: z.string().url().optional(),
  resume_urls: z.object({ approve: z.string().url(), reject: z.string().url() }).optional(),
}).refine((w) => !!w.resume_url || !!w.resume_urls, { message: "resume_url ou resume_urls est requis" });

// Un livrable : un chemin (ancien format) ou une adresse (nouveau), avec une version facultative.
const Artifact = z.object({ type: z.string(), path: z.string().optional(), url: z.string().url().optional(), version: z.string().optional() })
  .refine((a) => !!a.path || !!a.url, { message: "path ou url est requis" });

export const JobEvent = z.object({
  event_id: z.string(),
  job_id: z.string(),
  step: z.enum(STEPS),
  status: z.enum(STATUSES),
  progress: z.object({ done: z.number(), total: z.number() }).optional(),
  message: z.string().optional(),
  artifacts: z.array(Artifact).default([]),
  waiting_for: Waiting.nullable().optional(),
});

// 3. App -> orchestrateur : décision à une porte humaine
export const Decision = z.object({
  decision: z.enum(["approved", "rejected"]),
  by: z.string(),
  comment: z.string().optional(),
  gate: z.string().optional(),
  reviewed_artifact_url: z.string().optional(), // l'adresse exacte relue (plan, manuscrit ou PDF)
});
