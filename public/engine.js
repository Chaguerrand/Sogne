/* Moteur de pioche partagé (serveur Node + navigateur pour le mode hors ligne).
   État : { piles: { [pileId]: { remaining: [cardId...] } } }
   - draw : tire la carte du dessus (jokers inclus)
   - drawClassic : tire la première carte NON joker (utilisé pour résoudre un joker)
   - putBack : remet une carte à une position aléatoire de la pile
   Quand une pile est vide : remélange complet des 48 cartes de la pile. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Engine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  function shuffle(a, rnd) {
    rnd = rnd || Math.random;
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function pileIds(cards, pile) { return cards.filter((c) => c.pile === pile).map((c) => c.id); }
  function newPile(cards, pile) { return { remaining: shuffle(pileIds(cards, pile)) }; }
  function newState(data) {
    const piles = {};
    for (const p of data.piles) piles[p.id] = newPile(data.cards, p.id);
    return { piles, reshuffles: {} };
  }
  function isJoker(id) { return /-joker-/.test(id); }
  function reshuffle(state, data, pile) {
    state.piles[pile] = newPile(data.cards, pile);
    state.reshuffles[pile] = (state.reshuffles[pile] || 0) + 1;
  }
  function draw(state, data, pile) {
    const p = state.piles[pile];
    if (!p) return null;
    let reshuffled = false;
    if (p.remaining.length === 0) { reshuffle(state, data, pile); reshuffled = true; }
    const id = state.piles[pile].remaining.shift();
    return { id, reshuffled };
  }
  function drawClassic(state, data, pile) {
    let p = state.piles[pile];
    if (!p) return null;
    let reshuffled = false;
    let idx = p.remaining.findIndex((id) => !isJoker(id));
    if (idx === -1) { reshuffle(state, data, pile); reshuffled = true; p = state.piles[pile]; idx = p.remaining.findIndex((id) => !isJoker(id)); }
    const id = p.remaining.splice(idx, 1)[0];
    return { id, reshuffled };
  }
  function putBack(state, pile, id) {
    const p = state.piles[pile];
    if (!p || p.remaining.includes(id)) return false;
    const pos = Math.floor(Math.random() * (p.remaining.length + 1));
    p.remaining.splice(pos, 0, id);
    return true;
  }
  function counts(state) {
    const o = {};
    for (const k in state.piles) o[k] = state.piles[k].remaining.length;
    return o;
  }
  return { shuffle, newState, newPile, draw, drawClassic, putBack, counts, isJoker, reshuffle };
});
