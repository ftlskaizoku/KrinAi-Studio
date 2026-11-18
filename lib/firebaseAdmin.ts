import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// La connexion à Firebase ne se fait qu'au premier usage, pas au chargement du fichier :
// ainsi le build de Vercel n'a pas besoin des secrets.
let _app: App | undefined;
function app(): App {
  if (!_app) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("Variable FIREBASE_SERVICE_ACCOUNT manquante");
    _app = getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  return _app;
}

const lazy = <T extends object>(get: () => T) =>
  new Proxy({} as T, {
    get: (_t, p) => {
      const o = get() as any;
      const v = o[p];
      return typeof v === "function" ? v.bind(o) : v;
    },
  });

export const adminAuth: Auth = lazy(() => getAuth(app()));
export const db: Firestore = lazy(() => getFirestore(app()));
