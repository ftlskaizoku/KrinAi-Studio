"use client";
import { useMemo, useState } from "react";
import { useData } from "@/lib/data";
import { DEFAULT_KRINAI_PCT, FCFA_PER_USD, FEE_FIXED, FEE_PCT, estFees, krinaiShare, netOf } from "@/lib/money";
import { monthly } from "@/lib/stats";
import { usd, usd2 } from "@/lib/format";
import { AreaChart } from "../charts";
import { Avatar, Card, Empty, Head, Kpi } from "../ui";

export function Sales() {
  const { sales } = useData();
  const [p, setP] = useState(19), [s, setS] = useState(100), [n, setN] = useState(6), [h, setH] = useState(DEFAULT_KRINAI_PCT);
  const net = netOf(p), rev = krinaiShare(net, h) * s * n;
  const tot = useMemo(() => sales.reduce((a, x) => { const nt = netOf(x.gross, x.fees); return { gross: a.gross + x.gross, net: a.net + nt, mine: a.mine + krinaiShare(nt) }; }, { gross: 0, net: 0, mine: 0 }), [sales]);
  const m = useMemo(() => monthly(sales), [sales]);
  const F = new Intl.NumberFormat("fr-FR");
  return (
    <>
      <Head title={<>Ventes et <span className="grad">gains</span></>} sub="Suivez les ventes réelles, puis simulez combien rapporte un partenariat." />
      <div className="grid g4">
        <Kpi icon="cart" title="Ventes" value={sales.length} color="var(--ac2)" />
        <Kpi icon="cash" title="Chiffre d'affaires brut" value={usd(tot.gross)} color="var(--ac)" />
        <Kpi icon="ven" title="Net après frais" value={usd(tot.net)} color="#3B82F6" />
        <Kpi icon="cre" title={`Part KrinAi (${DEFAULT_KRINAI_PCT} %)`} value={usd(tot.mine)} color="var(--wa)" />
      </div>
      <div className="grid gmain">
        <Card><h2>Revenu KrinAi par mois ($)</h2>{sales.length ? <AreaChart data={m} label="Revenu KrinAi par mois" /> : <Empty icon="ven" title="Pas encore de vente" text="Les ventes arrivent depuis Whop via n8n (collection « sales » de Firestore)." />}</Card>
        <Card className="hero sim">
          <span className="lbl">Simulation · revenu mensuel de KrinAi</span>
          <div className="amount" style={{ margin: "10px 0 6px" }}>{F.format(Math.round(rev))} <small>$</small></div>
          <p style={{ margin: 0 }}>≈ {F.format(Math.round(rev * FCFA_PER_USD))} FCFA par mois</p>
          <p style={{ margin: "14px 0 0", fontSize: ".82rem", opacity: .9 }}>Net par vente après frais Whop ({FEE_PCT} % + {usd2(FEE_FIXED)}, à confirmer) : <b>{usd2(net)}</b></p>
        </Card>
      </div>
      <div className="grid g2">
        <Card><h2>Simulateur</h2>
          <label className="f"><span>Prix de l'ebook <b>{p} $</b></span><input type="range" min={9} max={39} value={p} onChange={(e) => setP(+e.target.value)} /></label>
          <label className="f"><span>Ventes par mois et par créateur <b>{s}</b></span><input type="range" min={10} max={400} step={10} value={s} onChange={(e) => setS(+e.target.value)} /></label>
          <label className="f"><span>Créateurs actifs <b>{n}</b></span><input type="range" min={1} max={30} value={n} onChange={(e) => setN(+e.target.value)} /></label>
          <label className="f"><span>Part de KrinAi <b>{h} %</b></span><input type="range" min={10} max={60} value={h} onChange={(e) => setH(+e.target.value)} /></label>
        </Card>
        <Card><h2>Dernières ventes</h2>
          {sales.length ? <div className="list">{sales.slice(0, 7).map((x) => (
            <div className="row" key={x.id}><Avatar name={x.creator_handle ?? x.ebook_title ?? "?"} size={42} /><div className="grow"><b>{x.ebook_title ?? "Vente"}</b><small>@{x.creator_handle ?? "—"} · frais {usd2(x.fees ?? estFees(x.gross))}</small></div><span className="amt">+{usd2(krinaiShare(netOf(x.gross, x.fees)))}</span></div>
          ))}</div> : <Empty icon="cart" title="Aucune vente" text="Chaque vente enregistrée montrera ici la part de KrinAi." />}
        </Card>
      </div>
    </>
  );
}
