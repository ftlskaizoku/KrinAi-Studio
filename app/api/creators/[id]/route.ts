import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "@/lib/firebaseAdmin";
import { requireTeam } from "@/lib/auth";

const Body = z.object({ accord: z.enum(["aucun", "en_discussion", "signe"]) });

// Enregistre l'état de l'accord avec le créateur : qui l'a saisi et quand (trace conservée).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let email: string;
  try { email = await requireTeam(req); } catch (r) { return r as Response; }
  const { id } = await params;
  if (!/^[a-z0-9._]{1,40}$/.test(id)) return Response.json({ error: "Créateur invalide" }, { status: 400 });
  const b = Body.safeParse(await req.json().catch(() => null));
  if (!b.success) return Response.json({ error: "Données invalides" }, { status: 400 });

  const ref = db.doc(`creators/${id}`);
  if (!(await ref.get()).exists) return Response.json({ error: "Créateur inconnu" }, { status: 404 });
  await ref.update({ accord: b.data.accord, accord_by: email, accord_at: FieldValue.serverTimestamp(), updated_at: FieldValue.serverTimestamp() });
  return Response.json({ ok: true });
}
