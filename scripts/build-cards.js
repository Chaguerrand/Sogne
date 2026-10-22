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

// Corrections de texte validées (règle finale prime sur le texte historique)
const OVERRIDES = {
  'gage-02': 'Joue au ni oui ni non pendant un tour.',
  'gage-29': "Demande l'autorisation à ton voisin avant de parler, pendant un tour.",
  'duel-05': 'Réflexe de couleur : Sonia annonce 3 couleurs successives. Un point au premier qui touche un objet de la bonne couleur. Le premier à 2 points gagne.',
};

// Précisions (livret de règles + référentiel §4), par catégorie et numéros.
const R = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const PREC = {
  defi: [
    [R(1, 8), "Ne prononce jamais le nom de la réponse recherchée. Les imitations parlées sont autorisées."],
    [[19], "Fredonne sans paroles pour faire deviner le titre de la chanson."],
    [[20], "Le groupe impose le style musical."],
    [[21], "Le groupe impose la chanson du playback."],
    [[23, 24, 25, 26, 27, 29], "Aucun doublon dans les énumérations. Le groupe arbitre les réponses litigieuses."],
    [[26], "Trouve cinq mots distincts rimant avec « soirée ». Formes verbales et adjectivales acceptées."],
    [[30], "Construis une tour de six objets tenant seule pendant trois secondes."],
    [[31], "Lance une boulette de papier dans un verre à un mètre. Trois essais, un seul succès suffit."],
    [[32], "Maintiens une cuillère en équilibre sur un doigt pendant dix secondes, sans la retenir."],
    [[33], "Dessine un chat les yeux fermés. Le groupe doit le reconnaître, sans indice oral."],
    [[35], "Souffle une petite boulette de papier sur 50 cm, entre un départ et une arrivée définis."],
    [[36, 38, 42], "La réalisation de la scène ou de la chorégraphie suffit à valider la réussite collective."],
    [[37, 44], "Tous les mots imposés doivent être utilisés."],
    [[41], "Les autres joueurs posent des questions fermées. Réponds uniquement par oui ou non."],
  ],
  verite: [
    [[...R(1, 20), ...R(31, 41)], "Tu réponds à la question posée, franchement. Si tu refuses de répondre : tu bois une gorgée."],
    [R(21, 30), "Le joueur qui pioche la carte désigne une personne. C'est cette personne qui répond à la question. Si elle refuse de répondre : elle boit une gorgée."],
    [R(42, 45), "Tout le monde vote pour élire la personne visée. Si unanimité, l'élu(e) boit une gorgée."],
  ],
  duel: [
    [[1], "Premier à trois victoires."],
    [[2], "Le premier qui rit perd."],
    [[3], "Cinq objets rouges distincts."],
    [[4], "Deux objets accessibles, choisis par Sonia."],
    [[5], "Trois couleurs annoncées successivement par Sonia. Un point au premier qui touche un objet de la bonne couleur, premier à deux points."],
    [[6], "Dobble, cinq manches : nomme le symbole commun. Meilleur score."],
    [[7], "Le dernier à lever son pouce au signal perd."],
    [R(8, 13), "Pour les énumérations : réponse fausse, répétée ou hésitation de plus de trois secondes = perte. Alphabet à deux : première erreur = perte."],
    [[14], "Tour de six objets tenant seule trois secondes."],
    [[15], "Première cuillère tombée = perte."],
    [[16], "Le groupe vote pour le cochon dessiné."],
    [[17], "La pièce la plus proche du bord, sans tomber."],
    [[18], "Même objet et même parcours."],
    [[19], "Même cible et même distance, un lancer chacun."],
    [R(20, 25), "Le groupe vote pour la meilleure prestation."],
    [[28], "« Dans ma valise » : reprendre les éléments dans l'ordre, puis en ajouter un."],
    [[29], "Compter à 15 sans ordre : trois tentatives, redémarrage si deux voix simultanées. Atteindre 15 = réussite pour tous, sinon échec collectif."],
    [[32], "Trois anecdotes, au moins une fausse. Les autres votent."],
    [[33], "Deux vérités et un mensonge."],
    [[35], "Nombres de 1 à 100 écrits avant le tirage du nombre cible."],
    [[36], "Vote secret du plus compétitif."],
    [R(37, 41), "Compétitions par équipes : appliquer la consigne de la carte. Blind test : premier à trois bonnes réponses."],
    [R(42, 45), "Improvisations collectives validées par la réalisation de la scène."],
  ],
  gage: [
    [[...R(1, 35), ...R(42, 45)], "Ce gage dure un seul tour : de ton tirage jusqu'au prochain passage, avant ton lancer de dé. Un seul gage actif par joueur. Première infraction : une gorgée immédiate et fin du gage."],
    [[12], "Tu dois applaudir lorsque Sonia termine une phrase."],
    [R(42, 43), "La durée du gage est d'une minute."],
    [[45], "La durée du gage est de trente secondes."],
  ],
  sonia: [
    [R(9, 17), "Sonia juge les réponses de quiz."],
    [R(18, 25), "Questions d'opinion : pas de mauvaise réponse."],
    [R(26, 32), "Sonia participe personnellement, sans remplaçant."],
    [[26], "Grimaces : le groupe vote."],
    [[27], "Sonia devine l'imitation."],
    [[28], "Chanson fredonnée sans paroles."],
    [[29], "Premier à deux points."],
    [[30], "Le premier qui rit perd."],
    [[35], "Le joueur désigné rejoue immédiatement : il lance le dé et exécute la case. L'ordre normal reprend ensuite, sans sauter personne."],
    [[39], "L'effet expire à la PROCHAINE sanction, qu'il soit utilisé ou non. En collectif, Sonia protège une seule personne."],
    [[40], "Les pions ne bougent pas."],
    [[41, 43], "Pas de doublon ; cinq secondes par réponse."],
    [[42], "Tout le monde doit appeler Sonia par ce surnom jusqu'à la fin de la partie."],
  ],
};

