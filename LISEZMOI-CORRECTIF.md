# Correctif v2 : connexion à l'orchestrateur (Activepieces ou n8n)

Version refaite selon les décisions du projet :
- le **lien du compte Instagram** collé dans l'app lance tout ; l'accord du créateur est obtenu avant, hors de l'app, donc **l'app ne le vérifie plus** ;
- **une seule personne commite** sur GitHub (vous) : ce correctif s'applique en une fois, sur une branche ;
- Activepieces **ou** n8n : le contrat est le même, seule l'adresse change.

## Ce qui change par rapport à la v1

| Fichier | Changement |
|---|---|
| `app/api/jobs/route.ts` | **Nouveau comportement.** Plus de blocage « accord signé requis ». Le créateur est enregistré au premier lancement (lien normalisé, niche), les liens qui ne sont pas un compte (reel, publication, stories) sont refusés, et un second lancement est refusé (409) tant qu'un job est actif pour le même créateur, pour ne pas payer deux fois. Un job « en cours » sans nouvelle depuis 6 h ne bloque plus ; un job en attente d'une personne bloque toujours. |
| `lib/contract.ts`, `app/api/n8n/events/route.ts`, `app/api/jobs/[id]/decision/route.ts` | Inchangés par rapport à la v1 (une ou deux adresses de reprise, livrables, adresse relue dans le journal des décisions). Les trois portes restent : plan validé par le créateur, relecture d'un associé, validation écrite du créateur. |
| `fake-n8n/*`, `.env.example` | Inchangés. |

## Appliquer (Windows, PowerShell, à la racine du dépôt)

```
git switch -c connexion-orchestrateur
# décompressez le zip PAR-DESSUS le dépôt (mêmes chemins), puis :
npm run build
npm run selftest
git add -A
git commit -m "Connexion orchestrateur v2 : lancement par le lien, sans vérification d'accord"
git push -u origin connexion-orchestrateur
```
Vérifiez que `git config user.email` est l'adresse de votre compte Vercel : sinon Vercel peut bloquer le déploiement. Fusionnez ensuite la branche vers `main`.

Test avec Activepieces (faux orchestrateur) sous PowerShell :
```
$env:FAKE_MODE="activepieces"; node fake-n8n/selftest.mjs
```

## Variables sur Vercel (puis redéployer)
`ORCH_WEBHOOK_URL` (adresse de production du webhook du flow), `N8N_SHARED_SECRET` (même secret dans le flow), `RESUME_URLS_METHOD` (GET pour commencer).

## À vérifier côté interface
Si le bouton de lancement est grisé tant que `accord` n'est pas « signe », retirez cette condition : je n'ai pas vu les fichiers de l'interface. Dans le guide de connexion, le Test 1 n'a plus besoin d'un créateur « à l'accord signé ».

## Testé ici
Le faux orchestrateur (n8n et Activepieces, avec et sans refus) et la route de lancement avec un faux Firestore en mémoire : 9 cas (lien invalide, reel, nouveau créateur sans accord, double lancement, relance après erreur, job perdu, job en attente). Les routes Next.js n'ont pas été compilées dans votre projet : lancez `npm run build`.
