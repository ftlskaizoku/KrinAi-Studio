"use client";
import { useData } from "@/lib/data";
import { Icon, Logo } from "./Icons";
import { TickRing } from "./charts";

export function Login() {
  const { login, error } = useData();
  return (
    <div className="login">
      <div className="vis">
        <div className="brand" style={{ padding: 0 }}><Logo /><span>KrinAi <b>Studio</b></span></div>
        <div>
          <TickRing pct={72} label="de la production automatisée" />
          <h2>Un lien Instagram.<br /><span className="grad">Un ebook prêt à vendre.</span></h2>
          <p>n8n fait circuler le travail, Claude rédige, et vous gardez la main aux trois moments qui comptent.</p>
        </div>
        <div className="mini"><div><b>9</b>étapes</div><div><b>3</b>validations humaines</div><div><b>3</b>associés</div></div>
      </div>
      <div className="box"><div className="panel">
        <Logo size={52} />
        <h1>Bon retour</h1>
        <p className="sub" style={{ margin: "0 auto" }}>Accès réservé aux trois associés de KrinAi.</p>
        <button className="btn" onClick={login}><Icon n="shield" size={18} /> Connexion avec Google</button>
        {error && <p className="err2" role="alert">{error}</p>}
      </div></div>
    </div>
  );
}
