// Source de vérité du contrat entre l'app et n8n. Toute modification se discute à trois.
import { z } from "zod";

export const STEPS = ["extraction","transcription","fiches","plan","redaction","controle","mise_en_page","validation","en_vente"] as const;
export const STATUSES = ["queued","running","done","error","waiting_human"] as const;

// 1. App -> n8n : lancer un job
export const JobRequest = z.object({
  job_id: z.string(),
  type: z.literal("extraction"),
  creator: z.object({ id: z.string(), handle: z.string(), profile_url: z.string().url(), niche: z.string() }),
  options: z.object({ limit: z.number().int().positive().default(20), language: z.string().default("fr") }),
  callback_url: z.string().url(),
  requested_by: z.string(),
});

// 2. n8n -> app : avancement, résultats, pauses
export const JobEvent = z.object({
  event_id: z.string(),
  job_id: z.string(),
  step: z.enum(STEPS),
  status: z.enum(STATUSES),
  progress: z.object({ done: z.number(), total: z.number() }).optional(),
  message: z.string().optional(),
  artifacts: z.array(z.object({ type: z.string(), path: z.string() })).default([]),
  waiting_for: z.object({ gate: z.string(), resume_url: z.string().url() }).nullable().optional(),
});

// 3. App -> n8n : décision à une porte humaine
export const Decision = z.object({
  decision: z.enum(["approved", "rejected"]),
  by: z.string(),
  comment: z.string().optional(),
});
