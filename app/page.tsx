"use client";
import { useEffect, useState } from "react";
import { DataProvider, useData } from "@/lib/data";
import { Login } from "@/components/Login";
import { Shell } from "@/components/Shell";

function Gate() {
  const { ready, email, access, deniedEmail, detail, login, logout } = useData();
  // Rendu uniquement dans le navigateur : les dates et le thème n'existent pas côté serveur (évite une erreur d'hydratation).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const screen = (t: string, p?: string, btns: [string, () => void][] = []) => (
    <div className="login"><div className="box" style={{ gridColumn: "1/-1" }}>
      <p className="lbl">{t}</p>{p && <p>{p}</p>}<div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 14 }}>{btns.map(([l, f]) => <button key={l} className="btn" onClick={f}>{l}</button>)}</div>
    </div></div>
  );
  if (!ready || !mounted) return screen("Chargement…");
  if (access === "checking") return screen("Vérification de l’accès…");
  if (access === "denied") return screen("Accès refusé", `Le compte ${deniedEmail || "utilisé"} n’est pas autorisé. KrinAi Studio est réservé aux trois associés.`, [["Retour à la connexion", login]]);
  if (access === "error") return screen("Vérification impossible", `Le serveur n’a pas pu confirmer votre accès.${detail ? " (" + detail + ")" : ""}`, [["Réessayer", () => location.reload()], ["Se déconnecter", logout]]);
  return email ? <Shell /> : <Login />;
}
export default function Home() {
  return <DataProvider><Gate /></DataProvider>;
}
