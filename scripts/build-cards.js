// Construit public/cards.json à partir du JSON source (225 cartes) + jokers + corrections validées + précisions.
// Règle : texte historique conservé dans "source_text", texte affiché dans "text".
const fs = require('fs');
const path = require('path');
const src = JSON.parse(fs.readFileSync(path.join(__dirname, 'source-cards.json'), 'utf8'));

const PILES = [
  { id: 'defi', label: 'DÉFI', cat: 'DÉFI' },
  { id: 'verite', label: 'VÉRITÉ', cat: 'VÉRITÉ' },
  { id: 'duel', label: 'DUEL', cat: 'DUEL' },
  { id: 'gage', label: 'GAGE', cat: 'GAGE' },
  { id: 'sonia', label: 'SOGNE', cat: 'SONIA' },
];

// Textes affichés : l'original est conservé dans "source_text". Les règles finales priment sur le texte historique,
// et les consignes sont reformulées en phrases complètes (sans changer les règles du jeu).
// Attention : une durée en chiffres ("20 secondes", "une minute") dans le texte déclenche le chrono de la carte.
const OVERRIDES = {
  // DÉFI
  'defi-01': "Imite un des joueurs présents. Les autres doivent deviner de qui il s'agit.",
  'defi-02': "Imite la célébrité que le groupe a choisie pour toi.",
  'defi-03': "Mime un film pour le faire deviner aux autres joueurs.",
  'defi-04': "Imite un animal choisi par ton voisin. Les autres doivent deviner lequel.",
  'defi-05': "Mime une scène de rupture amoureuse. Les autres doivent deviner de quoi il s'agit.",
  'defi-06': "Mime une expression française pour la faire deviner aux autres joueurs.",
  'defi-07': "Mime une série télé pour la faire deviner aux autres joueurs.",
  'defi-08': "Imite un personnage de dessin animé. Les autres doivent deviner lequel.",
  'defi-09': "Fais une déclaration d'amour passionnée à un objet de ton choix.",
  'defi-10': "Présente un objet de ton choix comme une invention révolutionnaire et essaie de le vendre au groupe.",
  'defi-11': "Prononce un discours de victoire, comme si tu venais de remporter un Oscar.",
  'defi-12': "Présente la météo comme un vrai présentateur, en annonçant une catastrophe.",
  'defi-13': "Joue un serveur qui doit annoncer aux clients qu'il n'y a plus rien à manger.",
  'defi-14': "Improvise une bande-annonce dramatique sur le thème de la soirée.",
  'defi-15': "Imite un influenceur qui essaie de vendre un produit totalement inutile.",
  'defi-16': "Invente une histoire d'horreur dans laquelle apparaît un objet choisi par le groupe.",
  'defi-17': "Défends une théorie du complot absurde pendant 30 secondes.",
  'defi-18': "Improvise une chorégraphie de 20 secondes devant le groupe.",
  'defi-19': "Fais deviner une chanson aux autres joueurs en la fredonnant.",
  'defi-20': "Chante « Joyeux anniversaire » dans un style musical choisi par le groupe.",
  'defi-21': "Fais un playback dramatique sur une chanson choisie par le groupe.",
  'defi-22': "Transforme une comptine pour enfants en chanson de rap.",
  'defi-23': "Tu as 20 secondes pour citer 10 pays.",
  'defi-24': "Tu as 20 secondes pour citer 8 films Disney.",
  'defi-25': "Tu as 15 secondes pour citer 7 marques de voitures.",
  'defi-26': "Tu as 20 secondes pour trouver 5 mots qui riment avec « soirée ».",
  'defi-27': "Cite 8 célébrités qui ont la même initiale. C'est le groupe qui choisit la lettre.",
  'defi-28': "Raconte une histoire de 20 secondes sans jamais utiliser le verbe « être ».",
  'defi-29': "Tu as 30 secondes pour citer 5 chansons qui contiennent un prénom dans leur titre.",
  'defi-30': "Construis une tour de 6 objets. Elle doit tenir seule pendant trois secondes.",
  'defi-31': "Lance une boulette de papier dans un verre placé à 1 mètre de toi. Tu as 3 essais et un seul succès suffit.",
  'defi-32': "Fais tenir une cuillère en équilibre sur un doigt pendant 10 secondes, sans la retenir.",
  'defi-33': "Dessine un chat les yeux fermés. Le groupe doit le reconnaître sans que tu donnes d'indice à l'oral.",
  'defi-34': "Écris ton prénom de ta main non dominante en moins de 15 secondes.",
  'defi-35': "Fais avancer une petite boulette de papier sur 50 cm en soufflant dessus, entre un point de départ et un point d'arrivée définis.",
  'defi-36': "Choisis deux joueurs et improvisez ensemble une publicité ridicule.",
  'defi-37': "Trois joueurs te donnent chacun un mot. Invente une histoire qui utilise ces trois mots.",
  'defi-38': "Organise une chorégraphie de 15 secondes avec trois joueurs volontaires.",
  'defi-39': "Parle dans une langue inventée. Un autre joueur doit traduire ce que tu dis.",
  'defi-40': "Fais une déclaration d'amitié exagérée à un joueur de ton choix.",
  'defi-41': "Fais deviner une célébrité aux autres joueurs. Ils te posent des questions et tu réponds uniquement par oui ou par non.",
  'defi-42': "Choisis trois joueurs et fais-leur jouer une scène improvisée.",
  'defi-43': "Fais un discours de remerciement en citant au moins cinq personnes présentes.",
  'defi-44': "Le groupe te donne cinq mots improbables. Invente une histoire qui utilise ces cinq mots.",
  'defi-45': "Réponds comme un politicien aux trois questions que te pose un joueur.",
  // VÉRITÉ : « Qui » devient « Parmi les joueurs, qui »
  'verite-21': "Parmi les joueurs, qui survivrait le moins longtemps sur une île déserte ?",
  'verite-22': "Parmi les joueurs, qui serait le pire colocataire ?",
  'verite-23': "Parmi les joueurs, qui deviendrait célèbre pour une raison ridicule ?",
  'verite-24': "Parmi les joueurs, qui risquerait le plus de finir en garde à vue ?",
  'verite-25': "Parmi les joueurs, qui ment le mieux ?",
  'verite-26': "Parmi les joueurs, qui serait le meilleur candidat de téléréalité ?",
  'verite-27': "Parmi les joueurs, qui serait le plus susceptible de rejoindre une secte ?",
  'verite-28': "Parmi les joueurs, qui dépenserait un million d'euros le plus vite ?",
  'verite-29': "Parmi les joueurs, qui serait le pire patron ?",
  'verite-30': "Parmi les joueurs, qui pourrait disparaître une semaine sans prévenir ?",
  'verite-42': "Parmi les joueurs, qui arriverait en retard à son propre mariage ?",
  'verite-43': "Parmi les joueurs, qui garderait le moins longtemps un secret ?",
  'verite-44': "Parmi les joueurs, qui serait éliminé en premier d'un jeu de stratégie ?",
  'verite-45': "Parmi les joueurs, qui serait le pire organisateur de vacances ?",
  // DUEL
  'duel-01': "Jouez à pierre-feuille-ciseaux. Le premier à 3 victoires gagne.",
  'duel-03': "Trouvez chacun 5 objets rouges différents. Le premier qui les a tous trouvés gagne.",
  'duel-04': "Rapportez chacun deux objets choisis par Sonia. Le premier qui les a rapportés gagne.",
  'duel-05': "Réflexe de couleur : Sonia annonce trois couleurs, l'une après l'autre. À chaque couleur, le premier qui touche un objet de la bonne couleur marque un point. Le premier à 2 points gagne.",
  'duel-06': "Jouez au Dobble en 5 manches. Celui qui gagne le plus de manches l'emporte.",
  'duel-07': "Jeu des pouces : posez vos pouces sur la table. Au signal, le dernier à lever le sien perd.",
  'duel-10': "Récitez l'alphabet à deux, une lettre chacun, le plus vite possible. Le premier qui se trompe perd.",
  'duel-12': "Citez des célébrités à tour de rôle : le prénom de chacune doit commencer par la dernière lettre du prénom précédent. Le premier qui bloque perd.",
  'duel-14': "Construisez chacun une tour de 6 objets qui tient seule pendant trois secondes. Le premier qui y arrive gagne.",
  'duel-15': "Faites tenir chacun une cuillère en équilibre sur un doigt. Le premier qui la fait tomber perd.",
  'duel-16': "Dessinez chacun un cochon les yeux fermés. Le groupe vote pour le plus réussi.",
  'duel-17': "Faites glisser chacun une pièce sur la table. Celle qui s'arrête le plus près du bord, sans tomber, gagne.",
  'duel-18': "Transportez chacun un objet sur le dos de la main, en suivant le même parcours. Le premier qui le fait tomber perd.",
  'duel-19': "Lancez chacun une boulette de papier sur la même cible. La plus proche de la cible gagne.",
  'duel-20': "Inventez chacun un slogan pour Sonia. Le groupe vote pour le meilleur.",
  'duel-23': "Faites chacun une publicité pour le même objet. Le groupe vote pour la meilleure.",
  'duel-24': "Faites chacun un compliment original à votre adversaire. Le groupe vote pour le meilleur.",
  'duel-25': "Inventez chacun un titre de film sur la soirée. Le groupe vote pour le meilleur.",
  'duel-28': "Jouez à « Dans ma valise » : chacun répète les éléments déjà cités, dans l'ordre, puis en ajoute un. Le premier qui se trompe perd.",
  'duel-29': "Comptez ensemble jusqu'à 15, sans ordre défini : n'importe qui peut dire le nombre suivant. Si deux personnes parlent en même temps, recommencez !",
  'duel-31': "Citez un film chacun, à tour de rôle. Plus de 3 secondes d'hésitation et c'est perdu !",
  'duel-32': "Trois joueurs racontent chacun une anecdote, et au moins une des trois est fausse. Les autres votent pour démasquer les menteurs !",
  'duel-33': "Deux vérités, un mensonge : un joueur raconte trois histoires dont une est fausse, et les autres votent pour trouver le mensonge.",
  'duel-34': "Inventez chacun une définition pour un mot absurde. Le groupe juge laquelle est la meilleure.",
  'duel-35': "Choisissez chacun un nombre entre 1 et 100. Celui qui est le plus proche du nombre tiré au sort gagne.",
  'duel-36': "Votez secrètement pour le joueur le plus compétitif, puis révélez les votes ensemble.",
  'duel-38': "Blind test par équipes : la première équipe à trouver 3 bonnes réponses gagne.",
  'duel-39': "Jouez au téléphone arabe par équipes. L'équipe dont la phrase finale est la plus fidèle gagne.",
  'duel-40': "Dessin par équipes : chaque membre ajoute un trait à tour de rôle. Le groupe vote pour le meilleur dessin.",
  'duel-41': "Deux équipes citent des marques de bière à tour de rôle. La première équipe à en citer 10 gagne.",
  'duel-42': "Trois joueurs improvisent une scène de rupture. Le groupe attribue les rôles.",
  'duel-43': "Trois joueurs inventent une histoire ensemble, à raison d'une phrase chacun, pendant une minute.",
  'duel-44': "Trois joueurs rejouent une scène d'un film connu. Le groupe doit deviner lequel.",
  'duel-45': "Quatre joueurs improvisent une scène de restaurant qui tourne à la catastrophe.",
  // GAGE
  'gage-02': "Joue au ni oui ni non pendant un tour.",
  'gage-03': "Commence chacune de tes phrases par « Selon mes sources... ».",
  'gage-04': "Parle de toi uniquement à la troisième personne.",
  'gage-05': "Glisse le mot « cornichon » dans chacune de tes conversations.",
  'gage-06': "Tu n'as pas le droit de dire « je ».",
  'gage-07': "Quand on te parle, réponds toujours par une expression française.",
  'gage-10': "Salue d'une révérence toute personne qui te parle.",
  'gage-27': "Choisis un joueur : vous vous appelez mutuellement « chef ».",
  'gage-28': "Choisis un joueur : vous devez vous vouvoyer.",
  'gage-29': "Demande l'autorisation à ton voisin avant de parler, pendant un tour.",
  'gage-30': "Choisis un joueur qui devient ton porte-parole : c'est lui qui parle à ta place.",
  'gage-31': "Choisis un joueur : vous vous saluez à chaque fois que vous vous croisez.",
  'gage-32': "Trois joueurs te proposent chacun un surnom. Sonia choisit lequel tu gardes.",
  'gage-34': "Choisis un joueur : vous parlez comme si vous étiez en pleine dispute.",
  'gage-42': "Pendant une minute, traite un objet comme s'il était ton meilleur ami.",
  'gage-43': "Pendant une minute, réagis à tout ce qu'on te dit comme à une révélation incroyable.",
  // SOGNE
  'sonia-26': "Fais un duel de grimaces avec Sonia. Le groupe vote pour la plus réussie.",
  'sonia-27': "Fais une imitation de Sonia. Elle doit deviner ce que tu caricatures chez elle.",
  'sonia-29': "Défie Sonia au pierre-feuille-ciseaux en 3 manches : le premier à 2 points gagne.",
  'sonia-30': "Défie Sonia au concours de regard : fixez-vous dans les yeux sans rire. Le premier qui rit perd.",
  'sonia-31': "Fais une publicité pour Sonia en la présentant comme un produit révolutionnaire.",
  'sonia-32': "Pose trois questions à Sonia. Elle doit répondre en un seul mot à chacune.",
  'sonia-33': "Sonia choisit un joueur, qui avance d'une case.",
  'sonia-35': "Sonia désigne un joueur, qui rejoue immédiatement.",
  'sonia-36': "Sonia choisit un joueur, qui tire une carte Défi.",
  'sonia-37': "Sonia désigne un joueur, qui recule de deux cases.",
  'sonia-38': "Sonia choisit un joueur, qui avance de trois cases.",
  'sonia-39': "Sonia peut annuler la prochaine sanction du joueur de son choix.",
  'sonia-41': "Chacun dit à son tour un mot pour décrire Sonia, sans répéter celui d'un autre.",
  'sonia-42': "Le groupe invente un nouveau surnom pour Sonia. Tout le monde doit ensuite l'appeler ainsi jusqu'à la fin de la partie.",
  'sonia-43': "Chacun donne à son tour une qualité de Sonia, sans répéter celle d'un autre.",
  'sonia-45': "Chacun fait une prédiction amusante sur le futur de Sonia.",
};

