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
      <p>Ce jeu a été créé pour célébrer Sonia comme il se doit, avec des <mark class="m-defi">défis</mark>, des <mark class="m-verite">révélations</mark>, des <mark class="m-duel">duels</mark>, des <mark class="m-gage">gages</mark> et plein de surprises !</p>
      <p>Les joueurs relèvent des défis, la taquinent, l'aident (ou pas), et tout le monde passe un bon moment, rempli de rires et de souvenirs.</p>
      <div class="callout big"><strong>Le but du jeu</strong><br>Faites arriver Sonia sur la case finale, tous ensemble !</div>
      <p class="muted">Rires, mauvaise foi et souvenirs garantis !</p>`,
    },
    {
      id: 'materiel', title: 'Le matériel',
      html: `
      <p class="muted">Tout ce qu'il faut pour passer une soirée légendaire !</p>
      ${L([
        '<strong>1 plateau de jeu</strong> : on y fait avancer Sonia en relevant des défis, des vérités, des duels, des gages et des cartes spéciales Sonia.',
        '<strong>1 pion Sonia</strong> : Sonia commence la partie. C\'est elle qui doit atteindre la case finale pour que tout le monde remporte la partie.',
        '<strong>Des pions</strong> pour chacun des autres joueurs.',
        '<strong>1 dé</strong> pour avancer sur le plateau.',
        '<strong>5 paquets de 45 cartes</strong> : un paquet de défis, un de vérités, un de duels, un de gages et un de cartes spéciales Sonia.',
        '<strong>3 jokers par paquet</strong>, mélangés aux autres cartes : 15 jokers au total. Leurs effets sont expliqués dans la section « Les jokers ».',
        '<strong>1 livret de règles</strong> pour tout comprendre et ne rien oublier.',
      ])}
      <h4>Les 5 catégories</h4>
      <div class="catgrid">
        <div class="catcard defi"><b>DÉFI</b><span>45 cartes</span><p>Mimes, imitations, improvisations, musique, réflexion, adresse et interactions entre joueurs.</p></div>
        <div class="catcard verite"><b>VÉRITÉ</b><span>45 cartes</span><p>Anecdotes, confessions et questions sur les autres joueurs.</p></div>
        <div class="catcard duel"><b>DUEL</b><span>45 cartes</span><p>Épreuves à deux ou collectives, qui testent la rapidité, la mémoire, l\'adresse, la créativité et le bluff.</p></div>
        <div class="catcard gage"><b>GAGE</b><span>45 cartes</span><p>Comportements à tenir un moment, interactions et missions secrètes.</p></div>
        <div class="catcard sonia"><b>SONIA</b><span>45 cartes</span><p>Souvenirs, quiz, opinions, défis avec Sonia et pouvoirs spéciaux.</p></div>
      </div>`,
    },
    {
      id: 'miseenplace', title: 'Mise en place et début de partie',
      html: `
      <p class="muted">On se prépare, et c\'est parti pour faire avancer Sonia !</p>
      ${step(1, 'Placez le plateau au centre de la table.')}
      ${step(2, 'Placez le pion Sonia sur la case départ.')}
      ${step(3, 'Chaque joueur choisit son pion et le place sur la case départ.')}
      ${step(4, 'Mélangez séparément les cartes de chacune des 5 catégories et placez les paquets à côté du plateau.')}
      ${step(5, 'Posez le dé à portée de main.')}
      ${step(6, 'Lisez ensemble ce livret de règles (pour être sûr que tout le monde comprenne bien) et c\'est parti !')}
      <p class="muted">Sonia joue en premier. Ensuite, les joueurs jouent chacun leur tour, dans le sens des aiguilles d\'une montre.</p>`,
    },
    {
      id: 'tour', title: 'Déroulement d\'un tour',
      html: `
      <p class="muted">On lance le dé, on découvre la carte et on s\'amuse !</p>
      ${step(1, '<b>Lance le dé.</b> Avance ton pion du nombre de cases indiqué par le dé.')}
      ${step(2, '<b>Découvre la carte.</b> Pioche la carte qui correspond à la case sur laquelle tu arrives et lis-la à voix haute. <span class="muted">Défi, vérité, duel, gage ou carte Sonia ? Chaque case réserve une surprise !</span>')}
      ${step(3, '<b>Réalise l\'épreuve.</b> Suis les instructions de la carte. Les autres observent, jouent le jeu et profitent du moment ! <span class="muted">Si tu réussis l\'épreuve, Sonia avance.</span>')}
      <div class="two">
        <div class="box ok"><h4>Si tu réussis</h4>${L(['Tu as relevé le défi.', 'Pour un duel : tu es déclaré(e) vainqueur(se).', 'Pour un gage : tu l\'as tenu jusqu\'au bout.', 'Pour une mission secrète : tu l\'as accomplie.'])}<p><b>Sonia avance sur le plateau !</b></p></div>
        <div class="box ko"><h4>Si tu échoues</h4>${L(['Tu bois une gorgée.', 'Sonia n\'avance pas.', 'Pour un gage ou une mission secrète : l\'effet s\'arrête immédiatement.', 'Pour un duel : ton adversaire est déclaré(e) vainqueur(se).'])}</div>
      </div>
      <div class="callout"><strong>On continue !</strong> Le tour passe au joueur suivant, dans le sens des aiguilles d'une montre. À vous de jouer !</div>`,
    },
    {
      id: 'avancer', title: 'Faites avancer Sonia !',
      html: `
      <p>Chaque fois qu'un joueur réussit une épreuve, Sonia avance sur le plateau !</p>
      <table class="bareme">
        <tr><td>${cat('defi', 'Défi individuel réussi')}</td><td class="pts">+ 1 case</td></tr>
        <tr><td>${cat('duel', 'Duel remporté')}</td><td class="pts">+ 1 case</td></tr>
        <tr><td>${cat('duel', 'Défi ou duel collectif réussi')}</td><td class="pts">+ 1 case</td></tr>
        <tr><td>${cat('gage', 'Gage respecté jusqu\'au bout')}</td><td class="pts">+ 1 case</td></tr>
        <tr><td>${cat('secret', 'Mission secrète réussie')}</td><td class="pts">+ 2 cases</td></tr>
        <tr><td>${cat('verite', 'Vérité répondue')}</td><td class="pts">+ 0 case</td></tr>
        <tr><td>${cat('sonia', 'Carte Sonia')}</td><td class="pts small">Selon l'effet indiqué sur la carte</td></tr>
      </table>
      <p class="muted">Sonia avance quel que soit le joueur qui réussit l'épreuve. Les déplacements prévus par les cartes s'ajoutent normalement.</p>
      <h4>La fin de la partie</h4>
      <p>Quand Sonia atteint la case finale, tout le monde gagne !</p>`,
    },
    {
      id: 'duree', title: 'La durée des gages et des missions secrètes',
      html: `${L([
        'Tous les gages durent <b>un seul tour</b>, y compris les gages 2 et 29. Seuls font exception les gages 42 et 43 (une minute) et 45 (trente secondes).',
        'Toutes les missions secrètes (gages 36 à 41) durent elles aussi un seul tour.',
        'Un gage ou une mission secrète se termine avant ton prochain lancer de dé.',
        'Si tu enfreins un gage, tu bois une gorgée immédiatement et le gage prend fin.',
        'Si tu ne réussis pas ta mission secrète, tu bois une gorgée et tu révèles la carte.',
      ])}
      <p class="muted">Tu ne peux avoir qu'un seul gage actif à la fois : si tu en pioches un nouveau, il remplace l'ancien.</p>`,
    },
    {
      id: 'cartes', title: 'Les cartes en détail',
      html: `
      <p class="muted">Le jeu se compose de 5 catégories de cartes et de 3 jokers par paquet. Chaque carte contient une consigne à réaliser.</p>
      <div class="detail defi"><h4>DÉFI</h4><p>Un défi à réaliser seul, en équipe ou tous ensemble. <span class="muted">Par exemple : un mini-jeu, un mime, un quiz, un challenge ou un exercice d'observation.</span></p></div>
      <div class="detail verite"><h4>VÉRITÉ</h4><p>Réponds franchement à la question posée (ou bois une gorgée !). Une vérité ne fait pas avancer Sonia.</p></div>
      <div class="detail duel"><h4>DUEL</h4><p>Affronte un autre joueur dans l'épreuve indiquée sur la carte. Le vainqueur fait avancer Sonia !</p></div>
      <div class="detail gage"><h4>GAGE</h4><p>Un gage à respecter dès que tu pioches la carte, jusqu'à la fin de ton tour. Si tu l'enfreins, tu bois une gorgée et le gage prend fin.</p></div>
      <div class="detail secret"><h4>MISSION SECRÈTE</h4><p>Une mission discrète à accomplir pendant ton tour, sans te faire repérer ! Si tu réussis, tu révèles la carte et Sonia avance de 2 cases. Si tu échoues, tu bois une gorgée et tu révèles la carte.</p></div>
      <div class="detail sonia"><h4>CARTE SONIA</h4><p>Des cartes spéciales qui concernent Sonia ou qui pimentent la partie ! <span class="muted">Leurs effets sont variés : avancer, reculer, relever un défi spécial ou appliquer une règle temporaire.</span></p></div>`,
    },
    {
      id: 'speciales', title: 'Règles spéciales et cas particuliers',
      html: `
      <h4>Règles spéciales</h4>
      ${L([
        'Pour un défi ou un duel collectif, toute l\'équipe doit réussir pour que Sonia avance.',
        'Pour un duel, le perdant boit une gorgée. Pour une épreuve collective, seuls les participants qui échouent boivent ; si tous échouent, tous boivent.',
        'Personne n\'est obligé de boire : une boisson sans alcool, ou un refus, est toujours possible.',
      ])}
      <h4>Cas particuliers</h4>
      ${L([
        'Si une carte te fait relancer le dé, suis le nouvel effet.',
        'Si une carte te fait avancer ou reculer, le déplacement s\'applique immédiatement.',
        'Si une carte place Sonia sur une autre case, déplace son pion immédiatement.',
        'Si plusieurs effets s\'appliquent, suis l\'ordre indiqué sur la carte, de haut en bas.',
      ])}
      <div class="callout"><strong>L'important</strong><br>Tout le monde participe, reste bienveillant et profite du moment !</div>`,
    },
    {
      id: 'cases', title: 'Les cases spéciales du plateau',
      html: `
      <p class="muted">Ces cases ont un effet immédiat, en plus des cartes que tu peux piocher !</p>
      <div class="cases">
        <div><b>Départ</b>Sonia commence ici. Chaque joueur place aussi son pion sur la case départ.</div>
        <div><b>Case normale</b>Tu pioches la carte qui correspond à la couleur de la case et tu appliques son effet.</div>
        <div><b>Case Sonia</b>Tu pioches une carte Sonia et tu appliques son effet.</div>
        <div><b>Avance</b>Avance du nombre de cases indiqué sur la case.</div>
        <div><b>Recule</b>Recule du nombre de cases indiqué sur la case.</div>
        <div><b>Relance</b>Relance immédiatement le dé et applique le nouvel effet.</div>
        <div><b>Gorgée</b>Tout le monde boit une gorgée.</div>
        <div><b>Échange</b>Échange ta place avec le joueur de ton choix.</div>
        <div><b>Téléportation</b>Lance le dé. Sur un 1 ou un 6, avance jusqu'à la case indiquée. Sur un 2, 3, 4 ou 5, recule jusqu'à la case indiquée.</div>
        <div><b>Case bonus</b>Applique le bonus indiqué sur la case.</div>
        <div><b>Case malus</b>Applique le malus indiqué sur la case.</div>
        <div><b>Case spéciale</b>Applique la règle indiquée sur la case.</div>
        <div><b>Arrivée</b>Quand Sonia atteint la case finale, tout le monde gagne !</div>
      </div>
      <p class="muted">Objectif : faire arriver Sonia au bout, tous ensemble !</p>`,
    },
    {
      id: 'defi', title: 'Règles cartes Défi',
      html: `<p class="muted">Certaines cartes Défi ont des règles particulières. Si la carte ne précise pas de durée, tu as 30 secondes pour te préparer, puis une minute pour réaliser le défi.</p>
      ${num('N° 1 à 8', 'Tu ne dois jamais prononcer le nom de la réponse à trouver. Les imitations parlées sont autorisées.')}
      ${num('N° 19', 'Tu fredonnes la mélodie sans prononcer de paroles : les autres doivent deviner le titre de la chanson.')}
      ${num('N° 20', 'C\'est le groupe qui choisit le style musical dans lequel tu chantes.')}
      ${num('N° 21', 'C\'est le groupe qui choisit la chanson sur laquelle tu fais ton playback.')}
      ${num('N° 23 à 27 et 29', 'Aucun doublon dans ta liste. Si une réponse est contestée, le groupe tranche.')}
      ${num('N° 26', 'Les cinq mots doivent être tous différents. Les formes verbales et adjectivales sont acceptées.')}
      ${num('N° 30', 'La tour de six objets doit tenir seule pendant trois secondes.')}
      ${num('N° 31', 'Tu lances la boulette de papier dans un verre placé à un mètre. Tu as trois essais et un seul succès suffit.')}
      ${num('N° 32', 'La cuillère doit rester en équilibre sur ton doigt pendant dix secondes, sans que tu la retiennes.')}
      ${num('N° 33', 'Le groupe doit reconnaître le chat sans que tu donnes le moindre indice à l\'oral.')}
      ${num('N° 35', 'Fixez un point de départ et un point d\'arrivée à 50 cm l\'un de l\'autre. Tu fais avancer la boulette de papier uniquement en soufflant dessus.')}
      ${num('N° 36, 38 et 42', 'La réussite est collective : dès que la scène ou la chorégraphie a été jouée, le défi est réussi.')}
      ${num('N° 37 et 44', 'Tous les mots donnés doivent apparaître dans ton histoire.')}
      ${num('N° 41', 'Les autres joueurs te posent des questions fermées. Tu réponds uniquement par oui ou par non.')}`,
    },
    {
      id: 'verite', title: 'Règles cartes Vérité',
      html: `<p class="muted">Des questions personnelles, drôles ou surprenantes : réponds franchement !</p>
      ${num('N° 1 à 20 et 31 à 41', 'Tu réponds franchement à la question posée. Si tu refuses de répondre, tu bois une gorgée.')}
      ${num('N° 21 à 30', 'Le joueur qui pioche la carte désigne une personne. C\'est cette personne qui répond à la question. Si elle refuse de répondre, elle boit une gorgée.')}
      ${num('N° 42 à 45', 'Tout le monde vote pour désigner la personne visée par la question. Si le vote est unanime, la personne désignée boit une gorgée.')}
      <p class="muted">Une vérité ne fait pas avancer Sonia.</p>`,
    },
    {
      id: 'duels', title: 'Règles cartes Duel',
      html: `<p class="muted">Les duels permettent de s'affronter entre joueurs pour pimenter la partie ! Le vainqueur fait avancer Sonia d'une case et le perdant boit une gorgée.</p>
      ${num('N° 1', 'Chaque victoire à pierre-feuille-ciseaux vaut un point : le premier à trois victoires gagne.')}
      ${num('N° 2', 'Le premier qui rit perd le duel.')}
      ${num('N° 3', 'Les cinq objets rouges doivent être différents les uns des autres.')}
      ${num('N° 4', 'Sonia choisit les deux objets, qui doivent être facilement accessibles.')}
      ${num('N° 5', 'Sonia annonce les trois couleurs l\'une après l\'autre. À chaque couleur, le premier qui touche un objet de la bonne couleur marque un point. Le premier à deux points gagne.')}
      ${num('N° 6', 'Au Dobble, vous jouez cinq manches : à chaque manche, il faut nommer le symbole commun. Celui qui gagne le plus de manches l\'emporte.')}
      ${num('N° 7', 'Au signal, le dernier à lever son pouce perd le duel.')}
      ${num('N° 8 à 13', 'Pour les énumérations, une réponse fausse, déjà donnée ou plus de trois secondes d\'hésitation font perdre le duel. À l\'alphabet à deux, la première erreur fait perdre.')}
      ${num('N° 14', 'La tour de six objets doit tenir seule pendant trois secondes.')}
      ${num('N° 15', 'Le premier dont la cuillère tombe perd le duel.')}
      ${num('N° 16', 'Le groupe vote pour le meilleur cochon dessiné.')}
      ${num('N° 17', 'La pièce qui s\'arrête le plus près du bord, sans tomber, gagne.')}
      ${num('N° 18', 'Les deux joueurs transportent le même objet et suivent le même parcours.')}
      ${num('N° 19', 'La cible et la distance sont les mêmes pour les deux joueurs, avec un seul lancer chacun.')}
      ${num('N° 20 à 25', 'Le groupe vote pour la meilleure prestation.')}
      ${num('N° 28', 'Chaque joueur répète dans l\'ordre les éléments déjà cités, puis en ajoute un nouveau.')}
      ${num('N° 29', 'Vous avez trois tentatives. Si deux personnes parlent en même temps, on recommence. Si vous atteignez 15, tous les participants réussissent ; sinon c\'est un échec collectif.')}
      ${num('N° 32', 'Chacun des trois joueurs raconte une anecdote, et au moins une des trois est fausse. Les autres votent pour démasquer les menteurs.')}
      ${num('N° 33', 'Le joueur raconte trois histoires, deux vraies et une fausse. Les autres votent pour trouver le mensonge.')}
      ${num('N° 35', 'Tous les nombres de 1 à 100 sont possibles : chacun écrit son nombre avant que le nombre cible soit tiré au sort.')}
      ${num('N° 36', 'Chacun vote en secret, puis les votes sont révélés ensemble.')}
      ${num('N° 37 à 41', 'Ce sont des épreuves par équipes : appliquez la consigne de la carte. Pour le blind test, la première équipe à trouver trois bonnes réponses gagne.')}
      ${num('N° 42 à 45', 'Ces improvisations collectives sont réussies dès que la scène a été jouée.')}
      <p class="muted">Pour une épreuve collective, seuls les participants qui échouent boivent une gorgée ; si tous échouent, tous boivent.</p>`,
    },
    {
      id: 'gage', title: 'Règles cartes Gage',
      html: `<p class="muted">Des comportements temporaires, des interactions et des missions secrètes pour pimenter la partie !</p>
      ${num('Durée', 'Un gage dure un seul tour : de ton tirage jusqu\'à ton prochain passage, avant ton lancer de dé. Tu ne peux avoir qu\'un seul gage actif à la fois : le nouveau remplace l\'ancien.')}
      ${num('Infraction', 'À la première infraction, tu bois une gorgée immédiatement et le gage prend fin. Si tu tiens ton gage jusqu\'au bout, Sonia avance d\'une case.')}
      ${num('N° 36 à 41', '<b>Missions secrètes.</b> Ces cartes restent cachées et durent un tour au maximum. Si tu réussis, tu révèles la carte et Sonia avance de 2 cases. Si tu échoues, tu bois une gorgée à ton prochain passage, puis tu révèles la carte.')}
      ${num('N° 42 et 43', 'Ces gages durent une minute, et non un tour.')}
      ${num('N° 45', 'Ce gage dure trente secondes, et non un tour.')}`,
    },
    {
      id: 'sonia', title: 'Règles cartes Sonia',
      html: `<p class="muted">Les cartes Sonia mettent Sonia au cœur de la partie ! Elles ne font avancer Sonia que si la carte l'indique.</p>
      ${num('N° 9 à 17', 'Sonia juge les réponses : c\'est elle qui dit si elles sont correctes.')}
      ${num('N° 18 à 25', 'Ce sont des questions d\'opinion : il n\'y a pas de mauvaise réponse.')}
      ${num('N° 26 à 32', '<b>Sonia participe personnellement à l\'épreuve.</b> Personne ne peut la remplacer.')}
      ${num('N° 26', 'Le groupe vote pour désigner la meilleure grimace.')}
      ${num('N° 27', 'Sonia doit deviner qui ou quoi tu imites.')}
      ${num('N° 28', 'Tu fredonnes la chanson sans prononcer de paroles, pour que Sonia devine le titre.')}
      ${num('N° 29', 'Chaque manche gagnée vaut un point : le premier à deux points gagne.')}
      ${num('N° 30', 'Le premier qui rit perd.')}
      ${num('N° 35', 'Le joueur désigné rejoue immédiatement : il lance le dé et applique la case sur laquelle il arrive. Ensuite, la partie reprend dans l\'ordre normal, sans que personne soit sauté.')}
      ${num('N° 39', 'L\'effet disparaît dès la prochaine sanction, que Sonia l\'utilise ou non. Pour une épreuve collective, elle ne peut protéger qu\'une seule personne.')}
      ${num('N° 40', 'Tous les joueurs changent de place autour de la table, sauf Sonia. Les pions ne bougent pas sur le plateau.')}
      ${num('N° 41 et 43', 'Pas de doublon, et chacun a cinq secondes pour répondre.')}
      ${num('N° 42', 'À partir de maintenant, tout le monde doit appeler Sonia par ce surnom, jusqu\'à la fin de la partie.')}`,
    },
    {
      id: 'jokers', title: 'Les jokers',
      html: `<p class="muted">Les jokers peuvent te sauver... ou retourner la situation ! Chaque paquet en contient trois, mélangés aux autres cartes.</p>
      <div class="detail joker"><h4>JOKER ÉCHANGE</h4><p>Pioche <mark class="m-duel">deux cartes supplémentaires</mark> dans le même paquet. Choisis celle que tu veux jouer et remets l'autre dans la pile.</p></div>
      <div class="detail joker"><h4>JOKER COLLECTIF</h4><p>Pioche une carte. Si elle est compatible, tu peux transformer ton épreuve en <mark class="m-duel">action collective</mark>.</p></div>
      <div class="detail joker"><h4>JOKER AIDE</h4><p>Pioche une carte classique. Si elle est compatible, choisis un <mark class="m-verite">joueur consentant</mark> pour t'aider à la réaliser.</p></div>
      <div class="callout warn">${L(['Si un joker n\'est pas applicable à la carte que tu as piochée, ou si tu choisis de ne pas l\'utiliser, il est remis dans la pile.', 'Tu ne peux utiliser qu\'un seul joker par carte.'])}</div>`,
    },
  ];
  const sg = (t) => t.replace(/Sonia/g, 'Sogne').replace(/SONIA/g, 'SOGNE');
  window.RULES = RULES.map((s) => ({ ...s, title: sg(s.title), html: sg(s.html) }));
})();
