"use client";
import { useState } from "react";
import { useData } from "@/lib/data";
import { Icon } from "./Icons";

// Boutons de décision à une porte humaine (Valider / Refuser avec motif).
export function GateActions({ jobId, notify }: { jobId: string; notify: (m: string) => void }) {
  const { call } = useData();
  const [busy, setBusy] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const [why, setWhy] = useState("");

  async function send(decision: "approved" | "rejected") {
    setBusy(true);
    const r = await call(`/api/jobs/${jobId}/decision`, { decision, comment: decision === "rejected" ? why : undefined });
    setBusy(false);
    if (r.ok) { setRefusing(false); setWhy(""); notify(decision === "approved" ? "Validé : n8n reprend le travail" : "Refus enregistré"); }
    else notify(r.error ?? "Échec");
  }
  if (refusing) return (
    <div className="acts" style={{ display: "grid", gap: 8 }}>
      <input className="fld" style={{ padding: "10px 12px", border: "1px solid var(--ln)", borderRadius: 12, background: "var(--sf2)" }} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Pourquoi ? (visible par les associés)" aria-label="Motif du refus" />
      <div className="acts"><button className="btn bad sm" disabled={busy} onClick={() => send("rejected")}>Confirmer le refus</button><button className="btn ghost sm" onClick={() => setRefusing(false)}>Annuler</button></div>
    </div>
  );
  return (
    <div className="acts">
      <button className="btn sm" disabled={busy} onClick={() => send("approved")}><Icon n="check" size={15} sw={2.4} /> Valider</button>
      <button className="btn ghost sm" disabled={busy} onClick={() => setRefusing(true)}>Refuser</button>
    </div>
  );
}
