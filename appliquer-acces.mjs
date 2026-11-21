// À lancer à la racine du dépôt :  node chemin/vers/krinai-acces/appliquer-acces.mjs
// Copie les fichiers, enveloppe l'application avec AuthGate, puis vérifie lib/auth.ts.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = process.cwd();
const has = (p) => fs.existsSync(path.join(root, p));
const stop = (m) => { console.log("ÉCHEC : " + m); process.exit(1); };

if (!has("package.json")) stop("lancez ce script à la racine du dépôt (là où se trouve package.json).");
const base = has("src/app") ? "src" : has("app") ? "." : stop("dossier app introuvable (ni app/ ni src/app/).");
console.log(`Dossier de code détecté : ${base === "." ? "racine" : "src/"}`);

// 1. Copie des fichiers
const copies = [["lib/team.ts", base], ["components/AuthGate.tsx", base], ["app/api/auth/check/route.ts", base], ["firestore.rules", "."]];
for (const [rel, dest] of copies) {
  const to = path.join(root, dest, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const existed = fs.existsSync(to);
  fs.copyFileSync(path.join(here, "files", rel), to);
  console.log(`${existed ? "Remplacé " : "Ajouté  "} ${path.relative(root, to)}`);
}

// 2. Enveloppe l'application avec AuthGate dans le layout
const layoutPath = ["layout.tsx", "layout.jsx", "layout.js"].map((f) => path.join(root, base, "app", f)).find((p) => fs.existsSync(p));
let manual = false;
if (!layoutPath) { console.log("À FAIRE À LA MAIN : aucun app/layout trouvé."); manual = true; }
else {
  let src = fs.readFileSync(layoutPath, "utf8");
  // On ne compte que le {children} affiché (pas celui des paramètres de la fonction).
  const JSX = /\{\s*children\s*\}(?![:)])/g;
  const n = (src.match(JSX) || []).length;
  if (src.includes("AuthGate")) console.log("Layout : AuthGate déjà en place.");
  else if (n !== 1) { console.log(`À FAIRE À LA MAIN : ${n} occurrence(s) de {children} dans le layout, je n'y touche pas.`); manual = true; }
  else {
    src = src.replace(JSX, "<AuthGate>{children}</AuthGate>");
    const lines = src.split("\n");
    let last = -1;
    lines.forEach((l, i) => { if (/^import\s/.test(l)) last = i; });
    lines.splice(last + 1, 0, 'import AuthGate from "@/components/AuthGate";');
    fs.writeFileSync(layoutPath, lines.join("\n"));
    console.log("Layout : application enveloppée avec <AuthGate>.");
  }
}
if (manual) console.log('  Dans app/layout : import AuthGate from "@/components/AuthGate"; puis <AuthGate>{children}</AuthGate>.');

// 3. Contrôle de requireTeam (routes du serveur)
const authPath = ["lib/auth.ts", "lib/auth.js"].map((f) => path.join(root, base, f)).find((p) => fs.existsSync(p));
if (!authPath) console.log("lib/auth.ts introuvable : vérifiez que les routes du serveur appliquent la même règle (isAllowed).");
else {
  const a = fs.readFileSync(authPath, "utf8");
  if (a.includes("isAllowed")) console.log("lib/auth.ts : utilise déjà isAllowed.");
  else {
    console.log("À FAIRE : lib/auth.ts ne passe pas par isAllowed. Dans requireTeam, après verifyIdToken :");
    console.log('  import { isAllowed } from "@/lib/team";');
    console.log("  if (!isAllowed(decoded.email, decoded.email_verified)) throw Response.json({ error: \"Accès refusé\" }, { status: 403 });");
  }
}
console.log("\nSuite : ALLOWED_EMAILS sur Vercel, publier firestore.rules dans Firebase, npm run build, commit, push.");
