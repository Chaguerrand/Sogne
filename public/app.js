'use strict';
(function () {
  // ---------- Utilitaires ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'd' + Math.random().toString(36).slice(2) + Date.now().toString(36));

  const PILE_LABEL = { defi: 'DÉFI', verite: 'VÉRITÉ', duel: 'DUEL', gage: 'GAGE', sonia: 'SOGNE' };
  const JOKER_TXT = { echange: 'ÉCHANGE', collectif: 'COLLECTIF', aide: 'AIDE' };

  const S = {
    device: ls.get('device', null) || uid(),
    name: ls.get('name', ''),
    data: null, byId: new Map(), counts: {}, realCounts: {}, demo: false, demoEngine: null, online: 0, connected: false,
    info: ls.get('info', null), nums: { active: false, round: 0, number: null, assigned: false },
    active: ls.get('active', null),      // { id, hidden } : gage ou mission en cours
    history: ls.get('history', []),      // [{ id, t }]
    local: null,                         // état du moteur hors ligne
  };
  ls.set('device', S.device);

  // ---------- Pictogrammes (jokers + mission secrète) ----------
  const J = (x, y, w, c) => `<use href="#jester" x="${x}" y="${y}" width="${w}" height="${w}" ${c ? `style="color:${c}"` : ''}/>`;
  const ICON = {
    echange: `<svg viewBox="0 0 120 110" class="joker-ico" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"><path d="M16 62 A44 44 0 0 1 92 24"/><path d="M104 48 A44 44 0 0 1 28 86"/><path d="M86 8 L100 28 L76 32 Z" fill="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M34 102 L20 82 L44 78 Z" fill="currentColor" stroke-width="3" stroke-linejoin="round"/><g stroke="none" style="color:inherit">${J(30, 22, 62)}</g></svg>`,
    collectif: `<svg viewBox="0 0 120 110" class="joker-ico" stroke="none">${J(36, 0, 48)}${J(2, 44, 52)}${J(66, 44, 52)}</svg>`,
    aide: `<svg viewBox="0 0 120 110" class="joker-ico" stroke="none" fill="none">${J(4, 22, 74)}${J(72, 40, 44)}<g stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M74 28 q10 -8 20 0"/><path d="M80 14 q14 -10 28 0"/></g></svg>`,
    secret: `<svg viewBox="0 0 100 100" fill="none"><use href="#jester" width="100" height="100"/></svg>`,
  };

  // ---------- Réseau + mode hors ligne ----------
  async function post(path, body) {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 5000);
    try {
      const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, device: S.device, name: S.name }), signal: ctrl.signal });
      if (!r.ok) { const er = new Error('HTTP ' + r.status); er.status = r.status; throw er; }
      return await r.json();
    } finally { clearTimeout(t); }
  }
  function localEngine() {
    if (!S.local) S.local = ls.get('localEngine', null) || Engine.newState(S.data);
    return S.local;
  }
  function saveLocal() { ls.set('localEngine', S.local); }
  function setOffline(v) { $('#offline').classList.toggle('hidden', !v); }

  // Tant que l'organisateur n'a pas déverrouillé, le serveur envoie un paquet de fausses cartes (mode test) à la place des vraies :
  // on recharge les données dès que l'état change.
  let loading = null;
  function loadData() {
    if (loading) return loading;
    loading = (async () => {
      try {
        const d = await (await fetch('cards.json', { cache: 'no-store' })).json();
        S.data = d; S.demo = !!d.demo; S.byId = new Map(d.cards.map((c) => [c.id, c]));
        if (S.demo) { S.demoEngine = Engine.newState(d); S.counts = Engine.counts(S.demoEngine); S.history = []; S.active = null; }
        else { S.counts = S.realCounts; S.history = ls.get('history', []); S.active = ls.get('active', null); }
        renderPiles(); renderRecent(); renderDock();
        return true;
      } catch (e) { return false; } finally { loading = null; }
    })();
    return loading;
  }
  async function setLocked(v) {
    S.locked = !!v;
    if (S.data && S.locked !== S.demo) { if (layer.firstChild) S.syncAfter = true; else await loadData(); }
  }
  function setCounts(c) { S.realCounts = c; if (!S.demo) { S.counts = c; renderPileCounts(); } }
  // Vérifie auprès du serveur si les vraies cartes sont déverrouillées (utile quand le téléphone s'est endormi et a raté l'info en direct).
  async function refreshLock() {
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 3000);
      const r = await fetch('/api/status', { cache: 'no-store', signal: ctrl.signal }); clearTimeout(t);
      const d = await r.json(); setCounts(d.counts); await setLocked(d.locked !== false, true);
    } catch (e) { /* hors ligne : on garde l'état connu */ }
  }

  async function drawCard(pile, classic) {
    if (S.demo) { // mode test : tirage local dans le paquet de fausses cartes, qui tourne en boucle, sans toucher au serveur
      const st = S.demoEngine || (S.demoEngine = Engine.newState(S.data));
      const r = classic ? Engine.drawClassic(st, S.data, pile) : Engine.draw(st, S.data, pile);
      S.counts = Engine.counts(st); renderPileCounts(); await wait(200);
      return r.id;
    }
    try {
      const r = await post(classic ? '/api/drawClassic' : '/api/draw', { pile });
      setCounts(r.counts); setOffline(false);
      return r.id;
    } catch (e) {
      if (e.status === 403) { S.locked = true; await loadData(); return S.demo ? drawCard(pile, classic) : null; }
      setOffline(true);
      const st = localEngine();
      const r = classic ? Engine.drawClassic(st, S.data, pile) : Engine.draw(st, S.data, pile);
      S.counts = Engine.counts(st); saveLocal(); renderPileCounts();
      return r.id;
    }
  }
  async function putBack(pile, id) {
    if (S.demo) { Engine.putBack(S.demoEngine, pile, id); S.counts = Engine.counts(S.demoEngine); renderPileCounts(); return; }
    try { const r = await post('/api/putback', { pile, id }); setCounts(r.counts); setOffline(false); }
    catch (e) { if (e.status === 403) return; setOffline(true); const st = localEngine(); Engine.putBack(st, pile, id); S.counts = Engine.counts(st); saveLocal(); renderPileCounts(); }
  }

  // ---------- Temps réel (SSE) ----------
  let es = null;
  function connect() {
    if (es) es.close();
    es = new EventSource(`/api/events?device=${encodeURIComponent(S.device)}&name=${encodeURIComponent(S.name || '')}`);
    es.addEventListener('snapshot', async (e) => {
      const d = JSON.parse(e.data); S.connected = true; setOffline(false);
      S.info = d.info; ls.set('info', d.info); S.online = d.online;
      renderHouse(); renderOnline(); handleNumbers(d.numbers, true);
      await setLocked(d.locked !== false, true); setCounts(d.counts);
    });
    es.addEventListener('lock', (e) => setLocked(JSON.parse(e.data).locked));
    es.addEventListener('counts', (e) => setCounts(JSON.parse(e.data).counts));
    es.addEventListener('online', (e) => { S.online = JSON.parse(e.data).online; renderOnline(); });
    es.addEventListener('info', (e) => { S.info = JSON.parse(e.data).info; ls.set('info', S.info); renderHouse(); });
    es.addEventListener('numbers', (e) => handleNumbers(JSON.parse(e.data), false));
    es.onerror = () => { S.connected = false; renderOnline(); };
  }
  // iPhone : la connexion en direct est coupée quand l'écran s'éteint. Au réveil on se reconnecte pour récupérer verrou, compteurs et numéros.
  let hiddenAt = 0;
  function wake() {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (S.data && hiddenAt && Date.now() - hiddenAt > 3000) connect();
    hiddenAt = 0;
    if (wlWant) keepAwake(true);
  }
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('pageshow', (e) => { if (e.persisted && S.data) connect(); });
  function renderOnline() {
    const b = $('#online'); b.classList.toggle('on', S.connected);
    $('span', b).textContent = S.connected ? `connecté${S.online > 1 ? ` : ${S.online} joueurs` : ''}` : 'hors connexion';
  }

  // ---------- Cartes : rendu ----------
  function sizeClass(t) { return t.length > 125 ? 'xl' : t.length > 80 ? 'long' : ''; }
  function frontInner(card, opts = {}) {
    if (card.kind === 'joker') {
      return `<div class="ct"><div class="jk-kicker">JOKER</div></div>
        <div class="cbody">${ICON[card.joker]}<div class="jk-label">${JOKER_TXT[card.joker]}</div><div class="jk-rule">${esc(S.data.jokers[card.joker].rule)}</div></div>`;
    }
    const title = card.secret
      ? `<div class="cc secret-band"><svg viewBox="0 0 100 100" style="color:#fff"><use href="#jester"/></svg>MISSION SECRÈTE</div>`
      : `<div class="cc">${PILE_LABEL[card.pile]}</div>`;
    const head = `<div class="ct"><div class="cn">N° ${card.number}</div>${title}</div>`;
    if (card.secret && opts.hidden) {
      return `${head}<div class="cbody"><div class="hidden-mission"><svg viewBox="0 0 100 100"><use href="#jester"/></svg><p>Ta mission est secrète. Touche « Afficher » pour la lire, puis cache-la.</p></div></div>`;
    }
    const precs = card.precisions && card.precisions.length ? `<div class="precs">${card.precisions.map((p) => `<p>${esc(p)}</p>`).join('')}</div>` : '';
    return `${head}<div class="cbody"><img class="emb" alt="" src="img/emb_${card.pile}.webp"><div class="txt ${sizeClass(card.text)}${card.fx ? ' fx-' + card.fx : ''}">${esc(card.text)}</div>${card.lang ? `<div class="attrib">- ${esc(card.lang)}</div>` : ''}${precs}</div>`;
  }
  function faceClass(card) { return card.kind === 'joker' ? 'joker' : card.secret ? 'c-secret' : 'c-' + card.pile; }
  function backHTML(pile) {
    return `<div class="face back c-${pile}"><img alt="" src="img/emb_${pile}.webp"><div class="bn">${PILE_LABEL[pile]}</div><div class="bs">Sogne</div></div>`;
  }
  function ruleHTML(card) {
    if (card.kind === 'joker') return '';
    const rule = S.data.rules && S.data.rules[card.secret ? 'secret' : card.pile];
    if (!rule) return '';
    return `<details class="rule-toggle"><summary>Rappel du barème</summary><p>${esc(rule)}</p></details>`;
  }

  // ---------- Piles ----------
  function renderPiles() {
    const box = $('#piles'); box.innerHTML = '';
    S.data.piles.forEach((p, i) => {
      const b = el(`<button class="pile ${p.id} ${i === 4 ? 'wide' : ''}" type="button" data-pile="${p.id}" aria-label="Tirer une carte ${PILE_LABEL[p.id]}">
        <div class="stack"><div class="layer l3"></div><div class="layer l2"></div><div class="layer l1"><img class="emb" alt="" src="img/emb_${p.id}.webp"><div class="name">${PILE_LABEL[p.id]}</div></div></div>
        <div class="count" data-count="${p.id}"></div></button>`);
      b.addEventListener('click', async () => { if (S.demo) await refreshLock(); openDraw(p.id); });
      box.appendChild(b);
    });
    renderPileCounts();
  }
  function renderPileCounts() {
    $$('[data-count]').forEach((n) => {
      const c = S.counts[n.dataset.count];
      n.textContent = c === undefined ? '' : `${c} carte${c > 1 ? 's' : ''} dans la pile`;
    });
  }
  function renderRecent() {
    const box = $('#recent'), list = $('#recent-list');
    if (!S.history.length) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden'); list.innerHTML = '';
    S.history.slice(0, 8).forEach((h) => {
      const c = S.byId.get(h.id); if (!c) return;
      const label = c.kind === 'joker' ? `Joker ${JOKER_TXT[c.joker]}` : c.secret ? 'Mission secrète' : `${PILE_LABEL[c.pile]} ${c.number}`;
      const b = el(`<button class="pill ${c.kind === 'joker' ? 'joker' : c.pile}" type="button">${esc(label)}</button>`);
      b.addEventListener('click', () => openSheet(c, { hidden: c.secret }));
      list.appendChild(b);
    });
  }
  function pushHistory(id) {
    S.history = [{ id, t: Date.now() }, ...S.history.filter((h) => h.id !== id)].slice(0, 12);
    if (!S.demo) ls.set('history', S.history);
    renderRecent();
  }

  // ---------- Gage / mission en cours ----------
  function setActive(card) {
    S.active = (card && card.pile === 'gage') ? { id: card.id, hidden: !!card.secret } : S.active;
    if (!S.demo) ls.set('active', S.active);
    renderDock();
  }
  function clearActive() { S.active = null; if (!S.demo) ls.set('active', null); renderDock(); }
  function renderDock() {
    const d = $('#dock');
    if (!S.active) { d.classList.add('hidden'); d.innerHTML = ''; return; }
    const c = S.byId.get(S.active.id); if (!c) { clearActive(); return; }
    d.classList.remove('hidden');
    d.innerHTML = `<button type="button" class="${c.secret ? 'secret' : ''}">
      <svg class="dk-ico" viewBox="0 0 100 100"><use href="#jester"/></svg>
      <div><div class="dk-t">${c.secret ? 'Ma mission secrète' : 'Mon gage en cours'}</div><div class="dk-s">${c.secret ? 'Touche pour la relire en secret' : 'Touche pour le relire'}</div></div>
      <span class="dk-go">Voir</span></button>`;
    $('button', d).addEventListener('click', () => openSheet(c, { hidden: c.secret, endable: true }));
  }

  // ---------- Overlays ----------
  const layer = $('#layer');
  // ---------- Effets de déchirement à la fermeture d'une carte ----------
  const rnd = (a, b) => a + Math.random() * (b - a);
  const sgn = () => (Math.random() < 0.5 ? -1 : 1);
  function jag(a, b, n, amp) {
    n = n || 12; amp = amp === undefined ? 2.4 : amp;
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const pts = [a];
    for (let i = 1; i < n; i++) { const t = i / n, o = (Math.random() - 0.5) * 2 * amp; pts.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]); }
    pts.push(b); return pts;
  }
  const rev = (l) => l.slice().reverse();
  // Chaque effet renvoie des morceaux : poly (en %), x/y/r = destination, o = origine de rotation, d = délai (ms), t = durée (ms)
  const TEARS = [
    function horizontal(w, h, V) { const y = rnd(38, 62), L = jag([0, y], [100, y]); return [
      { poly: [[0, 0], [100, 0], ...rev(L)], x: -w * 0.5 * sgn(), y: -V, r: rnd(18, 35) * sgn(), o: '100% 100%' },
      { poly: [...L, [100, 100], [0, 100]], x: w * 0.5 * sgn(), y: V, r: rnd(18, 35) * sgn(), o: '0% 0%' }]; },
    function vertical(w, h, V) { const x = rnd(38, 62), L = jag([x, 0], [x, 100]); return [
      { poly: [[0, 0], ...L, [0, 100]], x: -V, y: h * 0.3, r: -rnd(20, 40), o: '100% 100%' },
      { poly: [...L, [100, 100], [100, 0]], x: V, y: h * 0.4, r: rnd(20, 40), o: '0% 100%' }]; },
    function diagonal(w, h, V) { const f = sgn(), y1 = rnd(8, 28), y2 = rnd(72, 92), L = jag(f > 0 ? [0, y1] : [0, y2], f > 0 ? [100, y2] : [100, y1], 14); return [
      { poly: [[0, 0], [100, 0], ...rev(L)], x: V * 0.7 * f, y: -V, r: 30 * f, o: '50% 100%' },
      { poly: [...L, [100, 100], [0, 100]], x: -V * 0.7 * f, y: V, r: -30 * f, o: '50% 0%' }]; },
    function corner(w, h, V) {
      const fx = sgn() > 0, fy = sgn() > 0, a = rnd(32, 52), b = rnd(32, 52), L = jag([b, 0], [0, a], 9, 2.2);
      const m = (p) => p.map(([x, y]) => [fx ? 100 - x : x, fy ? 100 - y : y]);
      const sx = fx ? 1 : -1, sy = fy ? 1 : -1;
      return [{ poly: m([[0, 0], ...L]), x: V * 0.6 * sx, y: -V * 0.7 * sy, r: 40 * sx * sy, o: '0% 0%', t: 800 },
              { poly: m([...L, [0, 100], [100, 100], [100, 0]]), x: -w * 0.15 * sx, y: V * 1.1, r: -8 * sx * sy, o: '50% 0%', d: 140, t: 950 }]; },
    function strip(w, h, V) { const y = rnd(11, 20), L = jag([0, y], [100, y], 16, 1.6); return [
      { poly: [[0, 0], [100, 0], ...rev(L)], x: -w * 0.3, y: -V, r: -rnd(40, 70), o: '100% 50%', t: 700 },
      { poly: [...L, [100, 100], [0, 100]], x: w * 0.1 * sgn(), y: V, r: rnd(3, 8) * sgn(), o: '50% 0%', d: 120, t: 900 }]; },
    function stripsV(w, h, V) {
      const n = 6, xs = [0]; for (let i = 1; i < n; i++) xs.push((100 / n) * i + rnd(-3, 3)); xs.push(100);
      const lines = xs.map((x, i) => (i === 0 ? [[0, 0], [0, 100]] : i === n ? [[100, 0], [100, 100]] : jag([x, 0], [x, 100], 10, 1.6)));
      return xs.slice(0, n).map((_, i) => ({ poly: [...lines[i], ...rev(lines[i + 1])], x: rnd(-w * 0.3, w * 0.3), y: V, r: rnd(-20, 20), o: '50% 0%', d: i * 70, t: 800 })); },
    function stripsH(w, h, V) {
      const n = 7, ys = [0]; for (let i = 1; i < n; i++) ys.push((100 / n) * i + rnd(-3, 3)); ys.push(100);
      const lines = ys.map((y, i) => (i === 0 ? [[0, 0], [100, 0]] : i === n ? [[0, 100], [100, 100]] : jag([0, y], [100, y], 12, 1.6)));
      return ys.slice(0, n).map((_, i) => ({ poly: [...lines[i], ...rev(lines[i + 1])], x: (i % 2 ? 1 : -1) * V, y: rnd(-20, 40), r: (i % 2 ? 1 : -1) * rnd(4, 14), o: '50% 50%', d: i * 55, t: 700 })); },
    function shred(w, h, V) {
      const C = 3, R = 4, g = [];
      for (let j = 0; j <= R; j++) { g.push([]); for (let i = 0; i <= C; i++) g[j].push([(100 / C) * i + (i && i < C ? rnd(-5, 5) : 0), (100 / R) * j + (j && j < R ? rnd(-4, 4) : 0)]); }
      const out = [];
      for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) {
        const cx = (i + 0.5) / C - 0.5, cy = (j + 0.5) / R - 0.5, k = V * 1.1;
        out.push({ poly: [g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i]], x: cx * k * 1.6 + rnd(-30, 30), y: cy * k * 1.6 + V * 0.35, r: rnd(-120, 120), o: '50% 50%', d: rnd(0, 120), t: 800 });
      }
      return out; },
    function cross(w, h, V) {
      const cx = rnd(40, 60), cy = rnd(42, 58), Lhl = jag([0, cy], [cx, cy], 8), Lhr = jag([cx, cy], [100, cy], 8), Lvt = jag([cx, 0], [cx, cy], 8), Lvb = jag([cx, cy], [cx, 100], 8);
      return [
        { poly: [[0, 0], [cx, 0], ...Lvt, ...rev(Lhl)], x: -V * 0.6, y: -V * 0.7, r: -rnd(25, 50), o: '100% 100%' },
        { poly: [[cx, 0], [100, 0], [100, cy], ...rev(Lhr), ...rev(Lvt)], x: V * 0.6, y: -V * 0.7, r: rnd(25, 50), o: '0% 100%' },
        { poly: [...Lhl, ...Lvb, [0, 100]], x: -V * 0.6, y: V * 0.8, r: rnd(25, 50), o: '100% 0%' },
        { poly: [...Lhr, [100, 100], [cx, 100], ...rev(Lvb)], x: V * 0.6, y: V * 0.8, r: -rnd(25, 50), o: '0% 0%' }]; },
    function drop(w, h, V) { const x = rnd(40, 60), L = jag([x, 0], [x, 100], 14, 3); return [
      { poly: [[0, 0], ...L, [0, 100]], x: -w * 0.45, y: V * 1.2, r: -rnd(35, 55), o: '0% 0%', t: 1000 },
      { poly: [...L, [100, 100], [100, 0]], x: w * 0.45, y: V * 1.2, r: rnd(35, 55), o: '100% 0%', t: 1000 }]; },
  ];
  function tearCard(face, rect, idx) {
    const w = rect.width, h = rect.height, V = Math.max(innerWidth, innerHeight) * 1.1;
    const root = el('<div class="tear" aria-hidden="true"><div class="tear-bg"></div></div>');
    const pieces = TEARS[idx === undefined ? Math.floor(Math.random() * TEARS.length) : idx](w, h, V);
    let end = 0; const anims = [];
    pieces.forEach((p) => {
      const wrap = document.createElement('div'); wrap.className = 'tear-piece';
      wrap.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${w}px;height:${h}px;transform-origin:${p.o}`;
      const c = face.cloneNode(true);
      c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;transform:none;margin:0;animation:none;opacity:1;' + `clip-path:polygon(${p.poly.map((q) => q[0].toFixed(2) + '% ' + q[1].toFixed(2) + '%').join(',')})`;
      wrap.appendChild(c); root.appendChild(wrap);
      const t = p.t || 750, d = p.d || 0; end = Math.max(end, t + d);
      anims.push([wrap, [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1, easing: 'ease-out' },
        { transform: `translate(${p.x * 0.12}px,${p.y * 0.06}px) rotate(${p.r * 0.3}deg)`, opacity: 1, offset: 0.15, easing: 'cubic-bezier(.55,0,.9,.6)' },
        { transform: `translate(${p.x}px,${p.y}px) rotate(${p.r}deg)`, opacity: 0.9 },
      ], { duration: t, delay: d, fill: 'both' }]);
    });
    document.body.appendChild(root);
    anims.forEach(([n, k, o]) => n.animate(k, o));
    root.firstChild.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, fill: 'both' });
    setTimeout(() => root.remove(), end + 120);
  }
  function closeLayer() {
    const f = layer.querySelector('.face.front');
    const r = f && f.childElementCount ? f.getBoundingClientRect() : null;
    const ok = r && r.width > 60 && r.height > 80 && r.top < innerHeight && r.bottom > 0 && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const clone = ok ? f.cloneNode(true) : null;
    layer.innerHTML = ''; document.body.style.overflow = '';
    if (clone) tearCard(clone, r);
    if (S.syncAfter) { S.syncAfter = false; setLocked(S.locked, true); }
  }
  window.__tear = (i) => { const f = layer.querySelector('.face.front'); const r = f.getBoundingClientRect(); const c = f.cloneNode(true); layer.innerHTML = ''; tearCard(c, r, i); };
  function burst() {
    const colors = ['#6b1420', '#9cc9f0', '#fde9a4', '#f4a4b6', '#fff'];
    const c = el('<div class="confetti"></div>');
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('i'); const a = Math.random() * Math.PI * 2; const r = 90 + Math.random() * 160;
      p.style.cssText = `background:${colors[i % colors.length]};--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r - 40}px;--r:${Math.random() * 720 - 360}deg;animation-delay:${Math.random() * 80}ms`;
      c.appendChild(p);
    }
    document.body.appendChild(c); setTimeout(() => c.remove(), 1400);
  }
  function overlayShell(pile) {
    document.body.style.overflow = 'hidden';
    const ov = el(`<div class="overlay" role="dialog" aria-modal="true">
      <div class="scene"><div class="card3d"><div class="face front"></div>${backHTML(pile)}</div></div>
      <div class="ov-side"><div class="ov-top"></div><div class="ov-actions"></div><div class="slot-rule"></div></div></div>`);
    layer.innerHTML = ''; layer.appendChild(ov); enableTapClose(ov);
    const c3 = $('.card3d', ov);
    requestAnimationFrame(() => requestAnimationFrame(() => c3.classList.add('in')));
    return { ov, c3, front: $('.face.front', ov), top: $('.ov-top', ov), actions: $('.ov-actions', ov), slotRule: $('.slot-rule', ov) };
  }
  function setTop(o, text, bold) { o.top.innerHTML = ''; if (bold) { const b = document.createElement('b'); b.textContent = bold; o.top.append(b, document.createTextNode(text)); } else o.top.textContent = text; }
  function setActions(o, list) {
    o.actions.innerHTML = '';
    list.forEach((a) => {
      const b = el(`<button type="button" class="btn ${a.cls || ''}">${esc(a.label)}</button>`);
      b.addEventListener('click', () => { if (b.disabled) return; a.run(b); });
      o.actions.appendChild(b);
    });
  }
  async function revealCard(o, card, opts = {}) {
    o.front.className = `face front ${faceClass(card)}`;
    o.front.innerHTML = (opts.banner ? `<div class="joker-banner">${esc(opts.banner)}</div>` : '') + frontInner(card, { hidden: card.secret });
    o.slotRule.innerHTML = ruleHTML(card);
    if (!o.c3.classList.contains('in')) await wait(120);
    await wait(opts.fast ? 80 : 480);
    o.c3.classList.add('flipped');
    if (navigator.vibrate) { try { navigator.vibrate(30); } catch (e) { /* ignore */ } }
    await wait(700); burst();
  }
  // Remet la carte face cachée puis la retourne sur une nouvelle carte
  async function reflip(o, pile, card, opts) {
    o.c3.classList.remove('flipped'); o.slotRule.innerHTML = ''; await wait(650);
    await revealCard(o, card, { ...opts, fast: true });
  }

  // ---------- Chrono (durée détectée dans le texte de la carte) ----------
  function durationOf(card) {
    if (!card || card.secret || card.kind === 'joker' || !card.text || /hésitation/i.test(card.text)) return 0;
    if (card.secs) return card.secs;
    const m = card.text.match(/(\d+)\s*secondes?/i);
    if (m) return +m[1];
    if (/\b(une|1)\s*minute\b/i.test(card.text)) return 60;
    return 0;
  }
  // Son du chrono : un élément <audio> (WAV généré) joue même quand l'iPhone est en mode silencieux, contrairement à WebAudio.
  // Sonnerie : 4 doubles « bip bip » graves et courts, répartis sur 5 secondes (même durée que le flash)
  const BIPS = [].concat(...[0, 1, 2, 3].map(() => [[330, 0.16], [0, 0.12], [330, 0.16], [0, 0.81]]));
  let alarm = null;
  // Garde l'écran allumé pendant un chrono (sinon l'iPhone se verrouille au bout de 30 s et la sonnerie est perdue)
  let wl = null, wlWant = false;
  async function keepAwake(on) {
    wlWant = on;
    try {
      if (on && navigator.wakeLock && !wl) {
        const l = await navigator.wakeLock.request('screen');
        if (!wlWant) { l.release(); return; }
        wl = l; l.addEventListener('release', () => { if (wl === l) wl = null; });
      } else if (!on && wl) { const l = wl; wl = null; l.release(); }
    } catch (e) { wl = null; }
  }
  function makeWav(parts) {
    const rate = 22050; const total = parts.reduce((n, p) => n + Math.round(rate * p.d), 0);
    const buf = new ArrayBuffer(44 + total * 2); const v = new DataView(buf);
    const w = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + total * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, total * 2, true);
    let o = 44;
    parts.forEach((p) => { const n = Math.round(rate * p.d); for (let i = 0; i < n; i++) { const t = i / rate, env = p.f ? Math.min(1, t * 60, (p.d - t) * 25) : 0; const ph = 2 * Math.PI * p.f * t; v.setInt16(o, (Math.sin(ph) + 0.35 * Math.sin(2 * ph) + 0.15 * Math.sin(3 * ph)) / 1.5 * 0.85 * 32767 * Math.max(0, env), true); o += 2; } });
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }
  function primeAlarm() {
    try {
      if (!alarm) {
        alarm = { el: new Audio(), beep: makeWav(BIPS.map(([f, d]) => ({ f, d }))), silent: makeWav([{ f: 0, d: 0.1 }]) };
        alarm.el.setAttribute('playsinline', '');
      }
      alarm.el.src = alarm.silent; const pr = alarm.el.play(); if (pr && pr.catch) pr.catch(() => {});
    } catch (e) {}
  }
  function beep() {
    try {
      // 5 couleurs de dos de cartes, 0,5 s chacune, 2 passages = 5 s ; toucher l'écran pour fermer plus tôt
      const cols = ['#ffd9e0', '#d3e8fb', '#fff0b5', '#dcf1d2', '#ffdcc2'], seq = cols.concat(cols);
      const f = document.createElement('div'); f.className = 'alarmflash'; document.body.appendChild(f);
      f.animate(seq.map((c, i) => ({ backgroundColor: c, offset: i / seq.length, easing: 'step-end' })).concat([{ backgroundColor: seq[seq.length - 1], offset: 1 }]), { duration: 5000, fill: 'forwards' });
      const done = () => f.remove(); f.addEventListener('click', done); setTimeout(done, 5050);
    } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate([250, 120, 250, 120, 500]); } catch (e) {}
    let played = false;
    try { if (alarm) { alarm.el.src = alarm.beep; alarm.el.volume = 1; const pr = alarm.el.play(); if (pr && pr.catch) pr.catch(() => {}); played = true; } } catch (e) {}
    if (played) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ctx = new AC();
      [0, 0.32, 0.64].forEach((t, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = i === 2 ? 1046 : 784; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.0001, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + (i === 2 ? 0.6 : 0.22)); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.7); });
      setTimeout(() => ctx.close && ctx.close(), 1600);
    } catch (e) {}
  }
  function chronoAction(card, ov) {
    const s = durationOf(card); if (!s) return null;
    const label = s >= 60 ? `Lancer le chrono : ${s / 60 === 1 ? '1 min' : s + ' s'}` : `Lancer le chrono : ${s} s`;
    let iv = null;
    const ch = { state: 'idle' };
    if (ov) ov._ch = ch;
    const start = (b) => {
      if (iv || !b) return;
      primeAlarm(); keepAwake(true);
      const end = Date.now() + s * 1000; b.classList.remove('done'); b.classList.add('run'); ch.state = 'run';
      const tick = () => {
        if (!b.isConnected) { clearInterval(iv); iv = null; keepAwake(false); ch.state = 'idle'; return; }
        const left = Math.ceil((end - Date.now()) / 1000);
        if (left <= 0) { clearInterval(iv); iv = null; keepAwake(false); b.classList.remove('run'); b.classList.add('done'); b.textContent = 'Temps écoulé ! Relancer le chrono'; ch.state = 'done'; beep(); return; }
        b.textContent = left + ' s';
      };
      tick(); iv = setInterval(tick, 250);
    };
    ch.start = () => start(ov && ov.querySelector('.btn.chrono'));
    return { label, cls: 'chrono', run: (b) => start(b) };
  }
  // Toucher n'importe où sur l'écran : lance le chrono (s'il y en a un et qu'il n'a pas démarré), ignore pendant le chrono, sinon ferme
  function armTapClose(ov) { ov.dataset.dismiss = '1'; ov.dataset.since = String(Date.now() + 700); }
  function enableTapClose(ov) {
    ov.addEventListener('click', (e) => {
      if (e.target.closest('button, summary, details, .pick, a')) return;
      if (ov.dataset.dismiss !== '1' || Date.now() < +ov.dataset.since) return;
      const ch = ov._ch;
      if (ch && ch.state === 'idle') { ch.start(); return; }
      if (ch && ch.state === 'run') return;
      closeLayer();
    });
  }

  function finalActions(o, card, extra) {
    const acts = [];
    const ch = chronoAction(card, o.ov); if (ch) acts.push(ch);
    if (card.secret) {
      let shown = false;
      acts.push({ label: 'Afficher ma mission', cls: 'primary', run: (b) => {
        shown = !shown; o.front.innerHTML = frontInner(card, { hidden: !shown }); b.textContent = shown ? 'Masquer ma mission' : 'Afficher ma mission';
      } });
    }
    setActions(o, extra ? [...extra, ...acts] : acts);
    armTapClose(o.ov);
  }
  function afterResolved(card) { pushHistory(card.id); setActive(card); }

  async function openDraw(pileId) {
    if (layer.firstChild) return;
    const o = overlayShell(pileId);
    setTop(o, ' : tirage en cours...', S.name || 'Joueur');
    o.actions.innerHTML = '<div class="spin" style="margin:6px auto"></div>';
    const id = await drawCard(pileId, false);
    const card = S.byId.get(id);
    if (!card) { setTop(o, 'Erreur de tirage'); setActions(o, [{ label: 'Fermer', run: closeLayer }]); return; }
    setTop(o, ` a tiré dans ${PILE_LABEL[pileId]}`, S.name || 'Joueur');
    await revealCard(o, card);
    if (card.kind === 'joker') return jokerFlow(o, card);
    afterResolved(card); finalActions(o, card);
  }

  // ---------- Jokers ----------
  function jokerFlow(o, joker) {
    const pile = joker.pile, type = joker.joker;
    pushHistory(joker.id);
    if (type === 'echange') {
      setActions(o, [
        { label: 'Piocher 2 cartes classiques', cls: 'primary', run: () => echangeDraw(o, joker) },
        { label: 'Ne pas l\'utiliser : remettre le joker dans la pile', cls: 'ghost', run: async (b) => {
          b.disabled = true; await putBack(pile, joker.id);
          const id = await drawCard(pile, true); const card = S.byId.get(id);
          setTop(o, ' : joker remis dans la pile', S.name || 'Joueur');
          await reflip(o, pile, card, { banner: 'Joker remis dans la pile' }); afterResolved(card); finalActions(o, card);
        } },
      ]);
    } else {
      setActions(o, [{ label: 'Piocher la carte à résoudre', cls: 'primary', run: async (b) => {
        b.disabled = true; const id = await drawCard(pile, true); const card = S.byId.get(id);
        await reflip(o, pile, card, { banner: `Carte à résoudre avec le joker ${JOKER_TXT[type]}` });
        pushHistory(card.id);
        setTop(o, ` : joker ${JOKER_TXT[type]}`, S.name || 'Joueur');
        setActions(o, [
          { label: `Utiliser le joker ${JOKER_TXT[type]}`, cls: 'primary', run: () => {
            setActive(card);
            o.front.innerHTML = `<div class="joker-banner">Joker ${JOKER_TXT[type]} utilisé : ${type === 'collectif' ? 'transforme ton épreuve en action collective' : 'choisis un joueur consentant pour t\'aider'}</div>` + frontInner(card, { hidden: card.secret });
            finalActions(o, card);
          } },
          { label: 'Ne pas l\'utiliser : remettre le joker dans la pile', cls: 'ghost', run: async () => {
            await putBack(pile, joker.id); setActive(card);
            o.front.innerHTML = `<div class="joker-banner">Joker remis dans la pile : joue la carte normalement</div>` + frontInner(card, { hidden: card.secret });
            finalActions(o, card);
          } },
        ]);
      } }]);
    }
  }
  async function echangeDraw(o, joker) {
    const pile = joker.pile;
    setActions(o, [{ label: 'Tirage en cours...', cls: 'ghost', run: () => {} }]);
    const a = S.byId.get(await drawCard(pile, true)); const b = S.byId.get(await drawCard(pile, true));
    o.c3.classList.remove('flipped'); o.slotRule.innerHTML = '';
    await wait(500);
    const scene = $('.scene', o.ov);
    const mk = (c) => `<div class="mini pick"><div class="card3d in"><div class="face front ${faceClass(c)}">${frontInner(c, {})}<div class="pickme">Touche pour choisir</div></div></div></div>`;
    scene.innerHTML = `<div class="twin" style="height:100%;align-items:center">${mk(a)}${mk(b)}</div>`;
    scene.style.perspective = 'none';
    // les faces avant sont en rotateY(180) : on les remet à plat dans ce mode
    $$('.mini .card3d', scene).forEach((c3) => { c3.style.transform = 'none'; $('.face.front', c3).style.transform = 'none'; });
    setTop(o, ' : choisis la carte à jouer', S.name || 'Joueur');
    setActions(o, [{ label: 'L\'autre carte retournera dans la pile', cls: 'ghost', run: () => {} }]);
    const minis = $$('.mini', scene);
    [[minis[0], a, b], [minis[1], b, a]].forEach(([m, keep, drop]) => m.addEventListener('click', async () => {
      minis.forEach((x) => { x.style.pointerEvents = 'none'; });
      await putBack(pile, drop.id);
      pushHistory(keep.id);
      // retour à la scène principale avec la carte choisie
      scene.removeAttribute('style');
      scene.innerHTML = `<div class="card3d in"><div class="face front"></div>${backHTML(pile)}</div>`;
      o.c3 = $('.card3d', scene); o.front = $('.face.front', scene);
      setTop(o, ` joue cette carte (l'autre est remise dans la pile)`, S.name || 'Joueur');
      await revealCard(o, keep, { banner: 'Joker ÉCHANGE utilisé' });
      setActive(keep); finalActions(o, keep);
    }));
  }

  // Fiche d'une carte déjà tirée (gage/mission en cours, historique)
  function openSheet(card, opts = {}) {
    if (layer.firstChild) return;
    document.body.style.overflow = 'hidden';
    let hidden = !!opts.hidden;
    const ov = el(`<div class="overlay" role="dialog" aria-modal="true"><div class="sheet-card"><div class="face front ${faceClass(card)}"></div></div><div class="ov-side"><div class="ov-top"></div><div class="ov-actions"></div><div class="slot-rule"></div></div></div>`);
    layer.innerHTML = ''; layer.appendChild(ov); enableTapClose(ov);
    const face = $('.face', ov); const draw = () => { face.innerHTML = frontInner(card, { hidden }); };
    draw();
    const o = { actions: $('.ov-actions', ov) };
    const acts = [];
    const ch = chronoAction(card, ov); if (ch) acts.push(ch);
    if (card.secret) acts.push({ label: hidden ? 'Afficher ma mission' : 'Masquer ma mission', cls: 'primary', run: (b) => { hidden = !hidden; draw(); b.textContent = hidden ? 'Afficher ma mission' : 'Masquer ma mission'; } });
    if (opts.endable) acts.push({ label: 'C\'est terminé (mon tour est passé)', cls: card.secret ? 'ghost' : 'primary', run: () => { clearActive(); closeLayer(); toast('Gage terminé'); } });
    setActions(o, acts); armTapClose(ov);
    $('.slot-rule', ov).innerHTML = ruleHTML(card);
  }

  function toast(t) { const n = el(`<div class="toast">${esc(t)}</div>`); document.body.appendChild(n); setTimeout(() => n.remove(), 2200); }

  // ---------- Numéros ----------
  let numTimer = null;
  function handleNumbers(m, fromSnapshot) {
    const btn = $('#numbtn');
    if (!m || !m.active) { S.nums = { active: false, round: m ? m.round : 0, number: null, assigned: false }; btn.classList.add('hidden'); hideNumber(); return; }
    S.nums = { active: true, round: m.round, number: m.number ?? null, assigned: !!m.assigned };
    if (S.nums.number === null || S.nums.number === undefined) {
      btn.classList.add('hidden');
      if (!fromSnapshot || ls.get('numToast', 0) !== m.round) { toast('Pas de numéro pour toi cette fois'); ls.set('numToast', m.round); }
      return;
    }
    btn.classList.remove('hidden');
    if (ls.get('numShown', 0) !== m.round) { ls.set('numShown', m.round); showNumber(10000); }
  }
  function hideNumber() { clearTimeout(numTimer); const n = $('.numov'); if (n) n.remove(); }
  function showNumber(ms) {
    hideNumber(); if (S.nums.number == null) return;
    const n = el(`<div class="numov"><div class="k">Hello ${esc(S.name || '')}, ton numéro est le suivant :</div><div class="n">${S.nums.number}</div><div class="bar"><i></i></div><small>Touche l'écran pour le cacher</small></div>`);
    document.body.appendChild(n);
    const bar = $('.bar i', n); bar.style.transition = `transform ${ms}ms linear`;
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transform = 'scaleX(0)'; }));
    if (navigator.vibrate) { try { navigator.vibrate([60, 40, 60]); } catch (e) { /* ignore */ } }
    n.addEventListener('click', hideNumber);
    numTimer = setTimeout(hideNumber, ms);
  }
  $('#numbtn').addEventListener('click', () => showNumber(4000));

  // ---------- Règles ----------
  function renderRules() {
    const box = $('#rules'); box.innerHTML = '';
    window.RULES.forEach((s) => {
      if (s.intro) { box.appendChild(el(`<div class="rules-intro">${s.html}</div>`)); return; }
      const a = el(`<div class="acc ${s.open ? 'open' : ''}" id="r-${s.id}"><button type="button" aria-expanded="${!!s.open}"><b>${s.title}</b><i>+</i></button><div class="body">${s.html}</div></div>`);
      $('button', a).addEventListener('click', (e) => { const open = a.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded', open); });
      box.appendChild(a);
    });
  }

  // ---------- Programme ----------
  const PROG = [
    { day: 'Vendredi', slots: [['À partir de 20h :', 'Arrivée'], ['Dès 21h :', 'Apéro dînatoire et Olympiades - Beer Pong, Qui connaît le mieux Sogne, Mimes...']] },
    { day: 'Samedi', slots: [['11h :', 'Cours de Pilate par Professeur Boulud'], ['13h :', 'Raclette party'], ['16h :', 'Activité manuelle - Le jeu du peintre'], ['À partir de 19h :', 'CONCOURS TOP CHEF', 'Brigade Sue & Brigade Boulud au rapport !']] },
    { day: 'Dimanche', slots: [['À partir de 12h :', 'Brunch thème “Le jogging c’est la vie”']] },
  ];
  function renderProg() {
    $('#prog').innerHTML = PROG.map((d) => `<div class="day"><h3>${d.day}</h3>${d.slots.map((s) => `<div class="slot"><span class="t">${esc(s[0])}</span><div class="d">${esc(s[1])}${s[2] ? `<em>${esc(s[2])}</em>` : ''}</div></div>`).join('')}</div>`).join('');
  }

  // ---------- Maison ----------
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); toast('Copié'); } catch (e) { toast(t); } };
  function openPhoto(src) {
    if ($('.lightbox')) return;
    const lb = el(`<div class="lightbox" role="dialog" aria-modal="true"><button class="lb-x" type="button" aria-label="Fermer">×</button><div class="lb-scroll"><img alt="" src="${src}"></div></div>`);
    document.body.appendChild(lb); document.body.style.overflow = 'hidden';
    const close = () => { lb.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', esc); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    const img = $('img', lb);
    img.addEventListener('click', (e) => { e.stopPropagation(); lb.classList.toggle('zoom'); });
    $('.lb-x', lb).addEventListener('click', close);
    lb.addEventListener('click', close);
  }
  function renderHouse() {
    const i = S.info || {};
    const secret = (label, v) => `<div class="info"><h4>${label}</h4>${v ? `<p class="secretval">${esc(v)}</p><div class="btnrow"><button class="btn small" type="button" data-copy="${esc(v)}">Copier</button></div>` : '<p class="muted">Communiqué 48h avant l\'arrivée.</p>'}</div>`;
    const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((i.address || '').replace(/\(.*\)/, ''));
    const addr = (i.address || '').replace(/\(.*\)/, '').trim();
    const waze = 'https://waze.com/ul?navigate=yes&q=' + encodeURIComponent(addr);
    const AIRBNB = 'https://www.airbnb.fr/rooms/1084691340751867113';
    $('#house').innerHTML = `
      <div class="info"><h4>Adresse</h4><p>${esc(i.address || '')}</p><div class="btnrow"><a class="btn small primary" href="${maps}" target="_blank" rel="noopener">Google Maps</a><a class="btn small primary" href="${waze}" target="_blank" rel="noopener">Waze</a><button class="btn small" type="button" data-copy="${esc(i.address || '')}">Copier</button></div></div>
      <div class="info"><h4>Arrivée et départ</h4><p><b>Arrivée :</b> ${esc(i.arrival || '')}</p><p><b>Départ :</b> ${esc(i.departure || '')}</p></div>
      <div class="info"><h4>Accéder à la maison</h4><p>${esc(i.accessFoot || '')}</p><p>${esc(i.accessCar || '')}</p></div>
      <div class="info"><h4>Photos et plan d'accès</h4><p class="muted">Touche une image pour l'agrandir.</p><div class="gallery">${[['acces_bois', 'Portail en bois : accès boîte à clés'], ['acces_acier', 'Portail en acier : accès voitures'], ['acces_plan', 'Plan : portails, poubelles, tri']].map(([f, t]) => `<button type="button" class="gal" data-photo="img/${f}.webp" aria-label="${t}"><img src="img/${f}.webp" alt="${t}" loading="lazy"></button>`).join('')}</div></div>
      ${secret('Code de la boîte à clés', i.keyCode)}
      ${secret('Wifi : ' + (i.wifiName || 'nom du réseau'), i.wifiPass ? i.wifiPass : '')}
      ${i.notes ? `<div class="info"><h4>À savoir</h4><p>${esc(i.notes).replace(/\n/g, '<br>')}</p></div>` : ''}
      <div class="info"><h4>La maison</h4><p class="muted">D'après l'annonce.</p><div class="btnrow" style="margin-bottom:10px"><a class="btn small" href="${AIRBNB}" target="_blank" rel="noopener">Voir l'annonce Airbnb</a></div><div class="facts"><span>14 voyageurs</span><span>7 chambres</span><span>3 salles de bain</span><span>250 m²</span><span>Parc clos d'environ 5 000 m²</span><span>Cuisine équipée</span><span>Cheminée</span><span>Grande télé</span><span>Barbecue</span><span>Terrain de pétanque</span><span>Parking gratuit</span><span>Wifi</span></div></div>
      <p class="adminlink"><a href="/admin">Espace organisateur</a></p>`;
    $$('[data-copy]', $('#house')).forEach((b) => b.addEventListener('click', () => copy(b.dataset.copy)));
    $$('[data-photo]', $('#house')).forEach((b) => b.addEventListener('click', () => openPhoto(b.dataset.photo)));
  }

  // ---------- Navigation, prénom ----------
  function showTab(t) {
    $$('.view').forEach((v) => v.classList.toggle('hidden', v.id !== 'view-' + t));
    $$('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
    ls.set('tab', t); window.scrollTo(0, 0);
  }
  $$('#nav button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

  function renderHello() { $('#hello').textContent = S.name ? `Salut ${S.name} !` : ''; }
  function askName() {
    const m = el(`<div class="modal"><div class="m"><h2>Ton prénom ?</h2><p class="muted" style="margin:6px 0 0">Pour personnaliser ton écran et que l'organisateur te retrouve.</p><input id="nm" maxlength="24" autocomplete="given-name" placeholder="Ex : Charlie"><button class="btn primary" id="nmok" type="button" style="width:100%">C'est parti</button><button class="btn" id="nmskip" type="button" style="width:100%;margin-top:8px;border-color:transparent">Plus tard</button></div></div>`);
    document.body.appendChild(m);
    const done = (save) => {
      if (save) { S.name = $('#nm', m).value.replace(/[<>]/g, '').trim().slice(0, 24); ls.set('name', S.name); renderHello(); post('/api/name', { name: S.name }).catch(() => {}); }
      ls.set('nameAsked', true); m.remove();
    };
    $('#nmok', m).addEventListener('click', () => done(true));
    $('#nmskip', m).addEventListener('click', () => done(false));
    $('#nm', m).addEventListener('keydown', (e) => { if (e.key === 'Enter') done(true); });
    setTimeout(() => $('#nm', m).focus(), 100);
  }
  $('#hello').addEventListener('click', askName);

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && layer.firstChild) closeLayer(); });

  // ---------- Démarrage ----------
  async function init() {
    if (!(await loadData())) { $('#piles').innerHTML = '<p>Impossible de charger les cartes. Recharge la page.</p>'; return; }
    renderRules(); renderProg(); renderHouse(); renderHello(); renderOnline();
    showTab('prog');
    connect();
    if (!ls.get('nameAsked', false)) setTimeout(askName, 700);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  window.__sogne = { frontInner, faceClass, S, openSheet };
  init();
})();
