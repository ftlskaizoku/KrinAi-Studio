import { STEPS } from "./contract";
import type { Job } from "./types";

// Avancement global d'un job en pourcentage, à partir de l'étape courante et de son état.
export function jobPercent(j: Job): number {
  const i = STEPS.indexOf(j.step);
  if (i < 0) return 0;
  if (j.step === "en_vente" && j.status === "done") return 100;
  let within = 0;
  if (j.status === "done") within = 1;
  else if (j.progress && j.progress.total > 0) within = Math.min(1, j.progress.done / j.progress.total) * 0.9;
  else if (j.status === "running" || j.status === "waiting_human") within = 0.5;
  return Math.round(((i + within) / STEPS.length) * 100);
}
export const isActive = (j: Job) => j.status !== "done" && j.status !== "error";
