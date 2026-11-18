"use client";
import { useCallback, useEffect, useState } from "react";
import { useData } from "@/lib/data";
import { Icon, Logo } from "./Icons";
import { Avatar } from "./ui";
import { Dashboard } from "./views/Dashboard";
import { Run } from "./views/Run";
import { Creators } from "./views/Creators";
import { Pipeline } from "./views/Pipeline";
import { Ebooks } from "./views/Ebooks";
import { Sales } from "./views/Sales";

export type View = "dash" | "run" | "creators" | "pipeline" | "ebooks" | "sales";
const NAV: [View, string, string][] = [["dash", "dash", "Tableau de bord"], ["run", "run", "Nouvelle extraction"], ["creators", "cre", "Créateurs"], ["pipeline", "pip", "Pipeline"], ["ebooks", "ebk", "Ebooks"], ["sales", "ven", "Ventes et gains"]];
const TEAM = [["Aboubakrine", "App et prospection"], ["Mbengue", "Contenu et LLM locaux"], ["Zoum", "n8n et automatisations"]];

export function Shell() {
  const { email, demo, jobs, error, logout } = useData();
  const [view, setView] = useState<View>("dash");
  const [q, setQ] = useState("");
  const [toast, setToast] = useState("");
  const [light, setLight] = useState<boolean | null>(null);

  const notify = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(""), 3200); }, []);
  const go = useCallback((v: View) => { setView(v); try { history.replaceState(null, "", `#${v}`); } catch {} window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const h = location.hash.slice(1) as View;
    if (NAV.some((n) => n[0] === h)) setView(h);
    try { const t = localStorage.getItem("krinai-theme"); if (t) setLight(t === "light"); } catch {}
  }, []);
  useEffect(() => {
    const r = document.documentElement;
    if (light === null) r.removeAttribute("data-theme"); else r.setAttribute("data-theme", light ? "light" : "dark");
    try { if (light !== null) localStorage.setItem("krinai-theme", light ? "light" : "dark"); } catch {}
  }, [light]);

  const waiting = jobs.filter((j) => j.status === "waiting_human").length;
  const name = demo ? "Aboubakrine" : (email ?? "").split("@")[0].replace(/^./, (c) => c.toUpperCase());
  const dark = light === null ? (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) : !light;

  return (
    <div className="shell">
      <aside className="side"><div className="sb">
        <div className="brand"><Logo /><span>KrinAi <b>Studio</b></span></div>
        <nav className="nav" aria-label="Menu principal">
          <span className="lbl" style={{ padding: "6px 12px" }}>Menu</span>
          {NAV.map(([k, ic, l]) => (
            <button key={k} aria-current={view === k ? "page" : undefined} onClick={() => go(k)}>
              <Icon n={ic} />{l}{k === "pipeline" && waiting > 0 && <span className="badge">{waiting}</span>}
            </button>
          ))}
        </nav>
        <div className="team"><span className="lbl">Les 3 associés</span>
          <ul>{TEAM.map(([n, r]) => <li key={n}><Avatar name={n} size={30} /><span>{n}<small>{r}</small></span></li>)}</ul>
        </div>
        <div className="me"><Avatar name={name || "KS"} size={38} /><div><b>{name}</b><small>{email}</small></div>
          <button className="iconbtn" onClick={logout} aria-label="Se déconnecter" title="Se déconnecter" style={{ width: 34, height: 34 }}><Icon n="out" size={16} /></button>
        </div>
      </div></aside>

      <main className="main">
        <div className="top">
          <label className="search"><Icon n="search" size={17} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un créateur, un ebook…" aria-label="Recherche" /></label>
          <span className="sp" />
          <span className="live">SYNCHRO</span>
          <button className="iconbtn" onClick={() => setLight(dark)} aria-label={dark ? "Passer en thème clair" : "Passer en thème sombre"} title="Thème"><Icon n={dark ? "sun" : "moon"} /></button>
          <button className="iconbtn" onClick={() => go("pipeline")} aria-label={`${waiting} validation(s) en attente`}><Icon n="bell" />{waiting > 0 && <span className="dot" />}</button>
        </div>
        {demo && <div className="demo-banner"><Icon n="warn" size={18} /><span><b>Mode démo.</b> Tous les noms et chiffres sont des exemples ; rien n'est enregistré. Retirez NEXT_PUBLIC_DEMO pour utiliser les vraies données.</span></div>}
        {error && <div className="demo-banner" style={{ borderColor: "var(--bad)" }}><Icon n="warn" size={18} /><span>{error}</span></div>}
        {view === "dash" && <Dashboard go={go} notify={notify} name={name} />}
        {view === "run" && <Run go={go} notify={notify} />}
        {view === "creators" && <Creators q={q} notify={notify} />}
        {view === "pipeline" && <Pipeline q={q} notify={notify} />}
        {view === "ebooks" && <Ebooks q={q} />}
        {view === "sales" && <Sales />}
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
