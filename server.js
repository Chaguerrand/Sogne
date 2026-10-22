'use strict';
// Serveur Sogne Birthday : fichiers statiques + pioche partagée + numéros + admin. Zéro dépendance.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Engine = require('./public/engine.js');

const PORT = process.env.PORT || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || '';
if (!ADMIN_PIN) console.warn('ADMIN_PIN non défini : la page /admin est désactivée.');
const PUBLIC = path.join(__dirname, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const DATA = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'cards.json'), 'utf8'));
const CARD_BY_ID = new Map(DATA.cards.map((c) => [c.id, c]));

const BASE_INFO = {
  address: '', arrival: '', departure: '', accessFoot: '', accessCar: '', keyCode: '', wifiName: '', wifiPass: '', notes: '',
};
// Les infos de la maison (adresse, accès...) ne sont pas dans le dépôt : elles viennent de la variable d'environnement INFO_JSON,
// puis peuvent être modifiées en direct depuis /admin.
let envInfo = {};
try { envInfo = JSON.parse(process.env.INFO_JSON || '{}'); } catch (e) { console.warn('INFO_JSON invalide'); }
const DEFAULT_INFO = { ...BASE_INFO, ...envInfo };

let state = null;
function freshState() {
  return { engine: Engine.newState(DATA), info: { ...DEFAULT_INFO }, numbers: { active: false, round: 0, assigned: {} }, log: [] };
}
// Persistance : Postgres si DATABASE_URL est défini (survit aux redémarrages de Render), sinon fichier local.
let pool = null;
if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    const u = process.env.DATABASE_URL;
    pool = new Pool({ connectionString: u, max: 3, connectionTimeoutMillis: 8000, ssl: /\.render\.com/.test(u) ? { rejectUnauthorized: false } : undefined });
    pool.on('error', (e) => console.warn('pg:', e.message));
  } catch (e) { console.warn('Module pg indisponible, sauvegarde sur fichier.', e.message); pool = null; }
}
let persist = { mode: pool ? 'db' : 'fichier', lastOk: null, lastError: null };
function adopt(s) {
  const base = freshState();
  state = { ...base, ...s, info: { ...base.info, ...(s.info || {}) } };
  // cohérence : toutes les piles présentes
  for (const p of DATA.piles) if (!state.engine.piles[p.id]) state.engine.piles[p.id] = Engine.newPile(DATA.cards, p.id);
}
async function loadState() {
  state = null;
  if (pool) {
    try {
      await pool.query('CREATE TABLE IF NOT EXISTS kv (k text PRIMARY KEY, v jsonb NOT NULL, updated timestamptz NOT NULL DEFAULT now())');
      const r = await pool.query("SELECT v FROM kv WHERE k = 'state'");
      if (r.rows[0]) { adopt(r.rows[0].v); console.log('État restauré depuis la base.'); }
      persist.lastOk = Date.now();
    } catch (e) { persist.lastError = e.message; console.warn('Lecture base impossible:', e.message); }
  }
  if (!state) {
    try { adopt(JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))); } catch (e) { state = freshState(); }
  }
}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const json = JSON.stringify(state);
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(STATE_FILE, json); } catch (e) { /* best effort */ }
    if (pool) {
      try { await pool.query("INSERT INTO kv (k, v) VALUES ('state', $1::jsonb) ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v, updated = now()", [json]); persist.lastOk = Date.now(); persist.lastError = null; }
      catch (e) { persist.lastError = e.message; console.warn('Sauvegarde base impossible:', e.message); }
    }
  }, 400);
}

// ---- Présence (SSE) ----
const clients = new Map(); // deviceId -> { res, name, since }
function sse(res, event, data) { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); }
function broadcast(event, data) { for (const c of clients.values()) sse(c.res, event, data); }
function publicInfo() { return state.info; }
function snapshotFor(device) {
  const n = state.numbers;
  return {
    counts: Engine.counts(state.engine),
    info: publicInfo(),
    numbers: { active: n.active, round: n.round, number: n.active && device in n.assigned ? n.assigned[device] : undefined, assigned: n.active ? device in n.assigned : false },
    online: clients.size,
  };
}
setInterval(() => { for (const c of clients.values()) { try { c.res.write(': ping\n\n'); } catch (e) { /* ignore */ } } }, 20000);

