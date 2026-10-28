# Sogne Birthday : site compagnon du jeu

Règles du livret, pioche de cartes partagée (5 piles, jokers inclus), numéros générés depuis l'admin,
programme du week-end et infos de la maison. Aucune dépendance : Node 18+ suffit.

## Lancer en local

    npm start            # http://localhost:3000   (admin : http://localhost:3000/admin)

Variables : `ADMIN_PIN` (obligatoire pour activer `/admin`), `INFO_JSON` (infos de la maison, JSON, facultatif), `PORT`, `DATA_DIR` (dossier où l'état des piles est sauvegardé).

## Mettre en ligne (Render, gratuit)

1. Créer un dépôt GitHub et y pousser ce dossier (le code admin et l'adresse de la maison ne sont pas dans le code : ils sont
   fournis par les variables d'environnement `ADMIN_PIN` et `INFO_JSON` côté Render).
2. Sur render.com : New > Web Service > choisir le dépôt. Render lit `render.yaml` (runtime Node, plan Free).
   Renseigner `ADMIN_PIN` quand il le demande.
3. Une fois déployé, l'URL ressemble à `https://sogne-birthday.onrender.com`. Ouvrir `/admin`, se connecter :
   la section "QR code du site" génère le QR code de cette URL (bouton de téléchargement PNG).
4. UptimeRobot : New monitor > HTTP(s) > URL `https://VOTRE-URL/healthz` > intervalle 5 minutes.
   Cela empêche le service gratuit de s'endormir (réveil sinon : environ 50 secondes).

Attention : sur l'offre gratuite, le disque est éphémère. Sans base de données (voir "Sauvegarde des piles"), un redémarrage
remet les piles à zéro. Avec la base, l'état (piles, verrou, infos, numéros) est restauré et la session admin reste valable.
Évitez tout de même de redéployer pendant la partie : le site est indisponible environ une minute.

## Admin (`/admin`)

- **Numéros** : un clic distribue un numéro différent (1 à 16) à chaque téléphone connecté. Il s'affiche 10 secondes,
  puis chaque joueur peut le revoir 4 secondes avec un bouton. Le tour se termine quand vous rappuyez sur le bouton.
- **Piles** : compteurs, remélange d'une pile ou de toutes, réinitialisation, et verrou des cartes. Verrouillé (par défaut), le site
  est en **mode test** : le serveur envoie un paquet de fausses cartes (`demo.js`, langues inventées, 10 cartes par pile plus les jokers,
  qui tournent en boucle, tirage local sans effet sur les vraies piles) et les vrais textes ne quittent pas le serveur. Déverrouillé,
  les joueurs tirent dans les vraies piles.
- **Infos pratiques** : adresse, code de la boîte à clés, wifi, notes. Modifiable en direct, sans redéployer.
- **QR code** et **journal des derniers tirages**.

## Règles de pioche implémentées

- 5 piles de 48 cartes (45 classiques + 3 jokers ÉCHANGE, COLLECTIF, AIDE), tirage sans remise, remélange quand une pile est vide.
- Joker ÉCHANGE : 2 cartes classiques supplémentaires, on en garde une, l'autre retourne dans la pile.
- Joker COLLECTIF / AIDE : une carte classique, puis on utilise le joker ou on le remet dans la pile.
- Les jokers ne se cumulent pas : la carte à résoudre est toujours une carte classique.
- GAGE : un seul gage actif par joueur (le nouveau remplace l'ancien). Les missions secrètes (Gage 36 à 41) sont masquées
  par défaut et restent consultables jusqu'à "C'est terminé".
- Sans réseau : tirage local avec avertissement (des doublons sont alors possibles).

## Contenu

`scripts/source-cards.json` contient les 225 cartes d'origine. `npm run build:cards` régénère `public/cards.json`
(corrections validées : Gage 2 et 29 sur un tour, Duel 5 harmonisé, "Sonia" affiché "Sogne", précisions du livret).
Le texte historique est conservé dans le champ `source_text`.

## Sauvegarde des piles

Sans `DATABASE_URL`, l'état est écrit dans `data/state.json` (perdu à chaque redémarrage sur Render gratuit). Avec `DATABASE_URL` (Postgres, URL interne de la base Render), l'état est restauré au démarrage. La page `/admin` indique le mode de sauvegarde actif.
