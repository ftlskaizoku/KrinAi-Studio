// Vérifie le faux n8n de bout en bout, sans l'app : un petit récepteur joue le rôle de l'app.
process.env.FAKE_DELAY_MS ??= "20";
await import("./server.mjs");
import http from "node:http";
const SECRET = process.env.N8N_SHARED_SECRET || "dev-secret";
const seen = [];
http.createServer((req, res) => {
  let s = ""; req.on("data", (c) => (s += c)); req.on("end", () => {
    const e = JSON.parse(s); seen.push(`${e.step}:${e.status}`); res.end("{}");
    if (e.status === "waiting_human")
      fetch(e.waiting_for.resume_url, { method: "POST", headers: { "x-krinai-secret": SECRET }, body: JSON.stringify({ decision: "approved", by: "test" }) });
    if (e.step === "en_vente" && e.status === "done") {
      const gates = seen.filter((x) => x.endsWith("waiting_human")).length;
      console.log(gates === 3 ? "OK : 3 portes franchies, ebook prêt" : "ÉCHEC : portes = " + gates);
      process.exit(gates === 3 ? 0 : 1);
    }
  });
}).listen(3100);
setTimeout(() => { console.log("ÉCHEC : délai dépassé"); process.exit(1); }, 20000);
await fetch(`http://localhost:${process.env.PORT || 4000}/webhook/krinai-job`, {
  method: "POST", headers: { "x-krinai-secret": SECRET, "content-type": "application/json" },
  body: JSON.stringify({ job_id: "test1", callback_url: "http://localhost:3100/events", options: { limit: 3 } }),
});
