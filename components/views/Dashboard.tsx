"use client";
import { useMemo, useState } from "react";
import { useData } from "@/lib/data";
import { STEPS } from "@/lib/contract";
import { GATE_LABEL, STEP_LABEL } from "@/lib/types";
import { isActive, jobPercent } from "@/lib/progress";
import { monthly, weekly } from "@/lib/stats";
import { krinaiShare, netOf, FCFA_PER_USD } from "@/lib/money";
import { ago, greeting, usd } from "@/lib/format";
import { AreaChart, BarChart, Donut, Spark, TickRing } from "../charts";
import { Avatar, Bar, Card, Empty, Head, Kpi, Pill } from "../ui";
import { Icon } from "../Icons";
import { GateActions } from "../Gate";
import type { View } from "../Shell";

export function Dashboard({ go, notify, name }: { go: (v: View) => void; notify: (m: string) => void; name: string }) {
  const { jobs, creators, ebooks, sales, call } = useData();
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const m = useMemo(() => monthly(sales), [sales]);
  const w = useMemo(() => weekly(sales), [sales]);
  const thisMonth = m[m.length - 1]?.value ?? 0;
  const prev = m[m.length - 2]?.value ?? 0;
  const salesMonth = useMemo(() => { const d = new Date(); return sales.filter((s) => s.at && new Date(s.at).getMonth() === d.getMonth() && new Date(s.at).getFullYear() === d.getFullYear()).length; }, [sales]);
  const active = jobs.filter(isActive);
  const waiting = jobs.filter((j) => j.status === "waiting_human");
  const avg = active.length ? Math.round(active.reduce((s, j) => s + jobPercent(j), 0) / active.length) : 0;
  const signed = creators.filter((c) => c.accord === "signe").length;
  const inProd = new Set(active.map((j) => j.handle)).size;
  const sold = new Set(jobs.filter((j) => j.step === "en_vente" && j.status === "done").map((j) => j.handle)).size;
  const funnel = [["Repérés", creators.length], ["En discussion", creators.filter((c) => c.accord !== "aucun").length], ["Accord signé", signed], ["En production", inProd], ["En vente", sold]] as const;
  const niche = useMemo(() => {
    const t: Record<string, number> = {};
    for (const s of sales) { const n = creators.find((c) => c.handle === s.creator_handle)?.niche || "Autres"; t[n] = (t[n] ?? 0) + krinaiShare(netOf(s.gross, s.fees)); }
    return Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([label, value]) => ({ label, value }));
  }, [sales, creators]);
  const recent = [...jobs].sort((a, b) => (b.updated_at ?? 0) - (a.updated_at ?? 0)).slice(0, 5);

  async function launch() {
    setBusy(true); setMsg("");
    const r = await call("/api/jobs", { profile_url: url });
    setBusy(false);
    if (r.ok) { setUrl(""); notify("Extraction lancée : n8n démarre"); go("run"); } else setMsg(r.error ?? "Échec");
  }
  const spk = (a: number[]) => (a.some((x) => x > 0) ? a : [1, 1, 1, 1, 1, 1]);

  return (
    <>
      <Head title={<>{greeting()}, <span className="grad">{name}</span></>} sub="Voici l'état de vos partenariats, de la production et de vos gains.">
        <span className="live">EN DIRECT</span>
      </Head>

      <div className="grid gmain">
        <Card className="hero">
          <span className="lbl">Nouvelle extraction</span>
          <h2 style={{ margin: "6px 0 6px", fontSize: "1.55rem" }}>Collez le lien du compte, l'ebook se prépare tout seul</h2>
          <p>n8n collecte, transcrit, rédige et contrôle. Vous n'intervenez qu'aux 3 validations.</p>
          <div className="launch">
            <input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && url && launch()} placeholder="https://instagram.com/nom-du-createur" aria-label="Lien du compte Instagram" />
            <button className="btn white" disabled={busy || !url} onClick={launch}><Icon n="bolt" size={17} /> Lancer</button>
          </div>
          {msg && <p className="msg err">{msg}</p>}
        </Card>
        <Card className="hero" style={{ background: "linear-gradient(135deg,#0f1b3d 0%,#1d3b8a 50%,#2a7de1 100%)" }}>
          <span className="lbl">Revenu KrinAi · ce mois</span>
          <div className="amount" style={{ margin: "10px 0 4px" }}>{usd(thisMonth)}</div>
          <div className="row">
            <span className="tag">{prev > 0 ? `${thisMonth >= prev ? "+" : ""}${Math.round(((thisMonth - prev) / prev) * 100)} % vs mois dernier` : "premier mois"}</span>
            <span className="tag">≈ {new Intl.NumberFormat("fr-FR").format(Math.round(thisMonth * FCFA_PER_USD))} FCFA</span>
          </div>
          <div className="minibars" aria-hidden="true">{spk(w).map((v, i) => <i key={i} style={{ height: 8 + (v / Math.max(...spk(w))) * 50 }} />)}</div>
        </Card>
      </div>

      <div className="grid g4">
        <Kpi icon="cre" title="Créateurs partenaires" value={signed} delta={`${creators.length} repérés`} color="var(--ac)"><Spark data={spk([1, 2, 2, 3, 4, signed || 1])} /></Kpi>
        <Kpi icon="bk" title="Ebooks en production" value={active.length} delta={waiting.length ? `${waiting.length} à valider` : "rien à valider"} color="var(--wa)"><Spark data={spk([1, 2, 2, 3, 3, active.length || 1])} /></Kpi>
        <Kpi icon="cart" title="Ventes du mois" value={salesMonth} delta={`${sales.length} au total`} color="var(--ac2)"><Spark data={spk(w)} /></Kpi>
        <Kpi icon="cash" title="Ebooks publiés" value={ebooks.filter((e) => e.status === "vente").length} delta={`${ebooks.length} au catalogue`} color="#3B82F6"><Spark data={spk(m.map((x) => x.value))} /></Kpi>
      </div>

      <div className="grid gmain">
        <Card><h2>Revenu KrinAi par mois ($)</h2>{sales.length ? <AreaChart data={m} label="Revenu KrinAi par mois" /> : <Empty icon="ven" title="Pas encore de vente" text="Le graphique se remplit dès que les ventes Whop arrivent dans l'app." />}</Card>
        <Card color="var(--ac2)"><h2>Avancement global</h2>
          <TickRing pct={avg} label="des ebooks en cours" sub={`${active.length} en production`} />
          <div className="ringlist">{active.slice(0, 3).map((j) => <div key={j.id}><i />@{j.handle}<span>{jobPercent(j)} %</span></div>)}{!active.length && <small style={{ color: "var(--mu)", textAlign: "center" }}>Aucun traitement en cours</small>}</div>
        </Card>
      </div>

      <div className="grid g3">
        <Card><h2>Entonnoir des créateurs</h2>
          <div className="fn">{funnel.map(([l, n]) => <div key={l}><span>{l}</span><Bar pct={creators.length ? (n / creators.length) * 100 : 0} /><b className="num">{n}</b></div>)}</div>
        </Card>
        <Card color="var(--wa)"><h2>Actions à mener {waiting.length > 0 && <Pill tone="wa">{waiting.length}</Pill>}</h2>
          {waiting.length ? <div className="todo">{waiting.slice(0, 3).map((j) => (
            <div className="t wa" key={j.id}><Avatar name={j.handle} size={34} /><div className="grow"><b>{GATE_LABEL[j.gate ?? ""] ?? "Validation attendue"}</b><small>@{j.handle} · {STEP_LABEL[j.step]}</small><div style={{ marginTop: 8 }}><GateActions jobId={j.id} notify={notify} /></div></div></div>
          ))}</div> : <Empty icon="shield" title="Tout est à jour" text="Aucune validation n'attend un associé pour le moment." />}
        </Card>
        <Card><h2>Activité récente</h2>
          {recent.length ? <ul className="tl">{recent.map((j) => <li key={j.id}><b>@{j.handle}</b> · {STEP_LABEL[j.step]}<small>{j.message || "—"} · {ago(j.updated_at)}</small></li>)}</ul> : <Empty icon="clock" title="Rien pour l'instant" text="Les étapes envoyées par n8n s'affichent ici en temps réel." />}
        </Card>
      </div>

      <div className="grid g2">
        <Card><h2>Ventes par semaine</h2>{sales.length ? <BarChart data={w} label="Ventes par semaine" /> : <Empty icon="cart" title="Pas de ventes" text="Les 8 dernières semaines apparaîtront ici." />}</Card>
        <Card><h2>Revenu par niche</h2>{niche.length ? <Donut data={niche} /> : <Empty icon="cre" title="Pas de données" text="La répartition par niche se calcule à partir des ventes." />}</Card>
      </div>
      <p className="lbl" style={{ marginTop: 6 }}>{STEPS.length} étapes · 3 portes humaines · données synchronisées en temps réel</p>
    </>
  );
}
