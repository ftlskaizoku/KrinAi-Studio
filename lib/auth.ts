import { timingSafeEqual } from "node:crypto";
import { adminAuth } from "./firebaseAdmin";

const fail = (error: string, status: number) => Response.json({ error }, { status });

// Contrôle côté serveur : connecté ET adresse dans la liste des trois.
export async function requireTeam(req: Request): Promise<string> {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) throw fail("Non connecté", 401);
  const u = await adminAuth.verifyIdToken(token).catch(() => null);
  const allowed = (process.env.ALLOWED_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!u?.email || !u.email_verified || !allowed.includes(u.email.toLowerCase())) throw fail("Accès réservé aux associés", 403);
  return u.email;
}

// Secret partagé avec n8n (en-tête X-KrinAi-Secret), comparé en temps constant.
export function checkSecret(req: Request): boolean {
  const a = Buffer.from(req.headers.get("x-krinai-secret") ?? "");
  const b = Buffer.from(process.env.N8N_SHARED_SECRET ?? "");
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}
