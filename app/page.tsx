"use client";
import { useEffect, useState } from "react";
import { DataProvider, useData } from "@/lib/data";
import { Login } from "@/components/Login";
import { Shell } from "@/components/Shell";

function Gate() {
  const { ready, email, access, deniedEmail, login } = useData();
  // Rendu uniquement dans le navigateur : les dates et le thème n'existent pas côté serveur (évite une erreur d'hydratation).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const screen = (t: string, p?: string, btn?: [string, () => void]) => (
    <div className="login"><div className="box" style={{ gridColumn: "1/-1" }}>
      <p className="lbl">{t}</p>{p && <p>{p}</p>}{btn && <button className="btn" onClick={btn[1]}>{btn[0]}</button>}
    </div></div>
  );
  if (!ready || !mounted) return screen("Chargement…");
  if (access === "checking") return screen("Vérification de l’accès…");
  if (access === "denied") return screen("Accès refusé", `Le compte ${deniedEmail || "utilisé"} n’est pas autorisé. KrinAi Studio est réservé aux trois associés.`, ["Retour à la connexion", login]);
  if (access === "error") return screen("Vérification impossible", "Le serveur n’a pas pu confirmer votre accès. Réessayez dans un instant.", ["Réessayer", () => location.reload()]);
  return email ? <Shell /> : <Login />;
}
export default function Home() {
  return <DataProvider><Gate /></DataProvider>;
}
