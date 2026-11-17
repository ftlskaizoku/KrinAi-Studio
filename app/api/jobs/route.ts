import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";
import { requireTeam } from "@/lib/auth";
import { JobRequest } from "@/lib/contract";

export async function POST(req: Request) {
  let email: string;
  try { email = await requireTeam(req); } catch (r) { return r as Response; }

  const { profile_url, niche } = await req.json().catch(() => ({}));
  const m = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(profile_url ?? "");
  const handle = m?.[1].toLowerCase();
  if (!handle || /^\.+$/.test(handle)) return Response.json({ error: "Lien Instagram invalide" }, { status: 400 });

  // Porte 0 : pas de job sans accord signé.
  const cref = db.doc(`creators/${handle}`);
  const snap = await cref.get();
  if (!snap.exists) {
    await cref.set({ handle, profile_url, niche: niche ?? "", accord: "aucun", added_by: email, created_at: FieldValue.serverTimestamp() });
  }
  if (snap.data()?.accord !== "signe") {
    return Response.json({ error: "Accord signé requis : enregistrez l'accord du créateur avant de lancer." }, { status: 409 });
  }

  const jobRef = db.collection("jobs").doc();
  await jobRef.set({
    creator_id: handle, handle, step: "extraction", status: "queued", progress: null, message: "", gate: null,
    requested_by: email, created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
  });

  const payload = JobRequest.parse({
    job_id: jobRef.id, type: "extraction",
    creator: { id: handle, handle, profile_url, niche: snap.data()?.niche ?? "" },
    options: { limit: 20, language: "fr" },
    callback_url: `${process.env.APP_URL}/api/n8n/events`,
    requested_by: email,
  });

  try {
    const r = await fetch(`${process.env.N8N_URL}/webhook/krinai-job`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-krinai-secret": process.env.N8N_SHARED_SECRET! },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`n8n a répondu ${r.status}`);
  } catch (err: any) {
    await jobRef.update({ status: "error", message: `n8n injoignable : ${err.message}` });
    return Response.json({ error: "n8n injoignable. Le job est marqué en erreur." }, { status: 502 });
  }
  return Response.json({ job_id: jobRef.id }, { status: 202 });
}
