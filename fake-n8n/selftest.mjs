// Vérifie le faux orchestrateur de bout en bout, sans l'app : un petit récepteur joue le rôle de l'app.
//   node fake-n8n/selftest.mjs                      n8n, tout approuvé
//   FAKE_MODE=activepieces node fake-n8n/selftest.mjs   liens approuver / refuser
//   REJECT=1 node fake-n8n/selftest.mjs             refus à la première porte
process.env.FAKE_DELAY_MS ??= "20";
await import("./server.mjs");
import http from "node:http";
const SECRET = process.env.N8N_SHARED_SECRET || "dev-secret";
const REJECT = process.env.REJECT === "1";
const seen = [], artifacts = new Set();
const finish = (ok, msg) => { console.log((ok ? "OK : " : "ÉCHEC : ") + msg); process.exit(ok ? 0 : 1); };
http.createServer((req, res) => {
  let s = ""; req.on("data", (c) => (s += c)); req.on("end", async () => {
    const e = JSON.parse(s); seen.push(`${e.step}:${e.status}`); res.end("{}");
    for (const a of e.artifacts ?? []) artifacts.add(a.type);
    if (e.status === "waiting_human") {
      const w = e.waiting_for, approve = !REJECT;
      if (w.resume_urls) await fetch(approve ? w.resume_urls.approve : w.resume_urls.reject);
      else await fetch(w.resume_url, { method: "POST", headers: { "x-krinai-secret": SECRET }, body: JSON.stringify({ decision: approve ? "approved" : "rejected", by: "test", comment: "test" }) });
    }
    if (REJECT && e.status === "error") finish(seen.filter((x) => x.endsWith("waiting_human")).length === 1, "refus à la porte 1, job en erreur");
    if (e.step === "en_vente" && e.status === "done") {
      const gates = seen.filter((x) => x.endsWith("waiting_human")).length;
      const okArt = ["plan", "draft", "pdf"].every((t) => artifacts.has(t));
      finish(gates === 3 && okArt, `${gates} portes franchies, livrables reçus : ${[...artifacts].join(", ")}`);
    }
  });
}).listen(3100);
setTimeout(() => finish(false, "délai dépassé"), 20000);
await fetch(`http://localhost:${process.env.PORT || 4000}/webhook/krinai-job`, {
  method: "POST", headers: { "x-krinai-secret": SECRET, "content-type": "application/json" },
  body: JSON.stringify({ job_id: "test1", callback_url: "http://localhost:3100/events", options: { limit: 3 }, source: { mode: "profile", urls: [] } }),
});