// Précisions (livret de règles + référentiel), par catégorie et numéros, en phrases complètes.
const R = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const PREC = {
  defi: [
    [R(1, 8), "Tu ne dois jamais prononcer le nom de la réponse à trouver. Les imitations parlées sont autorisées."],
    [[19], "Tu fredonnes la mélodie sans prononcer de paroles : les autres doivent deviner le titre de la chanson."],
    [[20], "C'est le groupe qui choisit le style musical dans lequel tu chantes."],
    [[21], "C'est le groupe qui choisit la chanson sur laquelle tu fais ton playback."],
    [[23, 24, 25, 26, 27, 29], "Aucun doublon dans ta liste. Si une réponse est contestée, le groupe tranche."],
    [[26], "Les cinq mots doivent être tous différents. Les formes verbales et adjectivales sont acceptées."],
    [[30], "La tour de six objets doit tenir seule pendant trois secondes."],
    [[31], "Tu as trois essais et un seul succès suffit."],
    [[32], "La cuillère doit rester en équilibre sur ton doigt pendant dix secondes, sans que tu la retiennes."],
    [[33], "Le groupe doit reconnaître le chat sans que tu donnes le moindre indice à l'oral."],
    [[35], "Fixez un point de départ et un point d'arrivée à 50 cm l'un de l'autre. Tu fais avancer la boulette uniquement en soufflant dessus."],
    [[36, 38, 42], "La réussite est collective : dès que la scène ou la chorégraphie a été jouée, le défi est réussi."],
    [[37, 44], "Tous les mots donnés doivent apparaître dans ton histoire."],
    [[41], "Les autres joueurs te posent des questions fermées. Tu réponds uniquement par oui ou par non."],
  ],
  verite: [
    [[...R(1, 20), ...R(31, 41)], "Tu réponds franchement à la question posée. Si tu refuses de répondre, tu bois une gorgée."],
    [R(21, 30), "Le joueur qui pioche la carte désigne une personne. C'est cette personne qui répond à la question. Si elle refuse de répondre, elle boit une gorgée."],
    [R(42, 45), "Tout le monde vote pour désigner la personne visée par la question. Si le vote est unanime, la personne désignée boit une gorgée."],
  ],
  duel: [
    [[1], "Chaque victoire vaut un point : le premier à trois victoires gagne."],
    [[2], "Le premier qui rit perd le duel."],
    [[3], "Les cinq objets rouges doivent être différents les uns des autres."],
    [[4], "Sonia choisit les deux objets, qui doivent être facilement accessibles."],
    [[5], "Sonia annonce les trois couleurs l'une après l'autre. Le premier à deux points gagne."],
    [[6], "À chaque manche, il faut nommer le symbole commun. Celui qui gagne le plus de manches l'emporte."],
    [[7], "Le dernier à lever son pouce au signal perd le duel."],
    [R(8, 13), "Pour les énumérations, une réponse fausse, déjà donnée ou plus de trois secondes d'hésitation font perdre le duel. À l'alphabet à deux, la première erreur fait perdre."],
    [[14], "La tour de six objets doit tenir seule pendant trois secondes."],
    [[15], "Le premier dont la cuillère tombe perd le duel."],
    [[16], "Le groupe vote pour le meilleur cochon dessiné."],
    [[17], "Les deux joueurs jouent sur la même table, avec la même pièce de monnaie."],
    [[18], "Les deux joueurs transportent le même objet et suivent le même parcours."],
    [[19], "La cible et la distance sont les mêmes pour les deux joueurs, avec un seul lancer chacun."],
    [R(20, 25), "Le groupe vote pour la meilleure prestation."],
    [[28], "Chaque joueur répète dans l'ordre les éléments déjà cités, puis en ajoute un nouveau."],
    [[29], "Vous avez trois tentatives. Si vous atteignez 15, tous les participants réussissent ; sinon c'est un échec collectif."],
    [[32], "Les autres joueurs votent pour désigner l'anecdote fausse."],
    [[33], "Les autres joueurs votent pour désigner le mensonge."],
    [[35], "Tous les nombres de 1 à 100 sont possibles : chacun écrit son nombre avant que le nombre cible soit tiré au sort."],
    [[36], "Chacun vote en secret, puis les votes sont révélés ensemble."],
    [R(37, 41), "Ce sont des épreuves par équipes : appliquez la consigne de la carte. Pour le blind test, la première équipe à trouver trois bonnes réponses gagne."],
    [R(42, 45), "Ces improvisations collectives sont réussies dès que la scène a été jouée."],
  ],
  gage: [
    [[...R(1, 35), 44], "Ce gage dure un seul tour : de ton tirage jusqu'à ton prochain passage, avant ton lancer de dé. Tu ne peux avoir qu'un seul gage actif à la fois. À la première infraction, tu bois une gorgée immédiatement et le gage prend fin."],
    [R(42, 43), "Ce gage dure une minute, et non un tour. À la première infraction, tu bois une gorgée immédiatement et le gage prend fin."],
    [[45], "Ce gage dure trente secondes, et non un tour. À la première infraction, tu bois une gorgée immédiatement et le gage prend fin."],
  ],
  sonia: [
    [R(9, 17), "Sonia juge les réponses : c'est elle qui dit si elles sont correctes."],
    [R(18, 25), "Ce sont des questions d'opinion : il n'y a pas de mauvaise réponse."],
    [R(26, 32), "Sonia participe personnellement à l'épreuve : personne ne peut la remplacer."],
    [[27], "Sonia doit deviner qui ou quoi tu imites."],
    [[28], "Tu fredonnes la chanson sans prononcer de paroles, pour que Sonia devine le titre."],
    [[35], "Le joueur désigné lance le dé et applique la case sur laquelle il arrive. Ensuite, la partie reprend dans l'ordre normal, sans que personne soit sauté."],
    [[39], "L'effet disparaît dès la prochaine sanction, que Sonia l'utilise ou non. Pour une épreuve collective, elle ne peut protéger qu'une seule personne."],
    [[40], "Les pions ne bougent pas sur le plateau : seuls les joueurs changent de place."],
    [[41, 43], "Pas de doublon, et chacun a cinq secondes pour répondre."],
    [[42], "Tout le monde doit appeler Sonia par ce surnom, jusqu'à la fin de la partie."],
  ],
};

