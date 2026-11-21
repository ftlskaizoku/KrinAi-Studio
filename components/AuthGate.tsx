"use client";
// Enveloppe toute l'application. Tant que l'accès n'est pas confirmé par le serveur,
// RIEN de l'interface n'est affichée et aucune donnée n'est demandée.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

type State = "checking" | "open" | "ok" | "denied" | "error";

const box: React.CSSProperties = { minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", background: "#0B1020", color: "#EAEEFB", fontFamily: "system-ui, sans-serif" };
const btn: React.CSSProperties = { marginTop: 18, padding: "11px 20px", borderRadius: 12, border: 0, background: "#EAEEFB", color: "#0B1020", fontWeight: 700, cursor: "pointer" };

export default function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>("checking");
  const [mail, setMail] = useState("");
  const denied = useRef(false);

  useEffect(() => {
    if (getApps().length === 0) { setState("error"); return; } // Firebase non initialisé : on refuse par défaut
    const auth = getAuth();
    let alive = true;
    const off = onAuthStateChanged(auth, async (user) => {
      if (!user) { if (!denied.current && alive) setState("open"); return; } // pas connecté : l'écran de connexion existant
      setState("checking");
      try {
        const r = await fetch("/api/auth/check", { method: "POST", headers: { authorization: `Bearer ${await user.getIdToken()}` } });
        if (!alive) return;
        if (r.status === 403) { denied.current = true; setMail(user.email ?? ""); setState("denied"); await signOut(auth); return; }
        if (!r.ok) { setState("error"); return; }
        const j = await r.json();
        if (j.refresh) await user.getIdToken(true); // récupère le droit "team" pour les règles Firestore
        if (alive) setState("ok");
      } catch { if (alive) setState("error"); }
    });
    return () => { alive = false; off(); };
  }, []);

  if (state === "checking") return <div style={box}>Vérification de l’accès…</div>;
  if (state === "denied") return (
    <div style={box}><div><h1 style={{ margin: 0 }}>Accès refusé</h1>
      <p>Le compte {mail || "utilisé"} n’est pas autorisé. KrinAi Studio est réservé aux trois associés.</p>
      <button style={btn} onClick={() => { denied.current = false; setState("open"); }}>Retour à la connexion</button></div></div>
  );
  if (state === "error") return (
    <div style={box}><div><h1 style={{ margin: 0 }}>Vérification impossible</h1>
      <p>Réessayez dans un instant.</p><button style={btn} onClick={() => location.reload()}>Réessayer</button></div></div>
  );
  return <>{children}</>;
}
