import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebaseAdmin";
import { requireTeam } from "@/lib/auth";
import { JobRequest } from "@/lib/contract";

// Chemins Instagram qui ne sont pas des comptes (publications, reels, stories...).
const RESERVED = new Set(["p", "reel", "reels", "stories", "explore", "tv", "accounts", "direct"]);
// Un job "en cours" sans nouvelle depuis 6 h est considéré perdu et ne bloque plus un nouveau lancement.
const STALE_MS = 6 * 3600 * 1000;

export async function POST(req: Request) {
  let email: string;
  try { email = await requireTeam(req); } catch (r) { return r as Response; }

  // Un seul geste : coller le lien du compte du créateur. Son accord est obtenu avant, hors de l'app :
  // l'app ne le vérifie plus et lance directement.
  const { profile_url, niche } = await req.json().catch(() => ({}));
  const m = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(typeof profile_url === "string" ? profile_url : "");
  const handle = m?.[1].toLowerCase();
  if (!handle || /^\.+$/.test(handle) || RESERVED.has(handle)) {
    return Response.json({ error: "Collez le lien du compte du créateur (instagram.com/nom-du-createur)." }, { status: 400 });
  }
  const url = `https://www.instagram.com/${handle}/`;

  // Les données du créateur sont enregistrées (créées au premier lancement, niche mise à jour si fournie).
  const cref = db.doc(`creators/${handle}`);
  const snap = await cref.get();
  const known = snap.data() ?? {};
  const nicheValue: string = typeof niche === "string" && niche ? niche : (known.niche ?? "");
  if (!snap.exists) {
    await cref.set({ handle, profile_url: url, niche: nicheValue, added_by: email, created_at: FieldValue.serverTimestamp() });
  } else if (nicheValue !== (known.niche ?? "")) {
    await cref.update({ niche: nicheValue });
  }

  // Évite de payer deux fois le même travail : pas de nouveau job tant qu'un autre est actif pour ce créateur.
  const same = await db.collection("jobs").where("creator_id", "==", handle).get();
  const blocking = same.docs.find((d) => {
    const j = d.data();
    if (j.status === "waiting_human") return true; // en attente d'une personne : peut durer des jours
    if (j.status === "queued" || j.status === "running") return Date.now() - (j.updated_at?.toMillis?.() ?? 0) < STALE_MS;
    return false;
  });
  if (blocking) {
    return Response.json({ error: "Un job est déjà en cours pour ce créateur.", job_id: blocking.id }, { status: 409 });
  }

  const jobRef = db.collection("jobs").doc();
  await jobRef.set({
    creator_id: handle, handle, step: "extraction", status: "queued", progress: null, message: "", gate: null,
    requested_by: email, created_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp(),
  });

  const payload = JobRequest.parse({
    job_id: jobRef.id, type: "extraction",
    creator: { id: handle, handle, profile_url: url, niche: nicheValue },
    options: { limit: 20, language: "fr" },
    source: { mode: "profile", urls: [] },
    callback_url: `${process.env.APP_URL}/api/n8n/events`,
    requested_by: email,
  });

  try {
    // ORCH_WEBHOOK_URL = adresse complète (Activepieces : https://hôte/api/v1/webhooks/IDENTIFIANT). À défaut : n8n.
    const target = process.env.ORCH_WEBHOOK_URL || `${process.env.N8N_URL}/webhook/krinai-job`;
    const r = await fetch(target, {
      method: "POST",
      headers: { "content-type": "application/json", "x-krinai-secret": process.env.N8N_SHARED_SECRET! },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`l'orchestrateur a répondu ${r.status}`);
  } catch (err: any) {
    await jobRef.update({ status: "error", message: `Orchestrateur injoignable : ${err.message}` });
    return Response.json({ error: "Orchestrateur injoignable. Le job est marqué en erreur." }, { status: 502 });
  }
  return Response.json({ job_id: jobRef.id }, { status: 202 });
}