// Rappel de barème (règles validées), par pile
const RULE = {
  defi: "Si tu réussis ton défi, Sonia avance d'une case. Si tu échoues, tu bois une gorgée. Quand la carte ne donne pas de durée, tu as 30 secondes pour te préparer, puis une minute pour réaliser le défi.",
  verite: "Une vérité ne fait pas avancer Sonia. Si tu refuses de répondre, tu bois une gorgée.",
  duel: "Le vainqueur du duel fait avancer Sonia d'une case. Le perdant boit une gorgée.",
  gage: "Si tu tiens ton gage jusqu'au bout, Sonia avance d'une case. Si tu l'enfreins, tu bois une gorgée et le gage prend fin.",
  sonia: "Une carte Sonia ne fait avancer Sonia que si la carte l'indique.",
};
const RULE_SECRET = "Si tu réussis ta mission, révèle la carte : Sonia avance de 2 cases. Si tu échoues, tu bois une gorgée et tu révèles la carte à ton prochain passage.";

const sogne = (t) => t.replace(/Sonia/g, 'Sogne');

const cards = [];
for (const p of PILES) {
  const list = src.cards.filter((c) => c.category === p.cat).sort((a, b) => a.number - b.number);
  if (list.length !== 45) throw new Error(`pile ${p.id}: ${list.length} cartes au lieu de 45`);
  for (const c of list) {
    const key = `${p.id}-${String(c.number).padStart(2, '0')}`;
    const display = OVERRIDES[key] || c.text;
    const precs = [];
    for (const [nums, t] of PREC[p.id]) if (nums.includes(c.number)) precs.push(sogne(t));
    const secret = !!c.secret_mission;
    cards.push({
      id: `${p.id}-${String(c.number).padStart(2, '0')}`,
      pile: p.id,
      number: c.number,
      kind: 'card',
      secret,
      text: sogne(display),
      source_text: c.text,
      precisions: precs,
      rule: sogne(secret ? RULE_SECRET : RULE[p.id]),
    });
  }
  for (const j of ['echange', 'collectif', 'aide']) {
    cards.push({ id: `${p.id}-joker-${j}`, pile: p.id, kind: 'joker', joker: j });
  }
}
const JOKERS = {
  echange: { label: 'ÉCHANGE', rule: 'Pioche deux cartes classiques supplémentaires dans le même paquet. Choisis celle que tu veux jouer et remets l\'autre dans la pile.' },
  collectif: { label: 'COLLECTIF', rule: 'Pioche une carte classique. Si elle est compatible, tu peux transformer ton épreuve en action collective.' },
  aide: { label: 'AIDE', rule: 'Pioche une carte classique. Si elle est compatible, choisis un autre joueur consentant pour t\'aider à la réaliser.' },
};
const out = { piles: PILES.map(({ id, label }) => ({ id, label })), jokers: JOKERS, cards };
fs.writeFileSync(path.join(__dirname, '..', 'public', 'cards.json'), JSON.stringify(out));
console.log('cards:', cards.length, '(classiques', cards.filter((c) => c.kind === 'card').length, '+ jokers', cards.filter((c) => c.kind === 'joker').length, ')');
