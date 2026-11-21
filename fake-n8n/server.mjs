// Faux orchestrateur : imite n8n OU Activepieces pour tester l'app sans eux. Zéro dépendance.
//   FAKE_MODE=n8n          (défaut) une seule resume_url qui reçoit la décision en JSON (POST)
//   FAKE_MODE=activepieces deux liens d'approbation, approuver / refuser (GET ?action=...)
import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = process.env.PORT || 4000;
const SECRET = process.env.N8N_SHARED_SECRET || "dev-secret";
const DELAY = Number(process.env.FAKE_DELAY_MS || 800);
const MODE = process.env.FAKE_MODE === "activepieces" ? "activepieces" : "n8n";
const waits = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const file = (id, name) => `http://localhost:${PORT}/files/${id}/${name}`;

async function send(cb, job_id, step, status, extra = {}) {
  const body = { event_id: randomUUID(), job_id, step, status, artifacts: [], ...extra };
  const r = await fetch(cb, { method: "POST", headers: { "content-type": "application/json", "x-krinai-secret": SECRET }, body: JSON.stringify(body) });
  console.log(`[faux-orchestrateur:${MODE}] ${step} ${status} -> ${r.status}`);
  if (!r.ok) console.log(await r.text());
}

async function pause(cb, id, step, gate, artifact) {
  const base = `http://localhost:${PORT}/resume/${id}`;
  const waiting_for = MODE === "activepieces"
    ? { gate, resume_urls: { approve: `${base}?action=approve`, reject: `${base}?action=reject` } }
    : { gate, resume_url: base };
  await send(cb, id, step, "waiting_human", { message: "En attente de validation", waiting_for, artifacts: [artifact] });
  const d = await new Promise((res) => waits.set(id, res));
  if (d.decision !== "approved") { await send(cb, id, step, "error", { message: `Refusé : ${d.comment ?? ""}` }); return false; }
  return true;
}

async function run({ job_id: id, callback_url: cb, options, source }) {
  console.log(`[faux-orchestrateur:${MODE}] job ${id}, source: ${source?.mode ?? "non précisée"}`);
  const total = options?.limit ?? 20;
  const step = async (name, msg, extra = {}) => { await send(cb, id, name, "running", { message: msg }); await sleep(DELAY); await send(cb, id, name, "done", extra); };
  await step("extraction", "Collecte des contenus");
  for (let i = 1; i <= total; i++) { await send(cb, id, "transcription", "running", { progress: { done: i, total }, message: `Vidéo ${i} sur ${total} transcrite` }); await sleep(DELAY / 4); }
  await send(cb, id, "transcription", "done");
  await step("fiches", "Fiches de connaissances");
  if (!(await pause(cb, id, "plan", "plan_valide_par_createur", { type: "plan", url: file(id, "plan-v1.md"), version: "v1" }))) return;
  await step("redaction", "Rédaction des chapitres");
  if (!(await pause(cb, id, "controle", "relecture_associe", { type: "draft", url: file(id, "manuscrit-v1.md"), version: "v1" }))) return;
  await step("mise_en_page", "Export PDF et EPUB");
  if (!(await pause(cb, id, "validation", "validation_ecrite_createur", { type: "pdf", url: file(id, "ebook-final-v1.pdf"), version: "v1" }))) return;
  await send(cb, id, "en_vente", "done", { message: "Prêt pour la mise en vente" });
}

const readJson = (req) => new Promise((ok) => { let s = ""; req.on("data", (c) => (s += c)); req.on("end", () => { try { ok(JSON.parse(s)); } catch { ok(null); } }); });

http.createServer(async (req, res) => {
  const u = new URL(req.url || "/", "http://x");
  const reply = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
  if (req.method === "POST" && u.pathname === "/webhook/krinai-job") {
    if (req.headers["x-krinai-secret"] !== SECRET) return reply(401, { error: "secret invalide" });
    const job = await readJson(req);
    if (!job?.job_id || !job?.callback_url) return reply(400, { error: "job non conforme" });
    reply(202, { accepted: true });
    run(job).catch((e) => console.error("[faux-orchestrateur] erreur", e));
    return;
  }
  const m = /^\/resume\/(.+)$/.exec(u.pathname);
  if (m) { // les adresses de reprise sont inventées et ne portent pas de secret, comme les vraies
    const resolve = waits.get(m[1]);
    if (!resolve) return reply(404, { error: "rien en attente" });
    const body = (req.method === "POST" ? await readJson(req) : null) ?? {};
    const action = u.searchParams.get("action");
    const decision = body.decision ?? (action === "approve" ? "approved" : action === "reject" ? "rejected" : undefined);
    waits.delete(m[1]); resolve({ decision, comment: body.comment ?? u.searchParams.get("comment") ?? "" });
    return reply(200, { ok: true });
  }
  reply(404, { error: "inconnu" });
}).listen(PORT, () => console.log(`[faux-orchestrateur:${MODE}] en écoute sur http://localhost:${PORT}`));
