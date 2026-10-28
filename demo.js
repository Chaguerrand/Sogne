'use strict';
// Paquet de test : fausses cartes (langues inventées) servies à la place de cards.json tant que les cartes sont verrouillées.
// Même structure que les vraies cartes (5 piles, mission secrète, chrono, précisions ; pas de jokers), mais aucun vrai texte.

// Chaque langue : [court, moyen, long (> 80 caractères), très long (> 125 caractères)]
const LANGS = [
  ['Sindarin', [
    'Mae govannen, mellon nin !',
    'Ae pedich edhellen, tolo na nin ar cenich i galadh dîn sui i ôr.',
    'Pedo mellon a minno. Le nallon sí di\'nguruthos, a galadh en ennyn lín lacha nan eryn dhaer, ar i annon pador.',
    'Pedo mellon a minno. Le nallon sí di\'nguruthos, a galadh en ennyn lín lacha nan eryn dhaer, ar i annon pador e-chebin. Tolo na nin, ae pedich edhellen, cenich i galadh dîn.',
  ]],
  ['Quenya', [
    'Aiya, meldonya ! Namárië.',
    'Alcar mi tarmenel ar sílë i Isil mi yarra, meldonya, ar nai hiruvalyë Valimar.',
    'Alcar mi tarmenel ar sílë i Isil mi yarra, meldonya. Nai hiruvalyë Valimar, ar i vilya nauva laiqua mi andúnë, sí ar tennoio.',
    'Alcar mi tarmenel ar sílë i Isil mi yarra, meldonya. Nai hiruvalyë Valimar, ar i vilya nauva laiqua mi andúnë, sí ar tennoio. Tuilë tulë, ar i eleni caltar mi menel.',
  ]],
  ['Langue noire de Mordor', [
    'Ash nazg burzum, agh ghâsh !',
    'Uruk-hai snaga gimbatul ash ghâsh, agh nazg thrakatul burzum-ishi.',
    'Ghâsh-ishi krimpatul uruk-hai agh snaga burzum, ash nazg durbat agh thrak, lugbûrz ushat gimb nazgul gash.',
    'Ghâsh-ishi krimpatul uruk-hai agh snaga burzum, ash nazg durbat agh thrak, lugbûrz ushat gimb nazgul gash. Uruk-hai snaga gimbatul ash ghâsh, agh nazg thrakatul burzum.',
  ]],
  ['Aurebesh', [
    'Aurek, Besh, Cresh, Dorn, Esk, Forn !',
    'Aurek Besh Cresh Dorn Esk Forn Grek Herf Isk Jenth Krill Leth Mern.',
    'Aurek Besh Cresh Dorn Esk Forn Grek Herf Isk Jenth Krill Leth Mern Nern Osk Peth Qek Resh Senth Trill.',
    'Aurek Besh Cresh Dorn Esk Forn Grek Herf Isk Jenth Krill Leth Mern Nern Osk Peth Qek Resh Senth Trill Usk Vev Wesk Xesh Yirt Zerek.',
  ]],
  ['Dothraki', [
    'Anha zhilak yera, khalakka !',
    'Yer shekh ma shieraki anni, khal, ven anha dothrak athdrivar vezhvena.',
    'Yer shekh ma shieraki anni, khal, ven anha dothrak athdrivar vezhvena. Me nem nesa, ma qoy qoyi, fin zhavvorsa jin kash.',
    'Yer shekh ma shieraki anni, khal, ven anha dothrak athdrivar vezhvena. Me nem nesa, ma qoy qoyi, fin zhavvorsa jin kash. Anha vazhak yer, khalakka dothrae mr\'anha, athchomar chomakaan.',
  ]],
  ['Haut valyrien', [
    'Valar morghulis, drakarys !',
    'Skoros ñuhys iksan, valonqar. Zaldrīzes iā issa daor, kesrio ñuhyz.',
    'Skoros ñuhys iksan, valonqar. Zaldrīzes iā issa daor, kesrio ñuhyz, ao dōna mērī rhaenys ñuhoso lēkia gaomagon.',
    'Skoros ñuhys iksan, valonqar. Zaldrīzes iā issa daor, kesrio ñuhyz, ao dōna mērī rhaenys ñuhoso lēkia gaomagon. Valar dohaeris, ñuhoso dārys, se ilvo muñ ñuhyz sōvegon.',
  ]],
  ['Klingon', [
    'nuqneH ! Qapla\' !',
    'Heghlu\'meH QaQ jajvam, tlhIngan Hol vIjatlh vIneH, qaStaH nuq ?',
    'Heghlu\'meH QaQ jajvam, tlhIngan Hol vIjatlh vIneH, qaStaH nuq ? bIQaptaH, bortaS bIr jablu\'DI\' reH QaQqu\' noy.',
    'Heghlu\'meH QaQ jajvam, tlhIngan Hol vIjatlh vIneH, qaStaH nuq ? bIQaptaH, bortaS bIr jablu\'DI\' reH QaQqu\' noy. Qapla\' ! HIja\', bIyIntaH, majQa\' Dujmey rur.',
  ]],
  ['Na\'vi', [
    'Oel ngati kameie, sìltsan !',
    'Kaltxì ma eylan, nga fko lu fìtxan nìftxavang, ulte oel tìrey sunu.',
    'Kaltxì ma eylan, nga fko lu fìtxan nìftxavang, ulte oel tìrey sunu. Tsawke ayfo lu fìtsenge, ma smuk, pxaya tìkangkem.',
    'Kaltxì ma eylan, nga fko lu fìtxan nìftxavang, ulte oel tìrey sunu. Tsawke ayfo lu fìtsenge, ma smuk, pxaya tìkangkem. Eywa ngahu, ma sempul, ulte kllte pxaya hapxìtu nìwotx.',
  ]],
  ['Huttese', [
    'Boska, ma bargon !',
    'Mee tuta wompa, du chuba na kikeesh, jee dwanna ma koochoo.',
    'Mee tuta wompa, du chuba na kikeesh, jee dwanna ma koochoo. Boska ! Nuba nuba kee, pa doopa chee-ya gee towa.',
    'Mee tuta wompa, du chuba na kikeesh, jee dwanna ma koochoo. Boska ! Nuba nuba kee, pa doopa chee-ya gee towa. Chuba tuta mee jabba, nee ke du-sa, boonowa solo kee kee.',
  ]],
  ['Minionois', [
    'Bello ! Banana ! Papoy !',
    'Tulaliloo ti amo, bee-do bee-do, poopaye gelatooo, kampai !',
    'Tulaliloo ti amo, bee-do bee-do, poopaye gelatooo, kampai ! Bananaaa potatoooo, la boda, underwaaa, tank yu !',
    'Tulaliloo ti amo, bee-do bee-do, poopaye gelatooo, kampai ! Bananaaa potatoooo, la boda, underwaaa, tank yu ! Pwede na ka, para tu, hana dul sae, belloooo papagena, bappleees !',
  ]],
  ['Simlish', [
    'Sul sul ! Dag dag !',
    'Nooboo frendo glorp, dag dag ! Sul sul wa ni sim-sim, zibba dooble.',
    'Nooboo frendo glorp, dag dag ! Sul sul wa ni sim-sim, zibba dooble. Orbo kamba lisa, frooble nazza, doo-bee doo-bee gleeba.',
    'Nooboo frendo glorp, dag dag ! Sul sul wa ni sim-sim, zibba dooble. Orbo kamba lisa, frooble nazza, doo-bee doo-bee gleeba. Zoombi wapa nee, sul sul, dag dag, kibble norbo sim-sim.',
  ]],
  ['Lorem ipsum', [
    'Lorem ipsum dolor sit amet.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.',
  ]],
];

