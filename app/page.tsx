"use client";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { getAuthClient, getDb } from "@/lib/firebaseClient";

type Job = { id: string; handle: string; step: string; status: string; message: string; gate?: string | null; progress?: { done: number; total: number } | null };
const STATUS: Record<string, string> = { queued: "En file", running: "En cours", done: "Terminé", error: "Erreur", waiting_human: "Votre validation est attendue" };

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => onAuthStateChanged(getAuthClient(), setUser), []);
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(collection(getDb(), "jobs"), orderBy("created_at", "desc"), limit(20)),
      (s) => setJobs(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Job)),
      (e) => setMsg("Accès refusé : " + e.message),
    );
  }, [user]);

  async function post(path: string, body: object) {
    const token = await user!.getIdToken();
    const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? "" : j.error ?? `Erreur ${r.status}`);
  }

  if (!user) return <main><h1>KrinAi Studio</h1><p className="mu">Réservé aux trois associés.</p>
    <button onClick={() => signInWithPopup(getAuthClient(), new GoogleAuthProvider())}>Connexion avec Google</button></main>;

  return <main>
    <h1>KrinAi Studio</h1>
    <p className="mu">{user.email} · <a href="#" onClick={(e) => { e.preventDefault(); signOut(getAuthClient()); }}>Déconnexion</a></p>
    <div className="card">
      <b>Nouvelle extraction</b>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://instagram.com/nom-du-createur" aria-label="Lien du compte" />
      <button onClick={() => post("/api/jobs", { profile_url: url })}>Lancer</button>
      {msg && <p className="err">{msg}</p>}
    </div>
    <h2>Pipeline</h2>
    {jobs.length === 0 && <p className="mu">Aucun job pour le moment.</p>}
    {jobs.map((j) => <div className="card" key={j.id}>
      <b>@{j.handle}</b> · <span className="mu">{j.step}</span> · {STATUS[j.status] ?? j.status}
      {j.progress && <div className="bar"><i style={{ width: (j.progress.done / j.progress.total) * 100 + "%" }} /></div>}
      <div className="mu">{j.message}</div>
      {j.status === "waiting_human" && <div>
        <button onClick={() => post(`/api/jobs/${j.id}/decision`, { decision: "approved" })}>Valider</button>{" "}
        <button className="alt" onClick={() => post(`/api/jobs/${j.id}/decision`, { decision: "rejected", comment: prompt("Pourquoi ?") ?? "" })}>Refuser</button>
      </div>}
    </div>)}
  </main>;
}
