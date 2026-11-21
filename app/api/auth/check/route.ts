import { adminAuth } from "@/lib/firebaseAdmin"; // même instance Admin que les autres routes (initialisée au premier usage)
import { allowedEmails, isAllowed } from "@/lib/team";

// Diagnostic sans secret : ouvrez /api/auth/check dans le navigateur pour voir ce qui manque sur Vercel.
export async function GET() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT ?? "";
  let sa: any = null;
  let json = "absente";
  if (raw) { try { sa = JSON.parse(raw); json = "JSON valide"; } catch { json = "JSON illisible (doit tenir sur une seule ligne)"; } }
  const pub = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  return Response.json({
    FIREBASE_SERVICE_ACCOUNT: json,
    cle_privee: sa ? (typeof sa.private_key === "string" && /BEGIN PRIVATE KEY/.test(sa.private_key.replace(/\\n/g, "\n")) ? "ok" : "absente ou mal formée") : "-",
    ALLOWED_EMAILS: allowedEmails().length + " adresse(s) actives",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: pub ? "présente" : "absente",
    meme_projet_firebase: sa?.project_id && pub ? sa.project_id === pub : null,
  });
}

// Appelée par l'interface juste après la connexion. Vérifie le jeton côté serveur,
// puis inscrit (ou retire) le droit "team" sur le compte : les règles Firestore le lisent.
export async function POST(req: Request) {
  const token = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "")?.[1];
  if (!token) return Response.json({ allowed: false, error: "jeton absent" }, { status: 401 });

  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    const ok = isAllowed(decoded.email, decoded.email_verified);
    const had = (decoded as any).team === true;

    if (ok !== had) {
      const user = await adminAuth.getUser(decoded.uid);
      await adminAuth.setCustomUserClaims(decoded.uid, { ...(user.customClaims ?? {}), team: ok });
    }
    if (!ok) {
      if (had) await adminAuth.revokeRefreshTokens(decoded.uid); // un ancien associé perd l'accès
      return Response.json({ allowed: false }, { status: 403 });
    }
    return Response.json({ allowed: true, refresh: !had });
  } catch (e: any) {
    console.error("[auth/check]", e?.code ?? "", e?.message ?? e);
    const code = String(e?.code ?? "");
    // Erreur du jeton lui-même (expiré, autre projet Firebase...) : 401. Tout le reste est un souci de configuration serveur : 500.
    if (code.startsWith("auth/") && code !== "auth/internal-error") return Response.json({ allowed: false, error: code }, { status: 401 });
    return Response.json({ allowed: false, error: String(e?.message ?? "Erreur serveur").slice(0, 160) }, { status: 500 });
  }
}
