import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";
import { checkSecret } from "@/lib/auth";
import { JobEvent } from "@/lib/contract";

export async function POST(req: Request) {
  if (!checkSecret(req)) return Response.json({ error: "Secret invalide" }, { status: 401 });

  const parsed = JobEvent.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Message non conforme au contrat", details: parsed.error.flatten() }, { status: 400 });
  }
  const e = parsed.data;
  const job = db.doc(`jobs/${e.job_id}`);
  if (!(await job.get()).exists) return Response.json({ error: "Job inconnu" }, { status: 404 });

  // Un même événement reçu deux fois n'est traité qu'une fois.
  try {
    await job.collection("events").doc(e.event_id).create({
      ...e, waiting_for: e.waiting_for ? { gate: e.waiting_for.gate } : null, at: FieldValue.serverTimestamp(),
    });
  } catch (err: any) {
    if (err.code === 6) return Response.json({ duplicate: true });
    throw err;
  }

  // Derniers livrables par type (plan, draft, pdf...), pour les relire et tracer ce qui a été validé.
  const artifactFields: Record<string, string> = {};
  for (const a of e.artifacts) artifactFields[`artifacts.${a.type.replace(/[^A-Za-z0-9_]/g, "_")}`] = (a.url ?? a.path)!;

  await job.update({
    step: e.step, status: e.status, progress: e.progress ?? null, message: e.message ?? "",
    gate: e.waiting_for?.gate ?? null, updated_at: FieldValue.serverTimestamp(), ...artifactFields,
  });
  // L'adresse de reprise reste côté serveur (jamais lisible depuis le navigateur).
  if (e.waiting_for) await job.collection("private").doc("gate").set(e.waiting_for);
  return Response.json({ ok: true });
}