// Rappel de barème (règles validées), par pile
const RULE = {
  defi: 'Défi réussi : Sonia avance de 1 case. Raté : une gorgée. Sans durée précisée : 30 secondes de préparation puis 1 minute.',
  verite: 'Vérité répondue : 0 case. Refus de répondre : une gorgée.',
  duel: 'Duel remporté : Sonia avance de 1 case. Le perdant boit une gorgée.',
  gage: 'Gage tenu jusqu\'au bout : Sonia avance de 1 case. Gage non respecté : une gorgée et fin du gage.',
  sonia: 'Carte Sonia : déplacement uniquement si la carte l\'indique.',
};
const RULE_SECRET = 'Mission réussie : révèle-la, Sonia avance de 2 cases. Échec au prochain passage : une gorgée puis révélation.';

const sogne = (t) => t.replace(/Sonia/g, 'Sogne');

const cards = [];
for (const p of PILES) {
  const list = src.cards.filter((c) => c.category === p.cat).sort((a, b) => a.number - b.number);
  if (list.length !== 45) throw new Error(`pile ${p.id}: ${list.length} cartes au lieu de 45`);
  for (const c of list) {
    const key = `${p.id === 'verite' ? 'vérité' : p.id === 'defi' ? 'défi' : p.id}-${String(c.number).padStart(2, '0')}`;
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
  echange: { label: 'ÉCHANGE', rule: 'Pioche deux cartes classiques supplémentaires dans le même paquet. Choisis-en une à jouer ; remets l\'autre dans la pile.' },
  collectif: { label: 'COLLECTIF', rule: 'Pioche une carte classique. Si elle est compatible, tu peux transformer ton épreuve en action collective.' },
  aide: { label: 'AIDE', rule: 'Pioche une carte classique. Si elle est compatible, choisis un autre joueur consentant pour t\'aider à la réaliser.' },
};
const out = { piles: PILES.map(({ id, label }) => ({ id, label })), jokers: JOKERS, cards };
fs.writeFileSync(path.join(__dirname, '..', 'public', 'cards.json'), JSON.stringify(out));
console.log('cards:', cards.length, '(classiques', cards.filter((c) => c.kind === 'card').length, '+ jokers', cards.filter((c) => c.kind === 'joker').length, ')');
