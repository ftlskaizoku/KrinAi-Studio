import { adminAuth } from "@/lib/firebaseAdmin"; // même instance Admin que les autres routes (initialisée au premier usage)
import { isAllowed } from "@/lib/team";

// Appelée par l'interface juste après la connexion. Vérifie le jeton côté serveur,
// puis inscrit (ou retire) le droit "team" sur le compte : les règles Firestore le lisent.
export async function POST(req: Request) {
  const token = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "")?.[1];
  if (!token) return Response.json({ allowed: false }, { status: 401 });

  try {
    let decoded;
    try { decoded = await adminAuth.verifyIdToken(token, true); }
    catch (e: any) { console.error("[auth/check] jeton refusé :", e?.code ?? e?.message); return Response.json({ allowed: false }, { status: 401 }); }

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
    // Visible dans Vercel > Logs : indique si la clé de compte de service est en cause.
    console.error("[auth/check] erreur serveur :", e?.message ?? e);
    return Response.json({ allowed: false, error: "Erreur serveur" }, { status: 500 });
  }
}
