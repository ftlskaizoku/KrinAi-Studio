"use client";
import { useState } from "react";
import { useData } from "@/lib/data";
import { CRITERIA, evaluate, score } from "@/lib/criteria";
import { compact } from "@/lib/format";
import { Avatar, Bar, Card, Empty, Head, Pill } from "../ui";
import { Icon } from "../Icons";

const NICHES = ["Career", "Cooking", "Fitness", "Finance", "Mindset", "Parenting", "Dog Trainers", "Autre"];
const ACCORD: Record<string, [string, "ok" | "wa" | ""]> = { signe: ["Accord signé", "ok"], en_discussion: ["En discussion", "wa"], aucun: ["Pas d'accord", ""] };

export function Creators({ q, notify }: { q: string; notify: (m: string) => void }) {
  const { creators, call } = useData();
  const [f, setF] = useState<"all" | "signe" | "todo">("all");
  const [form, setForm] = useState({ url: "", niche: "Career", followers: "", views: "", link: false, pro: true });
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = creators
    .filter((c) => (f === "all" ? true : f === "signe" ? c.accord === "signe" : c.accord !== "signe"))
    .filter((c) => !q || (c.handle + c.niche).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => score(b) - score(a));

  async function add() {
    setBusy(true); setErr("");
    const r = await call("/api/creators", {
      profile_url: form.url, niche: form.niche,
      followers: form.followers ? Number(form.followers.replace(/\D/g, "")) : null,
      avg_views: form.views ? Number(form.views.replace(/\D/g, "")) : null,
      sales_link: form.link, pro_contact: form.pro,
    });
    setBusy(false);
    if (r.ok) { setForm({ ...form, url: "", followers: "", views: "" }); notify("Créateur enregistré"); } else setErr(r.error ?? "Échec");
  }
  async function setAccord(id: string, accord: string) {
    const r = await call(`/api/creators/${id}`, { accord });
    setConfirm("");
    notify(r.ok ? "Accord mis à jour" : r.error ?? "Échec");
  }

  return (
    <>
      <Head title={<><span className="grad">Créateurs</span></>} sub="Sélection selon vos 4 critères. L'accord écrit du créateur est enregistré ici avant toute extraction.">
        <div className="seg" role="group" aria-label="Filtre">
          {([["all", "Tous"], ["signe", "Accord signé"], ["todo", "À contacter"]] as const).map(([k, l]) => <button key={k} aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>)}
        </div>
      </Head>

      <Card style={{ marginBottom: 16 }}>
        <div className="tw">
          {rows.length === 0 ? <Empty icon="cre" title="Aucun créateur" text="Ajoutez le premier créateur avec le formulaire ci-dessous." /> : (
            <table>
              <thead><tr><th>Créateur</th><th>Niche</th><th>Abonnés</th><th>Vues moy.</th><th>Score</th><th title={CRITERIA.map((c) => c.label).join("\n")}>4 critères</th><th>Accord</th></tr></thead>
              <tbody>{rows.map((c) => {
                const ev = evaluate(c), s = score(c), [lab, tone] = ACCORD[c.accord] ?? ACCORD.aucun;
                return (
                  <tr key={c.id}>
                    <td><div className="who"><Avatar name={c.handle} />@{c.handle}</div></td>
                    <td>{c.niche || "—"}</td>
                    <td className="num">{compact(c.followers)}</td>
                    <td className="num">{compact(c.avg_views)}</td>
                    <td style={{ minWidth: 120 }}><b className="num">{s}</b><Bar pct={s} /></td>
                    <td><span className="dots">{ev.map((x, i) => <i key={i} className={x === true ? "y" : x === false ? "n" : ""} title={`${CRITERIA[i].label} : ${x === true ? "oui" : x === false ? "non" : "à vérifier"}`} />)}</span></td>
                    <td>
                      {confirm === c.id ? (
                        <span className="acts"><button className="btn sm" onClick={() => setAccord(c.id, "signe")}>Je confirme : accord écrit obtenu</button><button className="btn ghost sm" onClick={() => setConfirm("")}>Annuler</button></span>
                      ) : (
                        <span className="acts"><Pill tone={tone}>{lab}</Pill>
                          {c.accord !== "signe" && <button className="btn ghost sm" onClick={() => setConfirm(c.id)}>Marquer signé</button>}
                          {c.accord === "aucun" && <button className="btn ghost sm" onClick={() => setAccord(c.id, "en_discussion")}>Contacté</button>}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          )}
        </div>
        <div className="leg"><span><i className="y" /> critère rempli</span><span><i className="n" /> non rempli</span><span><i /> à vérifier</span></div>
      </Card>

      <Card color="var(--ac)">
        <h2><Icon n="plus" size={18} /> Ajouter un créateur</h2>
        <div className="form">
          <label className="fld">Lien du compte<input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://instagram.com/nom" /></label>
          <label className="fld">Niche<select value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })}>{NICHES.map((n) => <option key={n}>{n}</option>)}</select></label>
          <label className="fld">Abonnés<input inputMode="numeric" value={form.followers} onChange={(e) => setForm({ ...form, followers: e.target.value })} placeholder="ex. 45000" /></label>
          <label className="fld">Vues moyennes (vidéos)<input inputMode="numeric" value={form.views} onChange={(e) => setForm({ ...form, views: e.target.value })} placeholder="ex. 80000" /></label>
        </div>
        <div className="checks">
          <label><input type="checkbox" checked={form.link} onChange={(e) => setForm({ ...form, link: e.target.checked })} /> Lien vers un produit ou service qu'il vend (bio)</label>
          <label><input type="checkbox" checked={form.pro} onChange={(e) => setForm({ ...form, pro: e.target.checked })} /> E-mail professionnel dans la bio</label>
        </div>
        {err && <p className="msg err">{err}</p>}
        <button className="btn" disabled={busy || !form.url} onClick={add}>Enregistrer le créateur</button>
      </Card>
    </>
  );
}
