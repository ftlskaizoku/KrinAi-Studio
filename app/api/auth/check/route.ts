import "@/lib/firebaseAdmin"; // initialise l'application Admin
import { getAuth } from "firebase-admin/auth";
import { isAllowed } from "@/lib/team";

// Appelée par l'interface juste après la connexion. Vérifie le jeton côté serveur,
// puis inscrit (ou retire) le droit "team" sur le compte : les règles Firestore le lisent.
export async function POST(req: Request) {
  const token = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "")?.[1];
  if (!token) return Response.json({ allowed: false }, { status: 401 });

  const auth = getAuth();
  let decoded;
  try { decoded = await auth.verifyIdToken(token, true); } catch { return Response.json({ allowed: false }, { status: 401 }); }

  const ok = isAllowed(decoded.email, decoded.email_verified);
  const had = (decoded as any).team === true;

  if (ok !== had) {
    const user = await auth.getUser(decoded.uid);
    await auth.setCustomUserClaims(decoded.uid, { ...(user.customClaims ?? {}), team: ok });
  }
  if (!ok) {
    if (had) await auth.revokeRefreshTokens(decoded.uid); // un ancien associé perd l'accès
    return Response.json({ allowed: false }, { status: 403 });
  }
  return Response.json({ allowed: true, refresh: !had });
}
