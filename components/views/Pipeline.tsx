"use client";
import { useState } from "react";
import { useData } from "@/lib/data";
import { STEPS } from "@/lib/contract";
import { GATE_LABEL, STATUS_LABEL, STEP_LABEL, STEP_TOOL } from "@/lib/types";
import { jobPercent } from "@/lib/progress";
import { ago } from "@/lib/format";
import { Avatar, Bar, Head, Pill } from "../ui";
import { GateActions } from "../Gate";

export function Pipeline({ q, notify }: { q: string; notify: (m: string) => void }) {
  const { jobs } = useData();
  const [f, setF] = useState<"all" | "running" | "waiting" | "done">("all");
  const list = jobs.filter((j) => (!q || j.handle.includes(q.toLowerCase())) && (f === "all" || (f === "running" ? j.status === "running" || j.status === "queued" : f === "waiting" ? j.status === "waiting_human" : j.status === "done")));
  return (
    <>
      <Head title={<span className="grad">Pipeline</span>} sub="Plusieurs créateurs avancent en parallèle, chacun à son étape. Les cartes ambre attendent une personne.">
        <div className="seg" role="group" aria-label="Filtre">
          {([["all", "Tous"], ["running", "En cours"], ["waiting", "À valider"], ["done", "Terminés"]] as const).map(([k, l]) => <button key={k} aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>)}
        </div>
      </Head>
      <div className="kb">
        {STEPS.map((s) => {
          const items = list.filter((j) => j.step === s);
          return (
            <section key={s} className={`col ${items.length ? "on" : ""}`} aria-label={STEP_LABEL[s]}>
              <h3><i />{STEP_LABEL[s]}<span>{items.length}</span></h3>
              <div className="tool">{STEP_TOOL[s]}</div>
              {items.map((j) => (
                <article key={j.id} className={`kc ${j.status === "waiting_human" ? "wait" : j.status === "error" ? "err" : ""}`}>
                  <div className="who"><Avatar name={j.handle} size={30} />@{j.handle}</div>
                  <Bar pct={jobPercent(j)} tone={j.status === "waiting_human" ? "wa" : ""} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <Pill tone={j.status === "done" ? "ok" : j.status === "waiting_human" ? "wa" : j.status === "error" ? "bad" : "ac"}>{STATUS_LABEL[j.status] ?? j.status}</Pill>
                    <small>{ago(j.updated_at)}</small>
                  </div>
                  <small>{j.status === "waiting_human" ? GATE_LABEL[j.gate ?? ""] ?? j.message : j.message}</small>
                  {j.status === "waiting_human" && <GateActions jobId={j.id} notify={notify} />}
                </article>
              ))}
              {!items.length && <p style={{ color: "var(--mu)", fontSize: ".8rem", margin: "8px 4px" }}>Aucun créateur à cette étape</p>}
            </section>
          );
        })}
      </div>
    </>
  );
}
