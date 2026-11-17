import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";
import { requireTeam } from "@/lib/auth";
import { Decision } from "@/lib/contract";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let email: string;
  try { email = await requireTeam(req); } catch (r) { return r as Response; }
  const { id } = await params;

  const body = Decision.safeParse({ ...(await req.json().catch(() => ({}))), by: email });
  if (!body.success) return Response.json({ error: "Décision invalide" }, { status: 400 });

  const job = db.doc(`jobs/${id}`);
  const gate = await job.collection("private").doc("gate").get();
  if (!gate.exists) return Response.json({ error: "Aucune validation en attente pour ce job" }, { status: 409 });

  const r = await fetch(gate.data()!.resume_url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-krinai-secret": process.env.N8N_SHARED_SECRET! },
    body: JSON.stringify(body.data),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!r?.ok) return Response.json({ error: "n8n n'a pas pu reprendre le job" }, { status: 502 });

  // Trace de la validation : qui, quand, quelle porte.
  await job.collection("decisions").add({ ...body.data, gate: gate.data()!.gate, at: FieldValue.serverTimestamp() });
  await gate.ref.delete();
  await job.update({ status: "running", gate: null, updated_at: FieldValue.serverTimestamp() });
  return Response.json({ ok: true });
}
