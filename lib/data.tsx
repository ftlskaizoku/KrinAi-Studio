"use client";
// Fournisseur de données : Firestore en temps réel (production) ou données d'exemple (mode démo).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { collection, limit, onSnapshot, orderBy, query, type DocumentData, type Timestamp } from "firebase/firestore";
import { getAuthClient, getDb } from "./firebaseClient";
import { demoCreators, demoEbooks, demoJobs, demoSales } from "./demo";
import { STEPS } from "./contract";
import type { Creator, Ebook, Job, Sale, Step } from "./types";

export const DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

export type Access = "none" | "checking" | "ok" | "denied" | "error";
type Ctx = {
  ready: boolean; email: string | null; demo: boolean; error: string; access: Access; deniedEmail: string;
  jobs: Job[]; creators: Creator[]; ebooks: Ebook[]; sales: Sale[];
  login: () => void; logout: () => void;
  call: (path: string, body: object) => Promise<{ ok: boolean; error?: string; data?: any }>;
};
const C = createContext<Ctx | null>(null);
export const useData = () => useContext(C)!;

const ms = (v: unknown): number | undefined => {
  const t = v as Timestamp | undefined;
  return t && typeof t.toMillis === "function" ? t.toMillis() : undefined;
};
const mapJob = (id: string, d: DocumentData): Job => ({ ...(d as Job), id, created_at: ms(d.created_at), updated_at: ms(d.updated_at) });
const mapOther = <T,>(id: string, d: DocumentData): T => ({ ...d, id, created_at: ms(d.created_at), updated_at: ms(d.updated_at), at: ms(d.at) ?? d.at }) as T;

