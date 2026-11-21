import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { parseServiceAccount } from "./serviceAccount";

// La connexion à Firebase ne se fait qu'au premier usage, pas au chargement du fichier :
// ainsi le build de Vercel n'a pas besoin des secrets.
let _app: App | undefined;
function app(): App {
  if (!_app) {
    const sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT); // lève une erreur claire si la variable est absente ou illisible
    _app = getApps()[0] ?? initializeApp({ credential: cert(sa as any) });
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
