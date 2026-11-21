# Correctif v3.2 : l'écran de vérification ne bloque plus

Remplacez ces fichiers dans le dépôt (mêmes chemins), puis : npm run build, git add -A, git commit, git push.

- `app/api/auth/check/route.ts` : distingue jeton refusé (401) et problème de configuration serveur (500). Nouveau : ouvrir `https://VOTRE-APP.vercel.app/api/auth/check` dans le navigateur affiche un diagnostic sans secret (clé de compte de service, liste des associés, même projet Firebase).
- `lib/data.tsx`, `app/page.tsx` : jeton refusé = retour à l'écran de connexion avec un message ; erreur serveur = message avec le code + boutons « Réessayer » et « Se déconnecter ». Plus jamais coincé.
- `lib/team.ts` : si ALLOWED_EMAILS est vide ou absente, les trois associés sont autorisés (jamais tout le monde).
- `lib/firebaseAdmin.ts` : message clair si le JSON du compte de service est illisible ; accepte une clé collée avec des \n littéraux.
- `lib/auth.ts`, `firestore.rules` : inchangés par rapport à la v3.
