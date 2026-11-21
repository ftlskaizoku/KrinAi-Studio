# Correctif v3.4 : lecture robuste de FIREBASE_SERVICE_ACCOUNT (accolades oubliées comprises)

Remplacez/ajoutez ces fichiers (mêmes chemins), puis : git add -A, git commit, git push (Vercel redéploie tout seul).

- `lib/serviceAccount.ts` (nouveau) : lit la clé Firebase collée sur Vercel quelle que soit la forme (une ligne, indentée, vrais retours à la ligne dans la clé, entre guillemets, base64) et dit précisément ce qui manque, sans jamais afficher la clé.
- `lib/firebaseAdmin.ts` et `app/api/auth/check/route.ts` : utilisent ce lecteur. Ouvrir `/api/auth/check` affiche maintenant la cause exacte.

La sécurité ne change pas : tant que le serveur ne peut pas vérifier un compte, personne n'entre.