// ---- Admin ----
const tokens = new Set();
const attempts = new Map();
function safeEq(a, b) { const x = Buffer.from(String(a)); const y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); }
function isAdmin(req) { return tokens.has(req.headers['x-admin-token']); }

function adminState() {
  const players = [...clients.entries()].map(([id, c]) => ({ id, name: c.name || '', number: state.numbers.active ? state.numbers.assigned[id] ?? null : null }));
  return {
    counts: Engine.counts(state.engine), reshuffles: state.engine.reshuffles, info: state.info,
    numbers: { active: state.numbers.active, round: state.numbers.round }, players, log: state.log.slice(-20).reverse(),
    persist: { mode: persist.mode, ok: !persist.lastError, error: persist.lastError || '', lastOk: persist.lastOk },
  };
}

function logDraw(device, name, pile, id, extra) {
  state.log.push({ t: Date.now(), device, name: name || '', pile, id, extra: extra || '' });
  if (state.log.length > 200) state.log.splice(0, state.log.length - 200);
}

// ---- HTTP ----
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' };
const COMMON = { 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' };

function send(res, code, body, headers) {
  res.writeHead(code, { ...COMMON, ...headers });
  res.end(body);
}
function json(res, code, obj) { send(res, code, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); }
function readBody(req) {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', (d) => { b += d; if (b.length > 20000) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { resolve({}); } });
  });
}
const cleanName = (s) => String(s || '').replace(/[<>]/g, '').trim().slice(0, 24);
const validPile = (p) => DATA.piles.some((x) => x.id === p);

