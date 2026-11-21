# Correctif d'accès v3 : seuls les 3 associés entrent

Cause : `app/page.tsx` affichait l'application dès qu'un compte Google était connecté (`email ? <Shell/> : <Login/>`), sans comparer l'adresse à la liste des associés. Les règles Firestore bloquaient les données, mais l'interface s'affichait.

Le script `appliquer-acces.mjs` de la v2 n'est plus nécessaire : enveloppé dans le layout, son AuthGate bloquait l'initialisation de Firebase et affichait « Vérification impossible » en boucle.

## Fichiers (à copier dans le projet, mêmes chemins)
- `lib/data.tsx` : vérifie l'accès auprès du serveur avant toute lecture Firestore ; état « refusé » ; choix du compte Google à chaque connexion.
- `app/page.tsx` : écrans « Vérification de l'accès… », « Accès refusé », « Vérification impossible ».
- `lib/auth.ts` : les routes du serveur utilisent la même règle `isAllowed`.
- `lib/team.ts`, `app/api/auth/check/route.ts` : liste des associés et pose du droit `team`.
- `firestore.rules` : lecture réservée au droit `team` ; aucune écriture depuis le navigateur.

## Ordre de mise en ligne
1. Vercel : `ALLOWED_EMAILS` = les 3 adresses exactes, en minuscules, séparées par des virgules. `NEXT_PUBLIC_DEMO` vide.
2. `npm run build`, commit, push, attendre le déploiement.
3. Firebase, Firestore, Règles : coller `firestore.rules`, Publier.
4. Firebase, Authentication : supprimer le compte non autorisé.
5. Tester en navigation privée : compte non autorisé = « Accès refusé » ; chaque associé = entre.
