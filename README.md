# KrinAi Studio

L'app que les trois associés utilisent pour lancer et suivre la production d'ebooks. n8n (Zoum) fait le travail, les modèles tournent sur le PC de Mbengue, l'app affiche l'avancement et recueille les validations.

**Source de vérité du contrat avec n8n : `lib/contract.ts`.** Toute modification se discute à trois.

## Démarrer en local
1. **Firebase** : créer un projet, activer *Authentication* (fournisseur Google) et *Firestore*. Coller `firestore.rules` dans Firestore (remplacer les trois adresses). Dans *Paramètres du projet > Comptes de service*, générer une clé et mettre son JSON **sur une seule ligne** dans `FIREBASE_SERVICE_ACCOUNT`.
2. Copier `.env.example` en `.env.local` et le remplir (les trois mêmes adresses dans `ALLOWED_EMAILS` et dans les règles).
3. `npm install`, puis dans deux terminaux : `npm run dev` et `npm run fake-n8n`.
4. Ouvrir http://localhost:3000, se connecter avec Google, coller un lien Instagram et cliquer sur Lancer. L'app refuse tant que la fiche du créateur n'a pas `accord = "signe"` : en attendant l'écran Créateurs, modifier ce champ à la main dans la console Firestore (collection `creators`, document = pseudo).
5. Le faux n8n déroule les étapes et s'arrête aux trois portes humaines : cliquer sur Valider pour continuer. `npm run selftest` vérifie le faux n8n seul.

## Passer au vrai n8n
Dans `.env.local` (et sur Vercel), mettre l'adresse du webhook de Zoum dans `N8N_URL` et le même `N8N_SHARED_SECRET` des deux côtés. Rien d'autre à changer dans l'app.

## GitHub et Vercel
Dépôt privé, trois collaborateurs, travail par branches et relecture par un autre associé. Ne jamais committer `.env.local` ni une clé de service. Sur Vercel : importer le dépôt, recopier les variables du `.env.example` dans les réglages du projet. Vercel ne sert qu'à héberger : l'état vit dans Firebase.

## Pas encore là
Écrans Tableau de bord, Créateurs, Ebooks, Ventes et gains de la maquette ; dépôt des vidéos par le créateur ; Whop. Le code n'a pas encore été installé ni lancé avec `npm install` : seul le faux n8n a été testé.