async function api(req, res, url) {
  const p = url.pathname;
  if (req.method === 'GET' && p === '/api/events') {
    const device = String(url.searchParams.get('device') || '').slice(0, 64);
    if (!device) return json(res, 400, { error: 'device' });
    const name = cleanName(url.searchParams.get('name'));
    res.writeHead(200, { ...COMMON, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const prev = clients.get(device);
    if (prev) { try { prev.res.end(); } catch (e) { /* ignore */ } }
    clients.set(device, { res, name, since: Date.now() });
    sse(res, 'snapshot', snapshotFor(device));
    broadcast('online', { online: clients.size });
    req.on('close', () => { if (clients.get(device) && clients.get(device).res === res) { clients.delete(device); broadcast('online', { online: clients.size }); } });
    return;
  }
  if (req.method === 'GET' && p === '/api/state') return json(res, 200, snapshotFor(String(url.searchParams.get('device') || '')));

  if (req.method === 'POST' && p === '/api/name') {
    const b = await readBody(req); const c = clients.get(String(b.device || ''));
    if (c) c.name = cleanName(b.name);
    return json(res, 200, { ok: true });
  }
  if (req.method === 'POST' && (p === '/api/draw' || p === '/api/drawClassic')) {
    const b = await readBody(req);
    if (!validPile(b.pile)) return json(res, 400, { error: 'pile' });
    const r = p === '/api/draw' ? Engine.draw(state.engine, DATA, b.pile) : Engine.drawClassic(state.engine, DATA, b.pile);
    logDraw(b.device, cleanName(b.name), b.pile, r.id, p === '/api/drawClassic' ? 'carte à résoudre' : '');
    save();
    const counts = Engine.counts(state.engine);
    broadcast('counts', { counts });
    return json(res, 200, { id: r.id, reshuffled: r.reshuffled, counts });
  }
  if (req.method === 'POST' && p === '/api/putback') {
    const b = await readBody(req);
    const card = CARD_BY_ID.get(b.id);
    if (!card || !validPile(b.pile) || card.pile !== b.pile) return json(res, 400, { error: 'card' });
    const ok = Engine.putBack(state.engine, b.pile, b.id);
    logDraw(b.device, cleanName(b.name), b.pile, b.id, 'remise dans la pile');
    save();
    const counts = Engine.counts(state.engine);
    broadcast('counts', { counts });
    return json(res, 200, { ok, counts });
  }

  // ---- Admin ----
  if (req.method === 'POST' && p === '/api/admin/login') {
    const ip = req.socket.remoteAddress; const now = Date.now();
    const a = (attempts.get(ip) || []).filter((t) => now - t < 60000);
    if (a.length >= 8) return json(res, 429, { error: 'trop de tentatives' });
    const b = await readBody(req);
    if (!ADMIN_PIN || !safeEq(b.pin || '', ADMIN_PIN)) { a.push(now); attempts.set(ip, a); return json(res, 401, { error: 'code incorrect' }); }
    const t = crypto.randomBytes(24).toString('hex'); tokens.add(t);
    return json(res, 200, { token: t });
  }
  if (p.startsWith('/api/admin/')) {
    if (!isAdmin(req)) return json(res, 401, { error: 'non autorisé' });
    if (req.method === 'GET' && p === '/api/admin/state') return json(res, 200, adminState());
    const b = await readBody(req);
    if (p === '/api/admin/reshuffle') {
      const piles = b.pile === 'all' ? DATA.piles.map((x) => x.id) : [b.pile];
      for (const id of piles) if (validPile(id)) { state.engine.piles[id] = Engine.newPile(DATA.cards, id); }
      save(); broadcast('counts', { counts: Engine.counts(state.engine) });
      return json(res, 200, adminState());
    }
    if (p === '/api/admin/info') {
      for (const k of Object.keys(DEFAULT_INFO)) if (typeof b[k] === 'string') state.info[k] = b[k].slice(0, 600);
      save(); broadcast('info', { info: state.info });
      return json(res, 200, adminState());
    }
    if (p === '/api/admin/numbers/start') {
      const ids = Engine.shuffle([...clients.keys()]);
      const nums = Engine.shuffle(Array.from({ length: 15 }, (_, i) => i + 1));
      const assigned = {};
      ids.slice(0, 15).forEach((id, i) => { assigned[id] = nums[i]; });
      state.numbers = { active: true, round: state.numbers.round + 1, assigned };
      save();
      for (const [id, c] of clients) sse(c.res, 'numbers', { active: true, round: state.numbers.round, number: assigned[id] ?? null, assigned: id in assigned });
      return json(res, 200, { ...adminState(), unassigned: Math.max(0, ids.length - 15) });
    }
    if (p === '/api/admin/numbers/stop') {
      state.numbers = { ...state.numbers, active: false, assigned: {} };
      save(); broadcast('numbers', { active: false, round: state.numbers.round });
      return json(res, 200, adminState());
    }
    if (p === '/api/admin/reset') {
      const info = state.info; state = freshState(); state.info = info; save();
      broadcast('counts', { counts: Engine.counts(state.engine) }); broadcast('numbers', { active: false });
      return json(res, 200, adminState());
    }
    return json(res, 404, { error: 'not found' });
  }
  return json(res, 404, { error: 'not found' });
}

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  if (rel === '/admin') rel = '/admin.html';
  if (rel === '/healthz') return send(res, 200, 'ok', { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'forbidden', { 'Content-Type': 'text/plain' });
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, 'Introuvable', { 'Content-Type': 'text/plain; charset=utf-8' });
    const ext = path.extname(file);
    const long = ext === '.woff2' || ext === '.webp' || ext === '.png';
    send(res, 200, req.method === 'HEAD' ? '' : buf, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': long ? 'public, max-age=86400' : 'no-cache' });
  });
}

loadState().then(() => http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')) return api(req, res, url).catch((e) => { console.error(e); json(res, 500, { error: 'erreur' }); });
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'method', { 'Content-Type': 'text/plain' });
  serveStatic(req, res, url);
}).listen(PORT, () => console.log(`Sogne Birthday sur http://localhost:${PORT}  (admin: /admin, sauvegarde: ${persist.mode})`)));
