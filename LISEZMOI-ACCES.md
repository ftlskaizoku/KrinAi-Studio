# Correctif accès v2 : seuls les 3 associés entrent

Votre capture montre que l'ancienne version est toujours en ligne : le compte non autorisé voit le tableau de bord parce que l'interface n'a jamais comparé l'adresse à la liste des associés. Le bandeau « Missing or insufficient permissions » prouve que Firestore refusait déjà les données, mais l'écran s'affichait. Ce correctif ajoute trois verrous : serveur (`/api/auth/check`), interface (`AuthGate`, message « Accès refusé ») et base (`firestore.rules`).

## En une commande
À la racine du dépôt, dans PowerShell, sur une branche :
```
git switch -c acces-associes
node CHEMIN\krinai-acces-v2\appliquer-acces.mjs
```
Le script copie les fichiers, enveloppe l'application dans `<AuthGate>` (dans `app/layout`), puis vérifie `lib/auth.ts`. Quand il ne peut pas modifier un fichier sans risque, il écrit « À FAIRE À LA MAIN » avec la ligne exacte à ajouter. Il peut être relancé sans danger.

## Ensuite, dans l'ordre
1. **Vercel, Settings, Environment Variables** : `ALLOWED_EMAILS` = les 3 adresses en minuscules, séparées par des virgules, sans espace inutile. Laissez `NEXT_PUBLIC_DEMO` vide.
2. **Firebase, Firestore, onglet Règles** : collez le contenu de `firestore.rules`, puis Publier. Si l'interface écrit directement dans Firestore, prévenez-moi avant (ces règles refusent l'écriture depuis un navigateur).
3. **Firebase, Authentication, Utilisateurs** : supprimez le compte non autorisé.
4. `npm run build`, commit, push, fusion, attendre le déploiement Vercel.
5. Si `lib/auth.ts` est signalé : ajoutez la vérification `isAllowed` dans `requireTeam` (ligne donnée par le script).

## Tester (fenêtre de navigation privée)
- Compte non autorisé : l'écran « Accès refusé » apparaît à la place du tableau de bord, puis « Retour à la connexion ».
- Chaque associé : entre normalement.
- Si **tout le monde** est refusé, `ALLOWED_EMAILS` est vide ou mal écrite sur Vercel : corrigez et redéployez.

## À savoir
Dans toute application web, le code de l'interface est téléchargé par le navigateur : ce qui doit rester secret, ce sont les données, protégées par les règles Firestore et les routes du serveur.
