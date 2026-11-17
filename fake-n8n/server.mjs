// Faux n8n : imite le vrai pour tester l'app sans n8n ni LLM. Zéro dépendance.
import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = process.env.PORT || 4000;
const SECRET = process.env.N8N_SHARED_SECRET || "dev-secret";
const DELAY = Number(process.env.FAKE_DELAY_MS || 800);
const waits = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function send(cb, job_id, step, status, extra = {}) {
  const body = { event_id: randomUUID(), job_id, step, status, artifacts: [], ...extra };
  const r = await fetch(cb, { method: "POST", headers: { "content-type": "application/json", "x-krinai-secret": SECRET }, body: JSON.stringify(body) });
  console.log(`[fake-n8n] ${step} ${status} -> ${r.status}`);
  if (!r.ok) console.log(await r.text());
}

async function pause(cb, id, step, gate) {
  await send(cb, id, step, "waiting_human", { message: "En attente de validation", waiting_for: { gate, resume_url: `http://localhost:${PORT}/resume/${id}` } });
  const d = await new Promise((res) => waits.set(id, res));
  if (d.decision !== "approved") { await send(cb, id, step, "error", { message: `Refusé : ${d.comment ?? ""}` }); return false; }
  return true;
}

async function run({ job_id: id, callback_url: cb, options }) {
  const total = options?.limit ?? 20;
  const step = async (name, msg) => { await send(cb, id, name, "running", { message: msg }); await sleep(DELAY); await send(cb, id, name, "done"); };
  await step("extraction", "Collecte des contenus");
  for (let i = 1; i <= total; i++) { await send(cb, id, "transcription", "running", { progress: { done: i, total }, message: `Vidéo ${i} sur ${total} transcrite` }); await sleep(DELAY / 4); }
  await send(cb, id, "transcription", "done");
  await step("fiches", "Fiches de connaissances");
  if (!(await pause(cb, id, "plan", "plan_valide_par_createur"))) return;
  await step("redaction", "Rédaction des chapitres");
  if (!(await pause(cb, id, "controle", "relecture_associe"))) return;
  await step("mise_en_page", "Export PDF et EPUB");
  if (!(await pause(cb, id, "validation", "validation_ecrite_createur"))) return;
  await send(cb, id, "en_vente", "done", { message: "Prêt pour la mise en vente" });
}

const readJson = (req) => new Promise((ok) => { let s = ""; req.on("data", (c) => (s += c)); req.on("end", () => { try { ok(JSON.parse(s)); } catch { ok(null); } }); });

http.createServer(async (req, res) => {
  const reply = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
  if (req.headers["x-krinai-secret"] !== SECRET) return reply(401, { error: "secret invalide" });
  if (req.method === "POST" && req.url === "/webhook/krinai-job") {
    const job = await readJson(req);
    if (!job?.job_id || !job?.callback_url) return reply(400, { error: "job non conforme" });
    reply(202, { accepted: true });
    run(job).catch((e) => console.error("[fake-n8n] erreur", e));
    return;
  }
  const m = /^\/resume\/(.+)$/.exec(req.url || "");
  if (req.method === "POST" && m) {
    const resolve = waits.get(m[1]);
    if (!resolve) return reply(404, { error: "rien en attente" });
    waits.delete(m[1]); resolve((await readJson(req)) ?? {}); return reply(200, { ok: true });
  }
  reply(404, { error: "inconnu" });
}).listen(PORT, () => console.log(`[fake-n8n] en écoute sur http://localhost:${PORT}`));
