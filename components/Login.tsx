"use client";
import { useData } from "@/lib/data";
import { Icon, Logo } from "./Icons";

// Page de connexion : l'app n'est ouverte qu'aux trois associés, rien d'autre à présenter.
function explain(e: string): string {
  if (e.includes("unauthorized-domain")) return "Ce domaine n'est pas autorisé dans Firebase. Ajoutez-le dans Authentication > Paramètres > Domaines autorisés.";
  if (e.includes("popup-closed") || e.includes("cancelled-popup")) return "Connexion annulée. Réessayez.";
  if (e.includes("popup-blocked")) return "Le navigateur a bloqué la fenêtre Google. Autorisez les pop-ups pour ce site.";
  return e;
}

export function Login() {
  const { login, error } = useData();
  return (
    <div className="login solo">
      <div className="box"><div className="panel">
        <div style={{ display: "flex", justifyContent: "center" }}><Logo size={56} /></div>
        <h1>KrinAi <span className="grad">Studio</span></h1>
        <p className="sub" style={{ margin: "0 auto" }}>Accès réservé aux trois associés.</p>
        <button className="btn" onClick={login}><Icon n="shield" size={18} /> Connexion avec Google</button>
        {error && <p className="err2" role="alert">{explain(error)}</p>}
      </div></div>
    </div>
  );
}
