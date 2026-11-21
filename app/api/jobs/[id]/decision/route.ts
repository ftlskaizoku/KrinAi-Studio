import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";
import { requireTeam } from "@/lib/auth";
import { Decision } from "@/lib/contract";

// Quel livrable est relu à chaque porte (clé dans job.artifacts).
const REVIEWED: Record<string, string> = { plan_valide_par_createur: "plan", relecture_associe: "draft", validation_ecrite_createur: "pdf" };

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let email: string;
  try { email = await requireTeam(req); } catch (r) { return r as Response; }
  const { id } = await params;

  const body = Decision.safeParse({ ...(await req.json().catch(() => ({}))), by: email });
  if (!body.success) return Response.json({ error: "Décision invalide" }, { status: 400 });

  const job = db.doc(`jobs/${id}`);
  const gateSnap = await job.collection("private").doc("gate").get();
  if (!gateSnap.exists) return Response.json({ error: "Aucune validation en attente pour ce job" }, { status: 409 });
  const g = gateSnap.data()!;

  // Adresse relue : celle que l'orchestrateur a livrée pour cette porte, sauf si l'interface en fournit une.
  const jobData = (await job.get()).data() ?? {};
  const reviewed: string | null = body.data.reviewed_artifact_url ?? jobData.artifacts?.[REVIEWED[g.gate] ?? ""] ?? null;
  const payload = { ...body.data, gate: g.gate, reviewed_artifact_url: reviewed };

  let r: Response | null;
  const secret = process.env.N8N_SHARED_SECRET ?? "";
  if (g.resume_urls) {
    // Liens d'approbation : une adresse par choix. Méthode GET par défaut (RESUME_URLS_METHOD=POST pour changer).
    const u = new URL(payload.decision === "approved" ? g.resume_urls.approve : g.resume_urls.reject);
    u.searchParams.set("by", email);
    if (payload.comment) u.searchParams.set("comment", payload.comment);
    const post = process.env.RESUME_URLS_METHOD === "POST";
    r = await fetch(u, {
      method: post ? "POST" : "GET",
      headers: post ? { "content-type": "application/json", "x-krinai-secret": secret } : { "x-krinai-secret": secret },
      body: post ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
  } else {
    r = await fetch(g.resume_url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-krinai-secret": secret },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
  }
  if (!r?.ok) return Response.json({ error: "L'orchestrateur n'a pas pu reprendre le job" }, { status: 502 });

  // Trace de la validation : qui, quand, quelle porte, quelle adresse relue.
  await job.collection("decisions").add({ ...payload, at: FieldValue.serverTimestamp() });
  await gateSnap.ref.delete();
  await job.update({ status: "running", gate: null, updated_at: FieldValue.serverTimestamp() });
  return Response.json({ ok: true });
}