// Cartes particulières, pour pouvoir tester toutes les fonctions : [pile, numéro] -> texte imposé / options
const SPECIAL = {
  'defi-3': { text: 'Heghlu\'meH QaQ jajvam, Qapla\' ! Tu as 30 secondes.' },
  'duel-5': { text: 'Mee tuta wompa, boska ! Vous avez une minute.' },
  'gage-6': { secret: true },
};

function build(real) {
  const cards = [];
  real.piles.forEach((p, pi) => {
    for (let n = 1; n <= 10; n++) {
      const li = (n - 1 + pi * 3) % LANGS.length;
      const [name, variants] = LANGS[li];
      const sp = SPECIAL[`${p.id}-${n}`] || {};
      cards.push({
        id: `demo-${p.id}-${String(n).padStart(2, '0')}`, pile: p.id, number: n, kind: 'card', secret: !!sp.secret,
        text: sp.text || variants[(n - 1 + pi) % 4],
        precisions: n % 3 === 0 && !sp.secret ? [LANGS[(li + 5) % LANGS.length][1][1]] : [], // une carte sur trois a une précision, elle aussi en langue inventée
      });
    }
  });
  return { demo: true, piles: real.piles, jokers: real.jokers, rules: real.rules, cards };
}

module.exports = { build, LANGS };
