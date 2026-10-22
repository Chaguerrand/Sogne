/* Contenu des règles : transcription du livret de règles + référentiel (règles validées).
   "Sonia" est affiché "Sogne" sur tout le site. */
(function () {
  const L = (items) => '<ul class="ul">' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>';
  const num = (n, t) => `<div class="numrow"><span class="numchip">${n}</span><div>${t}</div></div>`;
  const step = (n, t) => `<div class="steprow"><span class="stepnum">${n}</span><div>${t}</div></div>`;
  const cat = (c, label) => `<span class="chip ${c}">${label}</span>`;

  const RULES = [
    {
      id: 'bienvenue', title: 'Bienvenue !', open: true,
      html: `
      <p>Ce jeu a été créé pour célébrer Sonia comme il se doit : des <mark class="m-defi">défis</mark>, des <mark class="m-verite">révélations</mark>, des <mark class="m-duel">duels</mark>, des <mark class="m-gage">gages</mark> et plein de surprises !</p>
      <p>Les joueurs relèvent des défis, la taquinent, l'aident (ou pas), et tout le monde passe un bon moment rempli de rires et de souvenirs.</p>
      <div class="callout big"><strong>Le but du jeu</strong><br>Être le premier à faire arriver Sonia sur la case finale !</div>
      <p class="muted">Rires, mauvaise foi et souvenirs garantis !</p>`,
    },
    {
      id: 'materiel', title: 'Le matériel',
      html: `
      <p class="muted">Tout ce qu'il faut pour passer une soirée légendaire !</p>
      ${L([
        '<strong>1 plateau de jeu</strong> : avance sur le plateau en relevant des défis, des vérités, des duels, des gages et des cartes spéciales Sonia !',
        '<strong>1 pion Sonia</strong> : Sonia commence la partie ! C\'est elle qui doit atteindre la case finale pour remporter la partie.',
        '<strong>Des pions</strong> pour les autres joueurs.',
        '<strong>1 dé</strong> pour avancer sur le plateau.',
        '<strong>5 paquets de 45 cartes</strong> : des défis, des vérités, des duels, des gages et des cartes spéciales Sonia. Chaque paquet contient 3 jokers.',
        '<strong>3 jokers par paquet</strong> : 15 jokers au total. Leurs effets sont expliqués plus bas.',
        '<strong>1 livret de règles</strong> pour tout comprendre et ne rien oublier !',
      ])}
      <h4>Les 5 catégories</h4>
      <div class="catgrid">
        <div class="catcard defi"><b>DÉFI</b><span>45 cartes</span><p>Mimes, imitations, improvisations, musique, réflexion, adresse et interactions.</p></div>
        <div class="catcard verite"><b>VÉRITÉ</b><span>45 cartes</span><p>Anecdotes, confessions et questions sur les autres.</p></div>
        <div class="catcard duel"><b>DUEL</b><span>45 cartes</span><p>Épreuves à deux ou collectives : rapidité, mémoire, adresse, créativité et bluff.</p></div>
        <div class="catcard gage"><b>GAGE</b><span>45 cartes</span><p>Comportements temporaires, interactions et missions secrètes.</p></div>
        <div class="catcard sonia"><b>SONIA</b><span>45 cartes</span><p>Souvenirs, quiz, opinions, défis avec Sonia et pouvoirs spéciaux.</p></div>
      </div>`,
    },
    {
      id: 'miseenplace', title: 'Mise en place et début de partie',
      html: `
      <p class="muted">On se prépare et c'est parti pour faire avancer Sonia !</p>
      ${step(1, 'Place le plateau au centre de la table.')}
      ${step(2, 'Place le pion Sonia sur la case départ.')}
      ${step(3, 'Chaque joueur choisit son pion et le place sur la case départ.')}
      ${step(4, 'Mélangez séparément les cartes des 5 catégories et placez-les à côté du plateau.')}
      ${step(5, 'Prenez le dé.')}
      ${step(6, 'Lisez ensemble ce livret de règles (pour être sûr que tout le monde comprenne bien) et c\'est parti !')}
      <p class="muted">Sonia commence ; ensuite, les joueurs jouent dans le sens des aiguilles d'une montre.</p>`,
    },
    {
      id: 'tour', title: 'Déroulement d\'un tour',
      html: `
      <p class="muted">On lance le dé, on découvre la carte et on s'éclate !</p>
      ${step(1, '<b>Lance le dé.</b> Avance ton pion du nombre de cases indiqué sur le dé.')}
      ${step(2, '<b>Découvre la carte.</b> Prends la carte correspondant à la case sur laquelle tu arrives et lis-la à voix haute. <span class="muted">Défi, vérité, duel, gage ou carte Sonia ? Chaque case réserve une surprise !</span>')}
      ${step(3, '<b>Réalise l\'épreuve.</b> Suis les instructions de la carte. Tout le monde participe, observe, joue le jeu et profite du moment ! <span class="muted">Réussis l\'épreuve et fais avancer Sonia.</span>')}
      <div class="two">
        <div class="box ok"><h4>Si tu réussis</h4>${L(['Tu as relevé le défi !', 'En cas de duel : tu es déclaré(e) vainqueur(se).', 'En cas de gage : tu l\'as tenu jusqu\'au bout.', 'En cas de mission secrète : tu l\'as accomplie !'])}<p><b>Sonia avance sur le plateau !</b></p></div>
        <div class="box ko"><h4>Si tu échoues</h4>${L(['Tu bois une gorgée.', 'Sonia n\'avance pas.', 'Pour un gage ou une mission secrète : l\'effet s\'arrête immédiatement.', 'Pour un duel : l\'autre joueur(se) est déclaré(e) vainqueur(se).'])}</div>
      </div>
      <div class="callout"><strong>On continue !</strong> Le tour passe au joueur suivant dans le sens des aiguilles d'une montre. À vous de jouer !</div>`,
    },
    {
      id: 'avancer', title: 'Faites avancer Sonia !',
      html: `
      <p>À chaque fois qu'un joueur réussit une épreuve, Sonia avance sur le plateau !</p>
      <table class="bareme">
        <tr><td>${cat('defi', 'Défi individuel réussi')}</td><td class="pts">+ 1 case</td></tr>
        <tr><td>${cat('duel', 'Duel remporté')}</td><td class="pts">+ 1 case</td></tr>
        <tr><td>${cat('duel', 'Défi ou duel collectif réussi')}</td><td class="pts">+ 1 case</td></tr>
        <tr><td>${cat('gage', 'Gage respecté jusqu\'au bout')}</td><td class="pts">+ 1 case</td></tr>
        <tr><td>${cat('secret', 'Mission secrète réussie')}</td><td class="pts">+ 2 cases</td></tr>
        <tr><td>${cat('verite', 'Vérité répondue')}</td><td class="pts">+ 0 case</td></tr>
        <tr><td>${cat('sonia', 'Carte Sonia')}</td><td class="pts small">Selon l'effet indiqué sur la carte</td></tr>
      </table>
      <p class="muted">Les bonus sont accordés quel que soit le joueur qui réussit l'épreuve. Les déplacements prévus par les cartes s'ajoutent normalement.</p>
      <h4>La fin de la partie</h4>
      <p>Sonia atteint la case finale et tout le monde gagne !</p>`,
    },
    {
      id: 'duree', title: 'La durée des gages et missions secrètes',
      html: `${L([
        'Tous les gages durent un <b>seul tour</b> (y compris les cartes 2 et 29).',
        'Toutes les missions secrètes (cartes 36 à 41) durent un seul tour.',
        'Un gage ou une mission se termine avant le prochain lancer de son joueur.',
        'Si un gage ou une mission n\'est pas réussi : gorgée + révélation de la carte.',
        'Si un gage est enfreint : gorgée immédiate + fin du gage.',
      ])}
      <p class="muted">Un seul gage actif par joueur : le nouveau remplace l'ancien.</p>`,
    },
    {
      id: 'cartes', title: 'Les cartes en détail',
      html: `
      <p class="muted">Le jeu se compose de 5 catégories de cartes et de 3 jokers. Chaque carte contient une consigne à réaliser.</p>
      <div class="detail defi"><h4>DÉFI</h4><p>Un défi à réaliser seul, en équipe ou tous ensemble. <span class="muted">Exemples : mini-jeu, mime, quiz, challenge, observation...</span></p></div>
      <div class="detail verite"><h4>VÉRITÉ</h4><p>Réponds franchement à la question posée (ou pas !). Aucune avancée pour Sonia.</p></div>
      <div class="detail duel"><h4>DUEL</h4><p>Affronte un autre joueur dans une épreuve désignée. Le vainqueur fait avancer Sonia !</p></div>
      <div class="detail gage"><h4>GAGE</h4><p>Un gage à réaliser immédiatement et jusqu'à la fin de ton tour. Si tu ne le respectes pas : une gorgée et fin du gage.</p></div>
      <div class="detail secret"><h4>MISSION SECRÈTE</h4><p>Une mission discrète à accomplir pendant ton tour (sans te faire repérer !). Si tu réussis : révèle la carte et Sonia avance de 2 cases ! Si tu échoues : une gorgée et révélation de la carte.</p></div>
      <div class="detail sonia"><h4>CARTE SONIA</h4><p>Des cartes spéciales qui concernent Sonia ou qui pimentent la partie ! <span class="muted">Effets variés : avance, recule, défi spécial, règle temporaire...</span></p></div>`,
    },
    {
      id: 'speciales', title: 'Règles spéciales et cas particuliers',
      html: `
      <h4>Règles spéciales</h4>
      ${L([
        'Tous les gages et missions secrètes durent un seul tour (y compris les cartes 2 et 29).',
        'Un gage ou une mission se termine avant le prochain lancer du joueur.',
        'Si un gage n\'est pas respecté : une gorgée et fin du gage.',
        'Si une mission secrète n\'est pas réussie : une gorgée et révélation de la carte.',
        'Si un gage est enfreint : une gorgée immédiate et fin du gage.',
        'Pour un défi ou un duel collectif, toute l\'équipe doit réussir pour que Sonia avance.',
      ])}
      <h4>Cas particuliers</h4>
      ${L([
        'Si une carte te fait relancer le dé : suis le nouvel effet.',
        'Si une carte te fait avancer ou reculer : le déplacement s\'applique immédiatement.',
        'Si une carte place Sonia sur une autre case : déplace son pion immédiatement.',
        'Si plusieurs effets s\'appliquent : suis l\'ordre indiqué sur la carte (de haut en bas).',
      ])}
      <div class="callout"><strong>L'important</strong><br>Tout le monde participe, reste bienveillant et profite du moment !<br><span class="muted">Pas de consommation obligatoire : une boisson sans alcool ou un refus sont toujours possibles.</span></div>`,
    },
    {
      id: 'cases', title: 'Les cases spéciales du plateau',
      html: `
      <p class="muted">Ces cases ont un effet immédiat en plus des cartes que tu peux piocher !</p>
      <div class="cases">
        <div><b>Départ</b>Sonia commence ici. Chaque joueur place son pion sur la case départ.</div>
        <div><b>Case normale</b>Tu pioches la carte correspondant à la couleur de la case et tu appliques son effet.</div>
        <div><b>Case Sonia</b>Tu pioches une carte Sonia et tu appliques son effet.</div>
        <div><b>Avance</b>Avance du nombre de cases indiqué sur la case.</div>
        <div><b>Recule</b>Recule du nombre de cases indiqué sur la case.</div>
        <div><b>Relance</b>Relance immédiatement le dé et applique le nouvel effet.</div>
        <div><b>Gorgée</b>Tout le monde boit une gorgée.</div>
        <div><b>Échange</b>Échange ta place avec le joueur de ton choix.</div>
        <div><b>Téléportation</b>Lance le dé : 1 ou 6 : avance sur la case indiquée. 2, 3, 4 ou 5 : recule sur la case indiquée.</div>
        <div><b>Case bonus</b>Applique le bonus de la case.</div>
        <div><b>Case malus</b>Applique le malus de la case.</div>
        <div><b>Case spéciale</b>Applique la règle indiquée sur la case.</div>
        <div><b>Arrivée</b>Sonia atteint la case finale et tout le monde gagne !</div>
      </div>
      <p class="muted">Objectif : faire arriver Sonia au bout ensemble !</p>`,
    },
    {
      id: 'defi', title: 'Règles spéciales : cartes Défi',
      html: `<p class="muted">Certaines cartes Défi ont des règles particulières.</p>
      ${num('1 à 8', 'Ne jamais prononcer le nom de la réponse recherchée. Les imitations parlées sont autorisées.')}
      ${num('19', 'Fredonner sans paroles pour faire deviner le titre de la chanson.')}
      ${num('20', 'Le groupe impose le style musical.')}
      ${num('21', 'Le groupe impose la chanson du playback.')}
      ${num('23 à 27 et 29', 'Aucun doublon dans les énumérations. Le groupe arbitre les réponses litigieuses.')}
      ${num('26', 'Trouver cinq mots distincts rimant avec « soirée ». Formes verbales et adjectivales acceptées.')}
      ${num('30', 'Construire une tour de six objets tenant seule pendant trois secondes.')}
      ${num('31', 'Lancer une boulette de papier dans un verre à un mètre. Trois essais, un seul succès suffit.')}
      ${num('32', 'Maintenir une cuillère en équilibre sur un doigt pendant dix secondes, sans la retenir.')}
      ${num('33', 'Dessiner un chat les yeux fermés. Le groupe doit le reconnaître sans indice oral.')}
      ${num('35', 'Souffler une petite boulette de papier sur 50 cm, entre un départ et une arrivée définis.')}
      ${num('36, 38 et 42', 'La réalisation de la scène ou de la chorégraphie suffit à valider la réussite collective.')}
      ${num('37 et 44', 'Tous les mots imposés doivent être utilisés.')}
      ${num('41', 'Les autres joueurs posent des questions fermées. Répondre uniquement par oui ou non.')}
      <p class="muted">Sans durée précisée : 30 secondes de préparation, puis une minute d'exécution.</p>`,
    },
    {
      id: 'veritegage', title: 'Règles spéciales : cartes Vérité et Gage',
      html: `
      <h4>Cartes Vérité</h4>
      <p class="muted">Des questions personnelles, drôles ou surprenantes... Réponds franchement !</p>
      ${num('1 à 20 et 31 à 41', 'Tu réponds à la question posée, franchement. Si tu refuses de répondre : tu bois une gorgée.')}
      ${num('21 à 30', 'Le joueur qui pioche la carte désigne une personne. C\'est cette personne qui répond à la question. Si elle refuse de répondre : elle boit une gorgée.')}
      ${num('42 à 45', 'Tout le monde vote pour élire la personne visée. Si unanimité, l\'élu(e) boit une gorgée.')}
      <h4>Cartes Gage</h4>
      <p class="muted">Des comportements temporaires, des interactions et des missions secrètes pour pimenter la partie !</p>
      ${num('Durée', 'Tous les gages durent UN tour, de leur tirage jusqu\'au prochain passage du joueur. Un seul gage actif par joueur : le nouveau remplace l\'ancien.')}
      ${num('Infraction', 'En cas de première infraction à un gage : une gorgée immédiate et fin du gage.')}
      ${num('12', 'Tu dois applaudir lorsque Sonia termine une phrase.')}
      ${num('36 à 41', '<b>Missions secrètes.</b> Ces cartes sont cachées, un seul tour maximum. À la réussite : tu les révèles. Si tu échoues : au prochain passage, une gorgée puis révélation.')}
      ${num('42 et 43', 'La durée du gage est d\'une minute.')}
      ${num('45', 'La durée du gage est de trente secondes.')}`,
    },
    {
      id: 'duels', title: 'Règles des duels',
      html: `<p class="muted">Les duels permettent de s'affronter entre joueurs pour pimenter la partie !</p>
      ${num('1', 'Pierre-feuille-ciseaux, premier à trois victoires.')}
      ${num('2', 'Barbichette, premier qui rit perd.')}
      ${num('3', 'Cinq objets rouges distincts.')}
      ${num('4', 'Deux objets accessibles choisis par Sonia.')}
      ${num('5', 'Trois couleurs annoncées successivement par Sonia, un point au premier qui touche un objet de la bonne couleur, premier à deux points.')}
      ${num('6', 'Dobble, cinq manches, nommer le symbole commun, meilleur score.')}
      ${num('7', 'Dernier à lever son pouce au signal perd.')}
      ${num('8 à 13', 'Pour les énumérations, réponse fausse, répétée ou hésitation de plus de trois secondes = perte ; alphabet à deux, première erreur = perte.')}
      ${num('14', 'Tour de six objets tenant seule trois secondes.')}
      ${num('15', 'Première cuillère tombée = perte.')}
      ${num('16', 'Groupe vote pour le cochon dessiné.')}
      ${num('17', 'Pièce la plus proche du bord sans tomber.')}
      ${num('18', 'Même objet et même parcours.')}
      ${num('19', 'Même cible et distance, un lancer chacun.')}
      ${num('20 à 25', 'Groupe vote pour la meilleure prestation.')}
      ${num('28', '« Dans ma valise » : reprendre les éléments dans l\'ordre, puis en ajouter un.')}
      ${num('29', 'Compter à 15 sans ordre ; trois tentatives, redémarrage si simultanéité. Atteindre 15 : réussite pour tous, sinon échec collectif.')}
      ${num('32', 'Trois anecdotes, au moins une fausse, les autres votent.')}
      ${num('33', 'Deux vérités et un mensonge.')}
      ${num('35', 'Nombres de 1 à 100 écrits avant tirage du nombre cible.')}
      ${num('36', 'Vote secret du plus compétitif.')}
      ${num('37 à 41', 'Compétitions par équipes, appliquer la consigne de la carte ; blind test : premier à trois bonnes réponses.')}
      ${num('42 à 45', 'Improvisations collectives validées par la réalisation de la scène.')}
      <p class="muted">Le perdant boit une gorgée. Pour une épreuve collective, seuls les participants en échec sont sanctionnés ; si tous échouent, tous les participants sont sanctionnés.</p>`,
    },
    {
      id: 'sonia', title: 'Règles des cartes Sonia',
      html: `<p class="muted">Les cartes Sonia mettent Sonia au cœur de la partie !</p>
      ${num('9 à 17', 'Sonia juge les réponses de quiz.')}
      ${num('18 à 25', 'Questions d\'opinion, pas de mauvaise réponse.')}
      ${num('26 à 32', '<b>Sonia participe personnellement, sans remplaçant.</b>')}
      ${num('26', 'Grimaces, vote du groupe.')}
      ${num('27', 'Sonia devine l\'imitation.')}
      ${num('28', 'Chanson fredonnée sans paroles.')}
      ${num('29', 'Pierre-feuille-ciseaux premier à deux points.')}
      ${num('30', 'Premier qui rit perd.')}
      ${num('35', 'Joueur désigné rejoue immédiatement, lance le dé et exécute la case ; reprendre ensuite l\'ordre normal sans sauter personne.')}
      ${num('39', 'Sonia peut annuler la PROCHAINE sanction ; l\'effet expire à cette occasion, qu\'il soit utilisé ou non. En collectif, elle protège une seule personne.')}
      ${num('40', '« Tous les joueurs changent de place autour de la table, sauf Sonia ! » (les pions ne bougent pas).')}
      ${num('41 et 43', 'Pas de doublon ; cinq secondes par réponse.')}
      ${num('42', 'Tout le monde doit appeler Sonia par ce surnom jusqu\'à la fin de la partie.')}`,
    },
    {
      id: 'jokers', title: 'Les jokers',
      html: `<p class="muted">Les jokers peuvent vous sauver... ou retourner la situation !</p>
      <div class="detail joker"><h4>JOKER ÉCHANGE</h4><p>Piocher <mark class="m-duel">deux cartes supplémentaires</mark> dans le même paquet ; en choisir une à jouer ; remettre l'autre dans la pile.</p></div>
      <div class="detail joker"><h4>JOKER COLLECTIF</h4><p>Piocher une carte ; si compatible, possibilité de transformer son épreuve en <mark class="m-duel">action collective</mark>.</p></div>
      <div class="detail joker"><h4>JOKER AIDE</h4><p>Piocher une carte classique ; si compatible, choisir un autre <mark class="m-verite">joueur consentant</mark> pour aider à la réaliser.</p></div>
      <div class="callout warn">${L(['Si un joker n\'est pas applicable à la carte piochée, ou si tu choisis de ne pas l\'utiliser, il est remis dans la pile.', 'Tu ne peux utiliser qu\'un seul joker par carte.'])}</div>`,
    },
  ];
  const sg = (t) => t.replace(/Sonia/g, 'Sogne').replace(/SONIA/g, 'SOGNE');
  window.RULES = RULES.map((s) => ({ ...s, title: sg(s.title), html: sg(s.html) }));
})();