export function DataProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Accès : rien n'est affiché ni demandé à Firestore tant que le serveur n'a pas confirmé que l'adresse est celle d'un associé.
  const [access, setAccess] = useState<Access>(DEMO ? "ok" : "none");
  const [deniedEmail, setDeniedEmail] = useState("");
  const [ready, setReady] = useState(DEMO);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState<Job[]>(DEMO ? demoJobs() : []);
  const [creators, setCreators] = useState<Creator[]>(DEMO ? demoCreators() : []);
  const [ebooks, setEbooks] = useState<Ebook[]>(DEMO ? demoEbooks() : []);
  const [sales, setSales] = useState<Sale[]>(DEMO ? demoSales() : []);

  useEffect(() => {
    if (DEMO) return;
    return onAuthStateChanged(getAuthClient(), async (u) => {
      setUser(u);
      if (!u) { setAccess((a) => (a === "denied" ? a : "none")); setReady(true); return; }
      setAccess("checking"); setError("");
      try {
        const r = await fetch("/api/auth/check", { method: "POST", headers: { authorization: `Bearer ${await u.getIdToken()}` } });
        if (r.status === 403) { setDeniedEmail(u.email ?? ""); setAccess("denied"); setUser(null); await signOut(getAuthClient()); return; }
        if (!r.ok) { setAccess("error"); return; }
        const j = await r.json();
        if (j.refresh) await u.getIdToken(true); // récupère le droit "team" lu par les règles Firestore
        setAccess("ok");
      } catch { setAccess("error"); } finally { setReady(true); }
    });
  }, []);

  useEffect(() => {
    if (DEMO || !user || access !== "ok") return;
    const db = getDb();
    const fail = (e: Error) => setError("Accès refusé : " + e.message);
    const subs = [
      onSnapshot(query(collection(db, "jobs"), orderBy("created_at", "desc"), limit(50)), (s) => setJobs(s.docs.map((d) => mapJob(d.id, d.data()))), fail),
      onSnapshot(query(collection(db, "creators"), limit(200)), (s) => setCreators(s.docs.map((d) => mapOther<Creator>(d.id, d.data()))), fail),
      onSnapshot(query(collection(db, "ebooks"), limit(100)), (s) => setEbooks(s.docs.map((d) => mapOther<Ebook>(d.id, d.data()))), () => {}),
      onSnapshot(query(collection(db, "sales"), orderBy("at", "desc"), limit(500)), (s) => setSales(s.docs.map((d) => mapOther<Sale>(d.id, d.data()))), () => {}),
    ];
    return () => subs.forEach((u) => u());
  }, [user, access]);

  // --- Simulateur du mode démo : fait avancer un faux job étape par étape, avec les 3 pauses humaines ---
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const patchJob = useCallback((id: string, p: Partial<Job>) => setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...p, updated_at: Date.now() } : j))), []);
  const GATES: Partial<Record<Step, string>> = { plan: "plan_valide_par_createur", controle: "relecture_associe", validation: "validation_ecrite_createur" };
  const advance = useCallback((id: string, from: number) => {
    const step = STEPS[from];
    if (!step) return;
    const gate = GATES[step];
    if (gate) { patchJob(id, { step, status: "waiting_human", gate, message: "En attente de validation", progress: null }); return; }
    patchJob(id, { step, status: "running", gate: null, message: "En cours…", progress: step === "transcription" ? { done: 0, total: 20 } : null });
    let i = 0;
    const tick = () => {
      if (step === "transcription" && i < 20) { i += 4; patchJob(id, { progress: { done: Math.min(i, 20), total: 20 }, message: `Vidéo ${Math.min(i, 20)} sur 20 transcrite` }); timers.current[id] = setTimeout(tick, 450); return; }
      patchJob(id, { status: "done", message: step === "en_vente" ? "Prêt pour la mise en vente" : "Étape terminée", progress: null });
      if (step !== "en_vente") timers.current[id] = setTimeout(() => advance(id, from + 1), 500);
    };
    timers.current[id] = setTimeout(tick, 1100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patchJob]);
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const call: Ctx["call"] = useCallback(async (path, body) => {
    if (DEMO) {
      if (path === "/api/jobs") {
        const m = /instagram\.com\/([A-Za-z0-9._]+)/i.exec((body as any).profile_url ?? "");
        if (!m) return { ok: false, error: "Lien Instagram invalide" };
        const handle = m[1].toLowerCase();
        const c = creators.find((x) => x.handle === handle);
        if (c?.accord !== "signe") return { ok: false, error: "Accord signé requis : enregistrez l'accord du créateur avant de lancer." };
        const id = "demo-" + Math.random().toString(36).slice(2, 8);
        setJobs((js) => [{ id, handle, step: "extraction", status: "queued", message: "", requested_by: "démo", created_at: Date.now(), updated_at: Date.now() }, ...js]);
        setTimeout(() => advance(id, 0), 400);
        return { ok: true, data: { job_id: id } };
      }
      let m = /^\/api\/jobs\/([^/]+)\/decision$/.exec(path);
      if (m) {
        const id = m[1];
        const j = jobs.find((x) => x.id === id);
        if (!j) return { ok: false, error: "Job inconnu" };
        if ((body as any).decision === "rejected") { patchJob(id, { status: "error", gate: null, message: "Refusé : " + ((body as any).comment ?? "") }); return { ok: true }; }
        patchJob(id, { status: "running", gate: null, message: "Validé, reprise en cours" });
        timers.current[id] = setTimeout(() => advance(id, STEPS.indexOf(j.step) + 1), 600);
        return { ok: true };
      }
      if (path === "/api/creators") {
        const b = body as any;
        const mm = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(b.profile_url ?? "");
        const handle = mm?.[1].toLowerCase();
        if (!handle) return { ok: false, error: "Lien Instagram invalide" };
        setCreators((cs) => [{ id: handle, handle, niche: b.niche ?? "", accord: "aucun", followers: b.followers ?? null, avg_views: b.avg_views ?? null, sales_link: b.sales_link ?? null, pro_contact: b.pro_contact ?? null, profile_url: b.profile_url }, ...cs.filter((x) => x.id !== handle)]);
        return { ok: true };
      }
      m = /^\/api\/creators\/([^/]+)$/.exec(path);
      if (m) { setCreators((cs) => cs.map((x) => (x.id === m![1] ? { ...x, ...(body as object) } : x))); return { ok: true }; }
      return { ok: false, error: "Non disponible en démo" };
    }
    if (!user || access !== "ok") return { ok: false, error: "Non connecté" };
    const token = await user.getIdToken();
    const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, data: j } : { ok: false, error: j.error ?? `Erreur ${r.status}` };
  }, [user, access, creators, jobs, advance, patchJob]);

  const value = useMemo<Ctx>(() => ({
    ready, demo: DEMO, error, access, deniedEmail, email: DEMO ? "demo@krinai.app" : access === "ok" ? user?.email ?? null : null,
    jobs, creators, ebooks, sales, call,
    login: () => {
      setAccess("none"); setDeniedEmail(""); setError("");
      const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" }); // laisse choisir un autre compte après un refus
      signInWithPopup(getAuthClient(), p).catch((e) => setError(e.message));
    },
    logout: () => { if (!DEMO) signOut(getAuthClient()); },
  }), [ready, error, access, deniedEmail, user, jobs, creators, ebooks, sales, call]);

  return <C.Provider value={value}>{children}</C.Provider>;
}
