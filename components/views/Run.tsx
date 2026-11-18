"use client";
import { useEffect, useState } from "react";
import { useData } from "@/lib/data";
import { STEPS } from "@/lib/contract";
import { GATE_LABEL, STEP_LABEL, STEP_TOOL } from "@/lib/types";
import { jobPercent } from "@/lib/progress";
import { ago } from "@/lib/format";
import { Avatar, Card, Empty, Head, Pill } from "../ui";
import { Ring } from "../charts";
import { Icon } from "../Icons";
import { GateActions } from "../Gate";
import type { View } from "../Shell";

export function Run({ go, notify }: { go: (v: View) => void; notify: (m: string) => void }) {
  const { jobs, creators, call } = useData();
  const [url, setUrl] = useState("");
  const [pick, setPick] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<string>("");
  const job = jobs.find((j) => j.id === sel) ?? jobs[0];
  useEffect(() => { if (!sel && jobs[0]) setSel(jobs[0].id); }, [jobs, sel]);
  const ready = creators.filter((c) => c.accord === "signe");

  async function launch() {
    const profile_url = url || (pick ? `https://instagram.com/${pick}` : "");
    setBusy(true); setMsg("");
    const r = await call("/api/jobs", { profile_url });
    setBusy(false);
    if (r.ok) { setUrl(""); setPick(""); if (r.data?.job_id) setSel(r.data.job_id); notify("Extraction lancée"); }
    else setMsg(r.error ?? "Échec");
  }
  const idx = job ? STEPS.indexOf(job.step) : -1;

  return (
    <>
      <Head title={<>Nouvelle <span className="grad">extraction</span></>} sub="Un lien en entrée, un ebook prêt à valider en sortie. Vous gardez la main sur les trois validations." />
      <Card className="hero" style={{ marginBottom: 16 }}>
        <span className="lbl">Étape 1 · Déclencheur</span>
        <h2 style={{ margin: "6px 0 14px", fontSize: "1.4rem" }}>Lien du compte Instagram du créateur</h2>
        <div className="launch">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://instagram.com/nom-du-createur" aria-label="Lien du compte" />
          <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Créateur avec accord signé"><option value="">…ou un créateur avec accord signé</option>{ready.map((c) => <option key={c.id} value={c.handle}>@{c.handle}</option>)}</select>
          <button className="btn white" disabled={busy || (!url && !pick)} onClick={launch}><Icon n="bolt" size={17} /> Lancer</button>
        </div>
        {msg && <p className="msg err">{msg} {/accord/i.test(msg) && <button className="btn white sm" style={{ marginLeft: 8 }} onClick={() => go("creators")}>Ouvrir Créateurs</button>}</p>}
        <p className="msg okk" style={{ opacity: .85, fontWeight: 500 }}>Sécurité : l'app refuse de lancer tant que l'accord écrit du créateur n'est pas enregistré.</p>
      </Card>

      {!job ? <Card><Empty icon="run" title="Aucun traitement" text="Lancez une extraction : les étapes apparaîtront ici en direct." /></Card> : (
        <div className="grid gmain">
          <Card>
            <div className="run">
              <Ring pct={jobPercent(job)} />
              <div>
                <div className="who"><Avatar name={job.handle} size={40} /><div>@{job.handle}<small>{job.status === "waiting_human" ? "Votre validation est attendue" : job.message || "Traitement en cours"} · {ago(job.updated_at)}</small></div></div>
                {jobs.length > 1 && <div className="acts" style={{ marginTop: 12 }}>{jobs.slice(0, 5).map((j) => <button key={j.id} className={`btn sm ${j.id === job.id ? "" : "ghost"}`} onClick={() => setSel(j.id)}>@{j.handle}</button>)}</div>}
              </div>
            </div>
            <div className="steps">
              {STEPS.map((s, i) => {
                const cls = job.status === "error" && i === idx ? "err" : i < idx || (i === idx && job.status === "done") ? "done" : i === idx ? (job.status === "waiting_human" ? "wait" : "now") : "";
                return (
                  <div key={s} className={`stp ${cls}`}>
                    <span className="dotn">{cls === "done" ? <Icon n="check" size={14} sw={3} /> : cls === "err" ? <Icon n="x" size={14} sw={3} /> : i + 1}</span>
                    <div className="nm">{STEP_LABEL[s]}<small>{i === idx && job.status !== "done" ? (job.progress ? `${job.progress.done} / ${job.progress.total}` : job.message) : STEP_TOOL[s]}</small></div>
                    {i === idx && job.status === "waiting_human" ? <Pill tone="wa">À valider</Pill> : i === idx && job.status === "error" ? <Pill tone="bad">Erreur</Pill> : <Pill tone={cls === "done" ? "ok" : cls === "now" ? "ac" : ""}>{STEP_TOOL[s].split(" ")[0]}</Pill>}
                  </div>
                );
              })}
            </div>
          </Card>
          <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
            {job.status === "waiting_human" && <Card color="var(--wa)"><h2>À vous de décider</h2><p style={{ margin: "0 0 12px", color: "var(--mu)" }}><b style={{ color: "var(--ink)" }}>{GATE_LABEL[job.gate ?? ""] ?? "Validation attendue"}</b><br />n8n est en pause et reprend dès votre réponse.</p><GateActions jobId={job.id} notify={notify} /></Card>}
            <Card><h2>Les 3 portes humaines</h2>
              <div className="todo">{[["Plan", "Le créateur valide le plan du livre"], ["Contrôle", "Un associé relit le brouillon et le rapport"], ["Validation", "Le créateur valide par écrit la version finale"]].map(([t, d], i) => <div className="t" key={t}><span className="ico ac"><b>{i + 1}</b></span><div className="grow"><b>{t}</b><small>{d}</small></div></div>)}</div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
