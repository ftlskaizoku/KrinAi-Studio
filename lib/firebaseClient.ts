import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Initialisation au premier usage (dans le navigateur), pas au chargement du fichier :
// le build ne plante plus si une variable NEXT_PUBLIC_FIREBASE_* manque.
function appInstance() {
  return getApps().length ? getApp() : initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}
export const getAuthClient = () => getAuth(appInstance());
export const getDb = () => getFirestore(appInstance());
