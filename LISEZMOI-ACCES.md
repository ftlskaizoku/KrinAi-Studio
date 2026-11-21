# Correctif accès : seuls les 3 associés entrent

## Pourquoi vous avez vu le tableau de bord
La connexion Google de Firebase accepte n'importe quel compte. Rien dans l'interface ne comparait ensuite l'adresse à la liste des associés. Le message rouge « Missing or insufficient permissions » montre que les règles Firestore refusaient déjà les données : rien n'a été lu, mais l'écran s'affichait. Ce correctif ajoute trois verrous.

1. **Serveur** (`app/api/auth/check`) : vérifie le jeton, compare l'adresse à `ALLOWED_EMAILS` (adresse vérifiée obligatoire), puis pose ou retire le droit `team` sur le compte. Liste vide = personne n'entre.
2. **Interface** (`components/AuthGate.tsx`) : n'affiche rien et ne demande aucune donnée tant que le serveur n'a pas dit oui. Un compte refusé voit « Accès refusé » et est déconnecté aussitôt.
3. **Base de données** (`firestore.rules`) : lecture seulement avec le droit `team` ; adresses de reprise jamais lisibles ; aucune écriture depuis un navigateur.

## Appliquer (branche, comme d'habitude)
1. Copier les fichiers par-dessus le dépôt (mêmes chemins).
2. Envelopper l'application dans `app/layout.tsx` (ou le layout qui contient tableau de bord ET connexion) :
   `import AuthGate from "@/components/AuthGate";` puis `<AuthGate>{children}</AuthGate>` autour de ce qui est affiché.
3. Dans `lib/auth.ts`, la fonction `requireTeam` doit utiliser la même règle : après `verifyIdToken`, refuser (403) si `!isAllowed(decoded.email, decoded.email_verified)` (`import { isAllowed } from "@/lib/team"`). Envoyez-moi ce fichier si vous voulez que je l'adapte.
4. Vercel : `ALLOWED_EMAILS` = les 3 adresses en minuscules, séparées par des virgules ; `NEXT_PUBLIC_DEMO` vide. Redéployer.
5. Firebase, Firestore, onglet Règles : coller `firestore.rules`, puis Publier. Si l'interface écrit directement dans Firestore, dites-le-moi avant : ces règles refusent toute écriture navigateur.
6. Firebase, Authentication, Utilisateurs : supprimer le compte non autorisé qui s'est connecté.
7. `npm run build`, commit, push, fusion.

## Tester
- Compte non autorisé : « Accès refusé », puis retour à la connexion. Aucun écran du tableau de bord.
- Chacun des 3 associés : entre normalement (la première connexion fait un petit aller-retour pour récupérer le droit).
- Retirer une adresse de `ALLOWED_EMAILS` puis se reconnecter : l'accès est retiré.

## À savoir
Dans toute application web, le code de l'interface est téléchargé par le navigateur : ce qui doit rester secret, ce sont les données, et ce sont les règles Firestore et les routes serveur qui les protègent.
