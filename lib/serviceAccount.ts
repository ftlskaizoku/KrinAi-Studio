// Lit la clé de compte de service Firebase collée dans une variable d'environnement, quelle que soit la façon dont elle a été collée :
//  - JSON normal (une ou plusieurs lignes), avec des \n ou de vrais retours à la ligne dans la clé privée
//  - JSON entouré de guillemets ("..." ou '...'), parfois avec les guillemets internes échappés
//  - JSON encodé en base64
//  - JSON auquel il manque l'accolade { de début et/ou } de fin (oubli fréquent au copier-coller)
// Ne renvoie jamais le contenu de la clé dans un message d'erreur.
export type ServiceAccount = { project_id: string; client_email: string; private_key: string; [k: string]: unknown };

const parse = (t: string): any => { try { return JSON.parse(t); } catch { return undefined; } };

export function parseServiceAccount(input: string | undefined): ServiceAccount {
  let s = (input ?? "").trim();
  if (!s) throw new Error("FIREBASE_SERVICE_ACCOUNT est vide ou absente");

  // base64 ?
  if (!s.startsWith("{") && !/^["']/.test(s) && /^[A-Za-z0-9+/=\s]+$/.test(s)) {
    const d = Buffer.from(s, "base64").toString("utf8").trim();
    if (d.startsWith("{")) s = d;
  }
  // accolades oubliées au copier-coller : le texte commence par "type": ... au lieu de { "type": ...
  if (/^"[A-Za-z_]+"\s*:/.test(s)) s = "{" + s.replace(/,\s*$/, "") + (s.trimEnd().endsWith("}") ? "" : "}");
  // guillemets autour (jusqu'à deux couches)
  for (let i = 0; i < 2; i++) {
    const q = s[0];
    if (s.length > 1 && (q === '"' || q === "'") && s[s.length - 1] === q) {
      if (q === '"') { const j = parse(s); if (typeof j === "string") { s = j.trim(); continue; } }
      s = s.slice(1, -1).trim();
    }
  }

  let sa = parse(s);
  if (!sa) {
    // vrais retours à la ligne à l'intérieur de la clé privée : on les remplace par \n
    const fixed = s.replace(/("private_key"\s*:\s*")([\s\S]*?)("\s*[,}])/, (_m, a, b, c) => a + b.replace(/\r?\n/g, "\\n") + c);
    sa = parse(fixed);
    if (!sa && s.startsWith("{") && !s.trimEnd().endsWith("}")) sa = parse(fixed.trimEnd().replace(/,$/, "") + "}"); // « } » de fin oublié
  }
  if (!sa || typeof sa !== "object") {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT illisible (commence par « ${s.slice(0, 1) || "?"} », ${s.length} caractères). Collez le contenu complet du fichier JSON téléchargé depuis Firebase.`);
  }
  if (typeof sa.private_key === "string") sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  const missing = ["project_id", "client_email", "private_key"].filter((k) => typeof sa[k] !== "string" || !sa[k]);
  if (missing.length) throw new Error(`FIREBASE_SERVICE_ACCOUNT : champs manquants (${missing.join(", ")}). Le JSON est peut-être coupé ou incomplet.`);
  if (!/BEGIN PRIVATE KEY/.test(sa.private_key)) throw new Error("FIREBASE_SERVICE_ACCOUNT : la clé privée est mal formée.");
  return sa as ServiceAccount;
}
