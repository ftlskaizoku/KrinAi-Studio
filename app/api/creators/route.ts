import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "@/lib/firebaseAdmin";
import { requireTeam } from "@/lib/auth";

const Body = z.object({
  profile_url: z.string().max(300),
  niche: z.string().max(40).default(""),
  followers: z.number().int().min(0).max(1e9).nullable().optional(),
  avg_views: z.number().int().min(0).max(1e10).nullable().optional(),
  sales_link: z.boolean().nullable().optional(),
  pro_contact: z.boolean().nullable().optional(),
});

// Ajoute ou met à jour la fiche d'un créateur. Ne touche jamais à l'accord (voir /api/creators/[id]).
export async function POST(req: Request) {
  let email: string;
  try { email = await requireTeam(req); } catch (r) { return r as Response; }
  const b = Body.safeParse(await req.json().catch(() => null));
  if (!b.success) return Response.json({ error: "Données invalides" }, { status: 400 });

  const m = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(b.data.profile_url);
  const handle = m?.[1].toLowerCase();
  if (!handle || /^\.+$/.test(handle)) return Response.json({ error: "Lien Instagram invalide" }, { status: 400 });

  const ref = db.doc(`creators/${handle}`);
  const snap = await ref.get();
  const { profile_url, ...rest } = b.data;
  const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
  if (snap.exists) await ref.update({ ...clean, profile_url, updated_at: FieldValue.serverTimestamp() });
  else await ref.set({ handle, profile_url, accord: "aucun", added_by: email, ...clean, created_at: FieldValue.serverTimestamp() });
  return Response.json({ ok: true, id: handle }, { status: snap.exists ? 200 : 201 });
}
