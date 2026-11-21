// Función de Medianoche — zombies cooperativo en pixel art (fase 1: un jugador)
'use strict';
const VERSION = 'v14 · zombies dorados';
document.getElementById('ver').textContent = VERSION;

/* ============================ MAPA ============================ */
const TS = 16, CW = 16, CH = 12, MX = 2, MY = 2;
const MW = 3 * CW + 1 + MX * 2, MH = 4 * CH + 1 + MY * 2;
const VW = 272, VH = 160;
const VOID = 0, FLOOR = 1, DOOR = 2, WIN = 3, OUT = 4, SEAT = 5;
const tiles = new Uint8Array(MW * MH), roomAt = new Int8Array(MW * MH).fill(-1);
const doorAt = new Int8Array(MW * MH).fill(-1), winAt = new Int16Array(MW * MH).fill(-1);
const idx = (x, y) => y * MW + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
const T = (x, y) => inb(x, y) ? tiles[idx(x, y)] : VOID;
const tAt = (px, py) => T(Math.floor(px / TS), Math.floor(py / TS));

const ROOMS = [
  { n: 'Vestíbulo', cells: [[2, 1]], fl: 'carpet' },
  { n: 'Dulcería', cells: [[1, 1]], fl: 'checker' },
  { n: 'Sala de butacas', cells: [[2, 2]], fl: 'carpetDark' },
  { n: 'Escenario', cells: [[1, 2]], fl: 'wood' },
  { n: 'Callejón', cells: [[0, 1]], fl: 'asphalt' },
  { n: 'Camerinos', cells: [[0, 2]], fl: 'purple' },
  { n: 'Azotea del neón', cells: [[0, 0]], fl: 'gravel' },
  { n: 'Sótano de utilería', cells: [[0, 3], [1, 3]], fl: 'concrete' },
];
function setT(x, y, t, room) { const i = idx(x, y); tiles[i] = t; if (room !== undefined) roomAt[i] = room; }
ROOMS.forEach((R, r) => R.cells.forEach(([cx, cy]) => {
  for (let y = cy * CH + 1; y < cy * CH + CH; y++) for (let x = cx * CW + 1; x < cx * CW + CW; x++) setT(x + MX, y + MY, FLOOR, r);
}));
for (let y = 3 * CH + 1; y < 4 * CH; y++) setT(CW + MX, y + MY, FLOOR, 7);   // sótano de 2 celdas

function wallBetween(a, b) {
  if (a[1] === b[1]) { const x = Math.max(a[0], b[0]) * CW; return [0, 1, 2].map(k => [x + MX, a[1] * CH + 5 + k + MY]); }
  const y = Math.max(a[1], b[1]) * CH; return [0, 1, 2].map(k => [a[0] * CW + 7 + k + MX, y + MY]);
}
const DOORS = [
  { cost: 750, a: 0, b: 1, c: [[2, 1], [1, 1]] },
  { cost: 1000, a: 0, b: 2, c: [[2, 1], [2, 2]] },
  { cost: 1250, a: 3, b: 5, c: [[1, 2], [0, 2]] },
  { cost: 1000, a: 1, b: 4, c: [[1, 1], [0, 1]] },
  { cost: 1250, a: 4, b: 6, c: [[0, 1], [0, 0]] },
  { cost: 1500, a: 4, b: 5, c: [[0, 1], [0, 2]] },
  { cost: 1000, a: 5, b: 7, c: [[0, 2], [0, 3]] },
];
DOORS.forEach((d, id) => {
  d.tiles = wallBetween(d.c[0], d.c[1]);
  d.tiles.forEach(([x, y]) => { setT(x, y, DOOR); doorAt[idx(x, y)] = id; });
  d.x = d.tiles[1][0] * TS + 8; d.y = d.tiles[1][1] * TS + 8;
  d.vertical = d.c[0][1] === d.c[1][1];
});
wallBetween([2, 2], [1, 2]).forEach(([x, y]) => setT(x, y, FLOOR, 2));      // paso libre sala ↔ escenario
const FREE_LINKS = [[2, 3]];

const WINDOWS = [];
function addWin(room, cx, cy, side, off) {
  let x, y, dx = 0, dy = 0;
  if (side === 'T') { x = cx * CW + off; y = cy * CH; dy = -1; }
  if (side === 'B') { x = cx * CW + off; y = (cy + 1) * CH; dy = 1; }
  if (side === 'L') { x = cx * CW; y = cy * CH + off; dx = -1; }
  if (side === 'R') { x = (cx + 1) * CW; y = cy * CH + off; dx = 1; }
  x += MX; y += MY;
  const c = (a, b) => [a * TS + 8, b * TS + 8];
  const w = { room, x, y, dx, dy, boards: 6, vertical: dx !== 0 };
  [w.px, w.py] = c(x, y); [w.ox, w.oy] = c(x + dx, y + dy); [w.sx, w.sy] = c(x + 3 * dx, y + 3 * dy); [w.ix, w.iy] = c(x - dx, y - dy);
  setT(x, y, WIN); winAt[idx(x, y)] = WINDOWS.length;
  for (let k = 1; k <= 3; k++) setT(x + k * dx, y + k * dy, OUT);
  WINDOWS.push(w);
}
addWin(0, 2, 1, 'T', 4); addWin(0, 2, 1, 'T', 11); addWin(0, 2, 1, 'R', 6);
addWin(1, 1, 1, 'T', 4); addWin(1, 1, 1, 'T', 11);
addWin(2, 2, 2, 'R', 3); addWin(2, 2, 2, 'R', 8);
addWin(4, 0, 1, 'L', 3); addWin(4, 0, 1, 'L', 8);
addWin(5, 0, 2, 'L', 5);
addWin(6, 0, 0, 'T', 4); addWin(6, 0, 0, 'L', 5); addWin(6, 0, 0, 'R', 5);
addWin(7, 0, 3, 'B', 5); addWin(7, 1, 3, 'B', 10); addWin(7, 1, 3, 'R', 6);

// butacas en la sala (obstáculos con pasillos)
for (const y of [27, 29, 31, 33]) for (const x of [35, 36, 37, 38, 42, 43, 44, 45]) setT(x + MX, y + MY, SEAT);

const WEAPONS = {
  pistola: { n: 'Pistola', dmg: 35, rate: .22, mag: 8, res: 80, rel: 1.2, spread: .03, range: 210, auto: false, cost: 250 },
  escopeta: { n: 'Escopeta', dmg: 28, pellets: 6, rate: .75, mag: 6, res: 36, rel: 2.2, spread: .22, range: 110, auto: false, cost: 1000 },
  subfusil: { n: 'Subfusil', dmg: 30, rate: .085, mag: 30, res: 180, rel: 1.8, spread: .07, range: 190, auto: true, cost: 1200 },
  rifle: { n: 'Rifle', dmg: 60, rate: .13, mag: 30, res: 150, rel: 2, spread: .03, range: 240, auto: true, cost: 1400 },
  ametra: { n: 'Ametralladora', dmg: 55, rate: .075, mag: 75, res: 225, rel: 3.5, spread: .09, range: 220, auto: true, cost: 1800 },
  // solo en el baúl misterioso
  revolver: { n: 'Revólver', dmg: 140, rate: .35, mag: 6, res: 48, rel: 2, spread: .01, range: 240, auto: false, box: true },
  confeti: { n: 'Lanza confeti', dmg: 400, rate: .6, mag: 4, res: 20, rel: 2.5, spread: .01, range: 200, auto: false, explode: 36, box: true },
  hielo: { n: 'Rayo congelante', dmg: 90, rate: .3, mag: 12, res: 60, rel: 2, spread: 0, range: 230, auto: false, pierce: true, slow: true, box: true },
};
const BOX_POOL = ['escopeta', 'subfusil', 'rifle', 'ametra', 'revolver', 'revolver', 'confeti', 'hielo'];
function wstat(g) {      // estadísticas del arma (dobles si está mejorada)
  const W = WEAPONS[g.id];
  if (!g.up) return W;
  return { ...W, n: W.n + ' mejorada', dmg: W.dmg * 2, mag: Math.round(W.mag * 1.5), res: W.res * 2, explode: W.explode && W.explode * 1.3 };
}
const BOX_LOCS = [[40, 35, 2], [8, 22, 4], [28, 46, 7]].map(([x, y, room]) => ({ x: (x + MX) * TS + 8, y: (y + MY) * TS + 8, room }));
const PAP = { x: (8 + MX) * TS + 8, y: (46 + MY) * TS + 8, cost: 5000 };
const POTIONS = [
  { id: 'coraza', n: 'Soda Coraza', cost: 2500, x: 18, y: 22, c: '#e8443a', d: 'Aguantas más golpes' },
  { id: 'turbo', n: 'Palomitas Turbo', cost: 2000, x: 30, y: 22, c: '#ffc93c', d: 'Recargas el doble de rápido' },
  { id: 'angel', n: 'Jugo Ángel', cost: 1500, x: 12, y: 34, c: '#8fd0ff', d: 'Te levanta una vez si caes' },
  { id: 'veloz', n: 'Paleta Veloz', cost: 2000, x: 18, y: 26, c: '#b78cff', d: 'Corres más rápido' },
].map(p => ({ ...p, x: (p.x + MX) * TS + 8, y: (p.y + MY) * TS + 8 }));
const DROPS = { ammo: { n: 'MUNICIÓN MÁXIMA', c: '#8fd0ff', l: 'M' }, x2: { n: 'DOBLE PUNTOS', c: '#ffc93c', l: '2' }, kill: { n: 'GOLPE MORTAL', c: '#ff4040', l: '!' }, bomb: { n: 'BOMBA', c: '#ff9a3c', l: 'B' }, carp: { n: 'CARPINTERO', c: '#b07a46', l: 'C' } };
// armas en la pared: [arma, celda, desplazamiento en la pared de arriba]
const WALLBUYS = [['pistola', 2, 1, 7], ['escopeta', 1, 1, 8], ['subfusil', 2, 2, 12], ['rifle', 0, 1, 12], ['ametra', 0, 2, 3]]
  .map(([w, cx, cy, off]) => ({ w, tx: cx * CW + off + MX, ty: cy * CH + MY, x: (cx * CW + off + MX) * TS + 8, y: (cy * CH + MY) * TS + 8 }));

const SWITCH = { x: (12 + MX) * TS + 8, y: (1 + MY) * TS + 8 };
const TRAPS = [{ x: (24 + MX) * TS + 8, y: (30 + MY) * TS + 8, to: 1, room: 3 }, { x: (24 + MX) * TS + 8, y: (42 + MY) * TS + 8, to: 0, room: 7 }];
const START = { x: (40 + MX) * TS + 8, y: (18 + MY) * TS + 8 };

/* ============================ SPRITES ============================ */
const SP = {};
function mk(name, rows, pal) {
  const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
  const x = c.getContext('2d');
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i, j, 1, 1); } }));
  SP[name] = c; return c;
}
const ZROWS = ['....gggg....', '...gggggg...', '...grggrg...', '...gGggGg...', '....gGGg....', 'gg.bbbbbb.gg', '.g.bbBbbb.g.',
  '...bbbBbb...', '...bBbbbb...', '...bbbbbb...', '...pppppp...', '...pp..pp...', '...pp..pp...', '...kk..kk...'];
mk('zombie', ZROWS, { g: '#7fae5a', G: '#4f7a38', r: '#ff3030', b: '#6b5a4a', B: '#4a3a2e', p: '#3a3550', k: '#1a1418' });
mk('zombieG', ZROWS, { g: '#ffd84a', G: '#c8961e', r: '#ff3030', b: '#b8860b', B: '#8a6410', p: '#6a5020', k: '#3a2a10' });
mk('zombieW', ZROWS, { g: '#fff', G: '#fff', r: '#fff', b: '#fff', B: '#fff', p: '#fff', k: '#fff' });
const PROWS = ['....hhhh....', '...hhhhhh...', '...hsssshh..', '...skssks...', '...ssssss...', '....ssss....', '..cccccccc..',
  '.scCccccCcs.', '.s.cccccc.s.', '...cccccc...', '...pppppp...', '...pp..pp...', '...pp..pp...', '...kk..kk...'];
const CHARS = [
  { n: 'Zairene', h: '#5a3220', c: '#ff7eb6', C: '#c4467f' },
  { n: 'Palomito', h: '#231a1a', c: '#5b8cff', C: '#3352b8' },
  { n: 'Verde', h: '#d9a040', c: '#4caf3a', C: '#2f7d24' },
  { n: 'Naranja', h: '#8a3a1a', c: '#ff9a3c', C: '#c46a1a' },
];
CHARS.forEach((c, i) => mk('p' + i, PROWS, { h: c.h, s: '#ffcfa8', k: '#2a1a22', c: c.c, C: c.C, p: '#2c2f48' }));

/* ============================ ESTADO ============================ */
let G = null, myChar = 0, phase = 'menu';
// red: el anfitrión simula todo; los invitados mandan su posición y botones
let isHost = true, myIdx = 0, netOn = false;
let evQ = { fx: [], tr: [], bl: [] }, sndQ = [];
// away = desconectado o sin responder: se queda quieto y los zombies lo ignoran hasta que vuelva
const alive = p => p && !p.down && !p.dead && !p.left && !p.away;
function addFx(f) { G.fx.push(f); if (isHost && netOn && evQ.fx.length < 80) evQ.fx.push(f); }
function addTr(t) { G.tracers.push(t); if (isHost && netOn && evQ.tr.length < 60) evQ.tr.push(t); }
function addBlood(b) { if (G.blood.length > 160) G.blood.shift(); G.blood.push(b); if (isHost && netOn && evQ.bl.length < 40) evQ.bl.push(b); }
function newGame(list) {
  ROUTE = null; mapOpen = false; syncMapUI();
  for (const k in GUIDES) delete GUIDES[k];
  list = list || [{ name: myName(), ch: myChar }];
  G = {
    round: 0, state: 'break', breakT: 4, toSpawn: 0, spawnT: 0, power: false,
    roomOpen: ROOMS.map((_, i) => i === 0), zombies: [], fx: [], blood: [], tracers: [], banner: 0, flowT: 0,
    players: list.map((l, i) => { const p = newPlayer(l.ch, l.name); p.idx = i; p.x += [0, 16, -16, 0][i]; p.y += [0, 0, 0, 16][i]; return p; }),
    solo: list.length === 1, over: null,
    box: { loc: Math.floor(Math.random() * BOX_LOCS.length), st: 'idle', t: 0, gun: null, show: '', uses: 0, minUses: 4 + Math.floor(Math.random() * 4), owner: null },
    pap: { st: 'idle', t: 0, owner: null, gid: null },
    drops: [], dropsRound: 0, x2T: 0, killT: 0, msg: '', msgT: 0, zid: 0, nextGold: 2 + Math.floor(Math.random() * 4), goldPending: false,
  };
  DOORS.forEach(d => { d.open = false; d.tiles.forEach(([x, y]) => setT(x, y, DOOR)); });
  WINDOWS.forEach(w => { w.boards = 6; });
}
function newPlayer(ch, name) {
  return {
    ch, name: name || CHARS[ch].n, x: START.x, y: START.y, aim: 0, hp: 100, maxHp: 100, hurtT: 9, pts: 500, kills: 0, down: false,
    potions: [], invT: 0, idx: 0, tp: 0, bleed: 0, revT: 0, revBy: -1, dead: false, left: false,
    guns: [gun('pistola')], cur: 0, cool: 0, relT: 0, knifeT: 0, knifeAnim: 0, repT: 0, trapT: 0, flash: 0, mv: false, face: 1,
  };
}
function gun(id, up) { const w = wstat({ id, up }); return { id, up: !!up, ammo: w.mag, res: w.res }; }
const hasPot = (p, id) => p.potions.includes(id);
function addPts(p, n) { p.pts += n * (G.x2T > 0 ? 2 : 1); }
function flash(msg) { G.msg = msg; G.msgT = 2.5; }

/* ============================ SONIDO ============================ */
let AC = null, NOISE = null;
function ensureAudio() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      NOISE = AC.createBuffer(1, AC.sampleRate * 0.4, AC.sampleRate);
      const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { }
  }
  if (AC && AC.state === 'suspended') AC.resume();
}
function tone(f, d, type = 'square', v = .05, slide = 0, delay = 0) {
  if (!AC) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .02);
}
function noise(d, freq, v) {
  if (!AC) return; const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(), t = AC.currentTime;
  s.buffer = NOISE; f.type = 'bandpass'; f.frequency.value = freq; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(f).connect(g).connect(AC.destination); s.start(t); s.stop(t + d);
}
const SFX = {
  pistola: () => noise(.12, 1800, .35), escopeta: () => { noise(.3, 700, .5); }, subfusil: () => noise(.07, 2200, .25),
  rifle: () => noise(.1, 1400, .32), ametra: () => noise(.09, 1100, .32), empty: () => tone(900, .03, 'square', .03),
  reload: () => { tone(500, .05, 'square', .03); tone(700, .05, 'square', .03, 0, .15); }, knife: () => noise(.08, 4000, .2),
  hit: () => tone(180, .05, 'square', .04), kill: () => { noise(.15, 400, .25); }, hurt: () => tone(110, .25, 'sawtooth', .08, -50),
  board: () => tone(260, .08, 'triangle', .08), boardBreak: () => noise(.15, 900, .25), buy: () => { tone(988, .08, 'square', .05); tone(1319, .15, 'square', .05, 0, .08); },
  no: () => tone(140, .15, 'sawtooth', .05), power: () => { tone(110, .6, 'sawtooth', .08, 300); tone(880, .4, 'triangle', .06, 0, .5); },
  trap: () => tone(300, .3, 'sine', .08, 500), groan: () => tone(70 + Math.random() * 40, .5, 'sawtooth', .025, -20),
  round: () => { tone(98, .9, 'sawtooth', .07); tone(92, .9, 'sawtooth', .06, 0, .05); tone(73, 1.4, 'sawtooth', .07, 0, .9); },
  roundEnd: () => { tone(196, .5, 'triangle', .08); tone(262, .7, 'triangle', .08, 0, .4); },
  revolver: () => noise(.18, 900, .45), confeti: () => { tone(400, .15, 'square', .05, 300); }, hielo: () => tone(1600, .25, 'sine', .07, -1200),
  boom: () => { noise(.5, 250, .6); tone(60, .5, 'sine', .15, -30); },
  box: () => { for (let i = 0; i < 12; i++) tone(523 + (i % 4) * 131, .12, 'triangle', .05, 0, i * .24); },
  dove: () => { tone(1200, .1, 'sine', .06, 400); tone(1400, .1, 'sine', .06, 400, .15); tone(300, .6, 'sawtooth', .05, -150, .3); },
  drink: () => { for (let i = 0; i < 4; i++) tone(300 + i * 60, .08, 'sine', .07, 0, i * .1); tone(900, .3, 'triangle', .06, 0, .5); },
  pap: () => { for (let i = 0; i < 6; i++) tone(200 + i * 40, .3, 'sawtooth', .04, 0, i * .45); },
  drop: () => { tone(784, .1, 'square', .05); tone(1047, .1, 'square', .05, 0, .1); tone(1568, .25, 'square', .05, 0, .2); },
};
const play_ = n => SFX[n] && SFX[n]();
// el anfitrión también manda los sonidos a los invitados (sin repetir los muy seguidos)
const sfx = n => { if (!isHost) return; play_(n); if (netOn && sndQ.length < 24) sndQ.push(n); };

/* ============================ FÍSICA ============================ */
const pSolid = t => t !== FLOOR;
const zSolid = t => t !== FLOOR;
function blocked(x, y, r, solid) {
  return solid(tAt(x - r, y - r)) || solid(tAt(x + r, y - r)) || solid(tAt(x - r, y + r)) || solid(tAt(x + r, y + r));
}
function move(e, vx, vy, dt, solid, r) {
  const nx = e.x + vx * dt; if (!blocked(nx, e.y, r, solid)) e.x = nx;
  const ny = e.y + vy * dt; if (!blocked(e.x, ny, r, solid)) e.y = ny;
}
const dist2 = (a, b, x, y) => (a - x) * (a - x) + (b - y) * (b - y);

// mapa de distancias desde los jugadores (los zombies bajan por él)
const DIST = new Int16Array(MW * MH), Q = new Int32Array(MW * MH);
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
function flowField() {
  DIST.fill(-1); let h = 0, t = 0;
  G.players.forEach(p => { if (alive(p)) { const i = idx(Math.floor(p.x / TS), Math.floor(p.y / TS)); if (DIST[i] < 0) { DIST[i] = 0; Q[t++] = i; } } });
  while (h < t) {
    const i = Q[h++], x = i % MW, y = (i / MW) | 0, d = DIST[i] + 1;
    for (const [dx, dy] of N4) { const j = idx(x + dx, y + dy); if (DIST[j] < 0 && tiles[j] === FLOOR) { DIST[j] = d; Q[t++] = j; } }
  }
}

/* ============================ ZOMBIES Y RONDAS ============================ */
const roundTotal = r => Math.round(4 + r * 3 + r * r * .3);
const zombieHp = r => r < 10 ? 100 + 80 * (r - 1) : Math.round(820 * Math.pow(1.1, r - 9));
function startRound() {
  G.round++; G.dropsRound = 0;
  // zombie dorado: uno cada 2 a 5 rondas (al azar)
  if (G.round >= G.nextGold) { G.goldPending = true; G.nextGold = G.round + 2 + Math.floor(Math.random() * 4); } G.toSpawn = roundTotal(G.round) + (G.players.filter(p => !p.left).length - 1) * (2 + G.round); G.spawnT = 1.5; G.state = 'round'; G.banner = 3; sfx('round');
  // los que se desangraron vuelven con pistola junto a un compañero
  const a = G.players.find(alive);
  if (a) for (const p of G.players) if (p.dead && !p.left) {
    Object.assign(p, { dead: false, down: false, hp: 100, maxHp: 100, guns: [gun('pistola')], cur: 0, relT: 0, potions: [], invT: 3, x: a.x, y: a.y, revT: 0 });
    p.tp++; flash('¡' + p.name.toUpperCase() + ' VOLVIÓ!');
  }
}
// ¿se ve en línea recta de (x1,y1) a (x2,y2)? (las butacas no tapan la vista)
function sees(x1, y1, x2, y2) {
  const d = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(d / 4);
  for (let i = 1; i < n; i++) {
    const t = tAt(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n);
    if (t === VOID || t === DOOR) return false;
  }
  return true;
}
// camino recto libre para caminar (sin butacas ni paredes)
function walkable(x1, y1, x2, y2) {
  const d = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(d / 4);
  for (let i = 1; i < n; i++) {
    const x = x1 + (x2 - x1) * i / n, y = y1 + (y2 - y1) * i / n;
    if (blocked(x, y, 4, zSolid)) return false;
  }
  return true;
}
const VISION = 170;
// ventana para atacar: de las más cercanas a los jugadores (al azar entre las 3 mejores),
// sin salir justo encima de alguien
function pickWindow() {
  const live = G.players.filter(alive);
  const open = WINDOWS.filter(w => G.roomOpen[w.room]).map(w => ({ w, d: Math.min(...live.map(p => Math.hypot(p.x - w.px, p.y - w.py))) }))
    .filter(o => o.d > 56).sort((a, b) => a.d - b.d);
  if (!open.length) { const any = WINDOWS.filter(w => G.roomOpen[w.room]); return any.length ? any[Math.floor(Math.random() * any.length)] : null; }
  return open[Math.floor(Math.random() * Math.min(3, open.length))].w;
}
function respawnNear(z) {
  const w = pickWindow(); if (!w) return;
  z.w = w; z.x = w.sx; z.y = w.sy; z.st = 'out'; z.unseen = 0; z.lost = 0;
}
function spawnZombie() {
  const best = pickWindow();
  if (!best) return false;
  const r = G.round, roll = Math.random();
  let sp = 20 + Math.random() * 6;
  if (r >= 3 && roll < Math.min(.85, (r - 2) * .14)) sp = 38 + Math.random() * 8;
  if (r >= 6 && roll < Math.min(.45, (r - 5) * .08)) sp = 56 + Math.random() * 6;
  // el dorado sale a media ronda
  const gold = G.goldPending && G.toSpawn <= Math.ceil(roundTotal(r) / 2);
  if (gold) { G.goldPending = false; flash('¡UN ZOMBIE DORADO ANDA SUELTO!'); sfx('power'); }
  G.zombies.push({ id: ++G.zid, gold, rush: !gold && Math.random() < .10 + Math.random() * .05, x: best.sx, y: best.sy, w: best, st: 'out', hp: zombieHp(r) * (gold ? 2 : 1), sp: gold ? Math.max(sp, 30) : sp, atk: 0, flash: 0, lost: 0, face: 1, anim: Math.random() * 10 });
  return true;
}
function updateZombies(dt) {
  G.flowT -= dt; if (G.flowT <= 0) { flowField(); G.flowT = .2; }
  for (const z of G.zombies) {
    z.flash -= dt; z.atk -= dt; z.anim += dt;
    if (Math.random() < dt * .05) sfx('groan');
    if (z.st === 'out') {
      const w = z.w;
      // esperando en una ventana lejos de todos: se cambia a una ventana más cercana
      const near = Math.min(...G.players.filter(alive).map(p => Math.hypot(p.x - w.px, p.y - w.py)));
      if (near > 230) { z.unseen = (z.unseen || 0) + dt; if (z.unseen > 7) { respawnNear(z); continue; } } else z.unseen = 0;
      if (w.boards > 0) {
        const d = Math.hypot(w.ox - z.x, w.oy - z.y);
        if (d > 2) { z.x += (w.ox - z.x) / d * z.sp * dt; z.y += (w.oy - z.y) / d * z.sp * dt; }
        else if (z.atk <= 0) { w.boards--; z.atk = 1.1; sfx('boardBreak'); }
      } else {
        const d = Math.hypot(w.ix - z.x, w.iy - z.y);
        if (d > 2) { z.x += (w.ix - z.x) / d * z.sp * dt; z.y += (w.iy - z.y) / d * z.sp * dt; }
        else z.st = 'in';
      }
      continue;
    }
    // dentro: si ve a alguien, va por el jugador visible más cercano; si no, sigue el camino más corto
    let tp = null, td = 1e12, vis = false;
    for (const p of G.players) { if (p.dead || p.left) continue;
      if (!alive(p)) continue; const d = dist2(p.x, p.y, z.x, z.y);
      if (d < VISION * VISION && d < td && sees(z.x, z.y, p.x, p.y)) { td = d; tp = p; vis = true; }
    }
    if (!tp) for (const p of G.players) { if (!alive(p)) continue; const d = dist2(p.x, p.y, z.x, z.y); if (d < td) { td = d; tp = p; } }
    if (!tp) continue;
    // si nadie lo ve y está lejos, reaparece por una ventana cerca de los jugadores (otra ruta)
    if (!vis && td > 210 * 210) { z.unseen = (z.unseen || 0) + dt; if (z.unseen > 6) { respawnNear(z); continue; } } else z.unseen = 0;
    const tx = Math.floor(z.x / TS), ty = Math.floor(z.y / TS), here = DIST[idx(tx, ty)];
    let gx = tp.x, gy = tp.y;
    const direct = vis && walkable(z.x, z.y, tp.x, tp.y);
    if (here < 0 && !direct) { z.lost += dt; }
    else {
      z.lost = 0;
      if (!direct && here > 0) {
        let best = here;
        for (const [dx, dy] of N8) {
          const nx = tx + dx, ny = ty + dy, j = idx(nx, ny);
          if (tiles[j] !== FLOOR || DIST[j] < 0) continue;
          if (dx && dy && (tiles[idx(tx + dx, ty)] !== FLOOR || tiles[idx(tx, ty + dy)] !== FLOOR)) continue;
          if (DIST[j] < best) { best = DIST[j]; gx = nx * TS + 8; gy = ny * TS + 8; }
        }
      }
    }
    if (z.lost > 4) { respawnNear(z); continue; }   // atascado sin camino: reaparece en otra ventana
    // horda: si va en grupo (3+ cerca) y te ve, ~15% decide rodearte por la izquierda y ~15% por la derecha
    if (z.role === undefined && vis && td < 220 * 220) {
      let n = 0; for (const o of G.zombies) if (o !== z && o.st === 'in' && dist2(o.x, o.y, z.x, z.y) < 48 * 48) n++;
      if (n >= 3) {
        const q = Math.random(); z.role = q < .15 ? -1 : q < .3 ? 1 : 0;
        // punto fijo a un costado del jugador (unos 70° hacia su lado), para llegarle por el flanco
        if (z.role) z.fa = Math.atan2(z.y - tp.y, z.x - tp.x) + z.role * 1.25;
      }
    }
    if (z.role && !z.flankDone) {
      const fx = tp.x + Math.cos(z.fa) * 52, fy = tp.y + Math.sin(z.fa) * 52;
      if (td < 40 * 40 || dist2(z.x, z.y, fx, fy) < 14 * 14) z.flankDone = true;      // ya llegó al costado: ataca directo
      else if (!blocked(fx, fy, 4, zSolid) && walkable(z.x, z.y, fx, fy)) { gx = fx; gy = fy; }
      else z.flankDone = true;                                                        // no hay por dónde: sigue normal
    }
    const d = Math.hypot(gx - z.x, gy - z.y) || 1;
    z.slowT = (z.slowT || 0) - dt;
    // los "arrancones" (10-15%): al verte cerca aceleran de golpe para desestabilizarte
    const rushing = z.rush && vis && td < 130 * 130 && td > 14 * 14;
    const sp = (z.atk > .6 ? z.sp * .3 : z.sp) * (z.slowT > 0 ? .4 : 1) * (rushing ? 1.6 : 1);
    if (Math.sqrt(td) > 10) move(z, (gx - z.x) / d * sp, (gy - z.y) / d * sp, dt, zSolid, 4);
    z.face = gx < z.x ? -1 : 1;
    if (td < 13 * 13 && z.atk <= 0 && tp.invT <= 0) {
      z.atk = 1; tp.hp -= 45; tp.hurtT = 0; sfx('hurt');
      if (tp.hp <= 0) playerDown(tp);
    }
  }
  // separación entre zombies
  const zs = G.zombies;
  for (let i = 0; i < zs.length; i++) for (let j = i + 1; j < zs.length; j++) {
    const a = zs[i], b = zs[j]; if (a.st !== 'in' || b.st !== 'in') continue;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d > 0 && d < 9) { const p = (9 - d) / 2, ux = dx / d * p, uy = dy / d * p; move(a, -ux, -uy, 1, zSolid, 4); move(b, ux, uy, 1, zSolid, 4); }
  }
  G.zombies = zs.filter(z => !z.dead);
}
function playerDown(p) {
  if (G.solo && hasPot(p, 'angel')) {   // solo: Jugo Ángel te levanta una vez y pierdes las pociones
    p.potions = []; p.maxHp = 100; p.hp = 100; p.invT = 3; sfx('power'); flash('¡JUGO ÁNGEL TE LEVANTÓ!');
    for (const z of G.zombies) { const d = Math.hypot(z.x - p.x, z.y - p.y); if (z.st === 'in' && d < 40 && d > 0) move(z, (z.x - p.x) / d * 30, (z.y - p.y) / d * 30, 1, zSolid, 4); }
    return;
  }
  // en equipo: quedas en el suelo 30 s esperando que te revivan (puedes disparar con la pistola)
  p.hp = 0; p.down = true; p.potions = []; p.maxHp = 100; p.bleed = 30; p.revT = 0; p.relT = 0;
  if (!G.solo) flash(p.name.toUpperCase() + ' CAYÓ, ¡REVÍVELO!');
}
function revive(p) {
  p.down = false; p.hp = 100; p.maxHp = 100; p.invT = 2; p.revT = 0; sfx('power'); flash('¡' + p.name.toUpperCase() + ' DE VUELTA!');
}
function hurtZombie(z, dmg, p, knife) {
  if (G.killT > 0) dmg = 1e9;
  z.hp -= dmg; z.flash = .08; addPts(p, 10);
  for (let i = 0; i < 3; i++) addFx({ x: z.x, y: z.y - 2, vx: (Math.random() - .5) * 60, vy: (Math.random() - .5) * 60, l: .35, c: '#a01020' });
  if (z.hp <= 0 && !z.dead) {
    z.dead = true; addPts(p, knife ? 120 : 50); p.kills++; sfx('kill');
    if (z.gold) {         // el dorado siempre suelta un premio
      const types = ['ammo', 'bomb', 'x2', 'carp', 'kill'];
      G.drops.push({ k: types[Math.floor(Math.random() * types.length)], x: z.x, y: z.y, l: 30 }); flash('¡ZOMBIE DORADO ELIMINADO!');
    } else if (z.st === 'in' && G.dropsRound < 4 && Math.random() < .03) {
      const types = Object.keys(DROPS); G.drops.push({ k: types[Math.floor(Math.random() * types.length)], x: z.x, y: z.y, l: 25 }); G.dropsRound++;
    }
    addBlood({ x: z.x + (Math.random() * 6 - 3), y: z.y + 4, s: 3 + Math.random() * 4 });
    addFx({ k: 'corpse', x: z.x, y: z.y, l: .6, face: z.face });
  } else sfx('hit');
}

/* ============================ JUGADOR ============================ */
function ray(x, y, a, range) {
  const cs = Math.cos(a), sn = Math.sin(a); let wallT = range;
  for (let t = 4; t < range; t += 2) { const tt = tAt(x + cs * t, y + sn * t); if (tt === VOID || tt === DOOR) { wallT = t; break; } }
  let hit = null, ht = wallT; const all = [];
  for (const z of G.zombies) {
    if (z.dead) continue;
    const dx = z.x - x, dy = z.y - y, proj = dx * cs + dy * sn;
    if (proj < 0 || proj > wallT) continue;
    if (Math.abs(-dx * sn + dy * cs) < 7) { z._t = proj; all.push(z); if (proj < ht) { hit = z; ht = proj; } }
  }
  all.sort((a, b) => a._t - b._t);      // del más cercano al más lejano
  return { hit, t: ht, wallT, all };
}
function explode(x, y, R, dmg, p) {
  sfx('boom'); addFx({ k: 'boom', x, y, l: .3, R });
  for (let i = 0; i < 14; i++) addFx({ x, y, vx: (Math.random() - .5) * 140, vy: (Math.random() - .5) * 140, l: .5, c: ['#ff7eb6', '#ffc93c', '#5b8cff', '#4caf3a'][i % 4] });
  for (const z of G.zombies) if (!z.dead && Math.hypot(z.x - x, z.y - y) < R) hurtZombie(z, dmg, p, false);
}
function shoot(p) {
  const g = p.guns[p.cur], W = wstat(g);
  if (p.relT > 0 || p.cool > 0) return;
  if (g.ammo <= 0) { if (g.res > 0) reload(p); else { sfx('empty'); p.cool = .3; } return; }
  g.ammo--; p.cool = W.rate; p.flash = .05; sfx(SFX[g.id] ? g.id : 'rifle');
  const ox = p.x + Math.cos(p.aim) * 6, oy = p.y - 1 + Math.sin(p.aim) * 6;
  for (let k = 0; k < (W.pellets || 1); k++) {
    const a = p.aim + (Math.random() - .5) * 2 * W.spread;
    const r = ray(ox, oy, a, W.range);
    // las balas atraviesan hasta 3 zombies (la escopeta hasta 4); el rayo de hielo, todos
    const pen = g.id === 'escopeta' ? 4 : 3, hits = W.pierce ? r.all : r.all.slice(0, pen);
    const end = W.explode ? r.t : W.pierce || hits.length < pen ? r.wallT : hits[pen - 1]._t;
    addTr({ x1: ox, y1: oy, x2: ox + Math.cos(a) * end, y2: oy + Math.sin(a) * end, l: W.pierce ? .15 : .06, c: W.slow ? '#8fe8ff' : g.up ? '#c77dff' : null });
    if (W.explode) explode(ox + Math.cos(a) * r.t, oy + Math.sin(a) * r.t, W.explode, W.dmg, p);
    else hits.forEach(z => { hurtZombie(z, W.dmg, p, false); if (W.slow) z.slowT = 2.5; });
  }
  if (g.ammo === 0 && g.res > 0) reload(p);
}
function reload(p) {
  const g = p.guns[p.cur], W = wstat(g);
  if (p.relT > 0 || g.ammo >= W.mag || g.res <= 0) return;
  p.relT = W.rel * (hasPot(p, 'turbo') ? .5 : 1); sfx('reload');
}
function giveGun(p, g) {
  const i = p.guns.findIndex(o => o.id === g.id);
  if (i >= 0) { p.guns[i] = g; p.cur = i; }
  else if (p.guns.length < 2) { p.guns.push(g); p.cur = p.guns.length - 1; }
  else p.guns[p.cur] = g;
  p.relT = 0; p.cool = .3;
}
function knife(p) {
  if (p.knifeT > 0) return;
  p.knifeT = .65; p.knifeAnim = .2; sfx('knife');
  for (const z of G.zombies) {
    if (z.dead) continue;
    const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy);
    let da = Math.abs(Math.atan2(dy, dx) - p.aim); if (da > Math.PI) da = 2 * Math.PI - da;
    if (d < 20 && (da < 1.3 || d < 9)) hurtZombie(z, 150, p, true);
  }
}
function swap(p) { if (p.guns.length > 1) { p.cur = (p.cur + 1) % p.guns.length; p.relT = 0; p.cool = .3; } }

function openRoom(r) {
  if (G.roomOpen[r]) return; G.roomOpen[r] = true;
  FREE_LINKS.forEach(([a, b]) => { if (a === r) openRoom(b); if (b === r) openRoom(a); });
}
// lo que el jugador tiene cerca para usar con ACCIÓN
function interactable(p) {
  if (!alive(p)) return null;
  for (const o of G.players) if (o !== p && o.down && !o.dead && !o.left && dist2(p.x, p.y, o.x, o.y) < 18 * 18)
    return { k: 'revive', o, txt: 'Mantén para revivir a ' + o.name };
  for (let id = 0; id < DOORS.length; id++) {
    const d = DOORS[id]; if (d.open) continue;
    for (const [tx, ty] of d.tiles) if (dist2(p.x, p.y, tx * TS + 8, ty * TS + 8) < 24 * 24) return { k: 'door', d, txt: `Abrir puerta [${d.cost}]`, cost: d.cost };
  }
  for (const wb of WALLBUYS) {
    if (dist2(p.x, p.y, wb.x, wb.y + 10) < 20 * 20) {
      const W = WEAPONS[wb.w], own = p.guns.find(g => g.id === wb.w);
      return own ? { k: 'ammo', wb, txt: `Munición ${W.n} [${Math.floor(W.cost / 2)}]`, cost: Math.floor(W.cost / 2) }
        : { k: 'buy', wb, txt: `Comprar ${W.n} [${W.cost}]`, cost: W.cost };
    }
  }
  if (!G.power && dist2(p.x, p.y, SWITCH.x, SWITCH.y) < 22 * 22) return { k: 'switch', txt: 'Encender el letrero de neón' };
  // baúl misterioso
  const bx = BOX_LOCS[G.box.loc];
  if (G.roomOpen[bx.room] && dist2(p.x, p.y, bx.x, bx.y) < 20 * 20) {
    if (G.box.st === 'idle') return { k: 'box', txt: 'Baúl misterioso [950]', cost: 950 };
    if (G.box.st === 'ready' && G.box.owner === p.idx) return { k: 'boxTake', txt: 'Tomar ' + WEAPONS[G.box.gun].n };
  }
  // máquina de mejora
  if (dist2(p.x, p.y, PAP.x, PAP.y) < 22 * 22) {
    if (!G.power) return { k: 'none', txt: 'La máquina necesita luz' };
    const g = p.guns[p.cur];
    if (G.pap.st === 'idle') return g.up ? { k: 'none', txt: 'Esta arma ya está mejorada' } : { k: 'pap', txt: `Mejorar ${WEAPONS[g.id].n} [${PAP.cost}]`, cost: PAP.cost };
    if (G.pap.st === 'ready' && G.pap.owner === p.idx) return { k: 'papTake', txt: 'Tomar arma mejorada' };
  }
  // pociones
  for (const po of POTIONS) if (dist2(p.x, p.y, po.x, po.y) < 18 * 18) {
    if (!G.power) return { k: 'none', txt: 'Las pociones necesitan luz' };
    if (hasPot(p, po.id)) return { k: 'none', txt: 'Ya tienes ' + po.n };
    return { k: 'potion', po, txt: `${po.n} [${po.cost}]`, cost: po.cost };
  }
  for (const tr of TRAPS) if (dist2(p.x, p.y, tr.x, tr.y) < 14 * 14)
    return G.power ? { k: 'trap', tr, txt: tr.room === 3 ? 'Bajar por la trampilla' : 'Subir al escenario' } : { k: 'none', txt: 'La trampilla necesita luz' };
  for (const w of WINDOWS) if (w.boards < 6 && dist2(p.x, p.y, w.ix, w.iy) < 22 * 22) return { k: 'repair', w, txt: 'Mantén para reparar' };
  return null;
}
function action(p, pressed, dt) {
  const it = interactable(p); if (!it) return;
  if (it.k === 'revive') {          // con Jugo Ángel revives el doble de rápido
    it.o.revT += (dt || 0) * (hasPot(p, 'angel') ? 2 : 1); it.o.revBy = p.idx; it.o._rev = true;
    if (it.o.revT >= 3) { revive(it.o); addPts(p, 100); }
    return;
  }
  if (it.k === 'repair') {
    if (p.repT <= 0) { it.w.boards++; p.pts += 10; p.repT = .45; sfx('board'); }
    return;
  }
  if (!pressed) return;
  if (it.cost !== undefined && p.pts < it.cost) { sfx('no'); return; }
  if (it.k === 'door') {
    p.pts -= it.cost; it.d.open = true; sfx('buy');
    it.d.tiles.forEach(([x, y]) => setT(x, y, FLOOR, it.d.a));
    openRoom(it.d.a); openRoom(it.d.b);
  } else if (it.k === 'buy') {
    p.pts -= it.cost; sfx('buy'); giveGun(p, gun(it.wb.w));
  } else if (it.k === 'ammo') {
    const g = p.guns.find(g => g.id === it.wb.w), W = wstat(g);
    if (g.res >= W.res && g.ammo >= W.mag) { sfx('no'); return; }
    p.pts -= it.cost; g.res = W.res; sfx('buy');
  } else if (it.k === 'box') {
    p.pts -= it.cost; const b = G.box; b.st = 'spin'; b.t = 3; b.uses++; b.owner = p.idx; sfx('box');
  } else if (it.k === 'boxTake') {
    giveGun(p, gun(G.box.gun)); G.box.st = 'idle'; G.box.gun = null; sfx('buy');
  } else if (it.k === 'pap') {
    p.pts -= it.cost; G.pap = { st: 'work', t: 3.5, owner: p.idx, gid: p.guns[p.cur].id }; sfx('pap');
  } else if (it.k === 'papTake') {
    const g = p.guns.find(o => o.id === G.pap.gid);
    if (g) giveGun(p, gun(g.id, true)); else giveGun(p, gun(G.pap.gid, true));
    G.pap = { st: 'idle', t: 0, owner: null, gid: null }; sfx('buy'); flash('¡ARMA MEJORADA!');
  } else if (it.k === 'potion') {
    if (p.potions.length >= 4) { sfx('no'); return; }
    p.pts -= it.cost; p.potions.push(it.po.id); sfx('drink'); flash(it.po.n.toUpperCase() + ': ' + it.po.d);
    if (it.po.id === 'coraza') { p.maxHp = 250; p.hp = 250; }
  } else if (it.k === 'switch') {
    G.power = true; sfx('power'); G.banner = -2.5;
  } else if (it.k === 'trap' && p.trapT <= 0) {
    const to = TRAPS[it.tr.to]; p.x = to.x; p.y = to.y + 14; p.trapT = 1; p.tp++; sfx('trap'); openRoom(to.room);
  }
}
function updatePlayer(p, inp, dt) {
  if (p.dead || p.left || p.away) return;
  // invitado: su posición la manda su dispositivo (salvo justo después de un teletransporte)
  if (inp.pos && inp.tp === p.tp && !p.down) { p.x = inp.pos[0]; p.y = inp.pos[1]; p.mv = inp.mv; }
  if (p.down) {                     // en el suelo: solo apuntar y disparar
    p.cool -= dt; p.flash -= dt; p.aim = inp.aim;
    if (p.relT > 0) { p.relT -= dt; if (p.relT <= 0) { const g = p.guns[p.cur], W = wstat(g), n = Math.min(W.mag - g.ammo, g.res); g.ammo += n; g.res -= n; } }
    const W = wstat(p.guns[p.cur]);
    if (inp.fire && (W.auto || inp.firePressed)) shoot(p);
    if (inp.reload) reload(p);
    return;
  }
  p.cool -= dt; p.knifeT -= dt; p.knifeAnim -= dt; p.repT -= dt; p.trapT -= dt; p.flash -= dt; p.hurtT += dt;
  if (p.relT > 0) {
    p.relT -= dt;
    if (p.relT <= 0) { const g = p.guns[p.cur], W = wstat(g), n = Math.min(W.mag - g.ammo, g.res); g.ammo += n; g.res -= n; }
  }
  p.invT -= dt;
  if (p.hurtT > 3 && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + 60 * dt);
  if (!inp.pos) {
    const [vx, vy] = [inp.mx, inp.my];
    p.mv = !!(vx || vy);
    const spd = hasPot(p, 'veloz') ? 88 : 70;
    if (p.mv) move(p, vx * spd, vy * spd, dt, pSolid, 4);
  }
  p.aim = inp.aim;
  // recoger premios
  for (const d of G.drops) if (!d.taken && Math.hypot(d.x - p.x, d.y - p.y) < 12) { d.taken = true; takeDrop(d.k, p); }
  const W = wstat(p.guns[p.cur]);
  if (inp.fire && (W.auto || inp.firePressed)) shoot(p);
  if (inp.reload) reload(p);
  if (inp.knife) knife(p);
  if (inp.swap) swap(p);
  if (inp.act) action(p, inp.actPressed, dt);
}

/* ============================ ENTRADA ============================ */
const keys = {}, pressed = {};
let mouseX = 0, mouseY = 0, mouseDown = false, mousePressed = false, usingMouse = true;
addEventListener('keydown', e => { if (!keys[e.code]) pressed[e.code] = true; keys[e.code] = true; if (phase === 'play' && /Arrow|Space/.test(e.code)) e.preventDefault(); });
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouseDown = false; });
const cv = document.getElementById('game');
// solo un ratón de verdad apunta/dispara con el cursor; los toques en la pantalla no cuentan como ratón
cv.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; mouseX = e.clientX; mouseY = e.clientY; usingMouse = true; });
cv.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button !== 0) return; mouseX = e.clientX; mouseY = e.clientY; usingMouse = true; mouseDown = true; mousePressed = true; ensureAudio(); });
addEventListener('pointerup', e => { if (e.pointerType === 'mouse' && e.button === 0) mouseDown = false; });
if (isTouchDevice()) usingMouse = false;
function isTouchDevice() { return matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window; }
cv.addEventListener('wheel', e => { pressed.KeyQ = true; e.preventDefault(); }, { passive: false });
addEventListener('contextmenu', e => e.preventDefault());

const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
let usingPad = false;
addEventListener('gamepadconnected', () => {
  usingPad = true; padToast = 3;
  if (phase === 'play') show(null);   // ocultar botones táctiles si conectan un control
});
let padToast = 0;
function joystick(el, onMove, onState) {
  const k = el.querySelector('.k'); let id = null, cx = 0, cy = 0, t0 = 0, maxD = 0;
  const mv = e => {
    let dx = e.clientX - cx, dy = e.clientY - cy; const R = 48, d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    maxD = Math.max(maxD, Math.min(1, d / R));
    k.style.transform = `translate(${dx}px,${dy}px)`; onMove(dx / R, dy / R);
  };
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); ensureAudio();
    if (id !== null) return;           // otro dedo no le roba la palanca al que ya la usa
    id = e.pointerId; try { el.setPointerCapture(id); } catch (er) { }
    t0 = performance.now(); maxD = 0;
    const r = el.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; mv(e);
    onState && onState(true, false, t0);
  });
  el.addEventListener('pointermove', e => { if (e.pointerId === id) mv(e); });
  const end = e => {
    if (e.pointerId !== id) return;
    id = null; k.style.transform = ''; onMove(0, 0);
    // toque rápido sin arrastrar = "clic" en la palanca
    onState && onState(false, performance.now() - t0 < 300 && maxD < .3, t0);
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); el.addEventListener('lostpointercapture', end);
}
let jL = [0, 0], jR = [0, 0], tbtn = {}, tpress = {};
joystick(document.getElementById('joyL'), (x, y) => { jL = [x, y]; });
// palanca de disparo: tocarla (sin arrastrar) dispara al zombie más cercano; mantenerla en el centro sigue disparándole
let jRdown = false, jRt0 = 0, tapFire = false;
joystick(document.getElementById('joyR'), (x, y) => { jR = [x, y]; usingMouse = false; },
  (down, tap, t0) => { jRdown = down; jRt0 = t0; if (tap) tapFire = true; });
function nearestTarget(p) {
  let best = null, bd = 220 * 220;
  for (const z of G.zombies) {
    if (z.dead) continue; const d = dist2(p.x, p.y, z.x, z.y);
    if (d < bd && sees(p.x, p.y - 1, z.x, z.y)) { bd = d; best = z; }
  }
  return best;
}
[['tAct', 'act'], ['tRel', 'reload'], ['tKnife', 'knife'], ['tSwap', 'swap']].forEach(([id, k]) => {
  const el = document.getElementById(id);
  el.addEventListener('pointerdown', e => { e.preventDefault(); ensureAudio(); el.setPointerCapture(e.pointerId); tbtn[k] = true; tpress[k] = true; el.classList.add('on'); });
  const up = () => { tbtn[k] = false; el.classList.remove('on'); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
});

let lastStickAim = 0, lastStickT = -1e9;
// ---- control (Xbox / PlayStation / genérico, mapeo estándar) ----
// Palanca izq: mover · Palanca der: apuntar · RT/R2: disparar · A/✕: acción · X/□: recargar
// B/○ o RB/R1: cuchillo · Y/△: cambiar arma · Start: jugar
const GP_PREV = {};
function readPad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of pads) {
    if (!gp || !gp.connected) continue;
    const b = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > .4));
    const edge = i => { const now = b(i), was = GP_PREV[i]; GP_PREV[i] = now; return now && !was; };
    const dz = v => Math.abs(v) < .2 ? 0 : v;
    return {
      lx: dz(gp.axes[0] || 0), ly: dz(gp.axes[1] || 0), rx: dz(gp.axes[2] || 0), ry: dz(gp.axes[3] || 0),
      fire: b(7), fireEdge: edge(7), act: b(0), actEdge: edge(0), reload: edge(2),
      knife: edge(1) | edge(5), swap: edge(3), start: edge(9), map: edge(8),
    };
  }
  return null;
}
function aimAssist(p, aim) {
  let best = .3;
  for (const z of G.zombies) {
    const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy); if (d > 150) continue;
    let da = Math.abs(Math.atan2(dy, dx) - aim); if (da > Math.PI) da = 2 * Math.PI - da;
    if (da < best) { best = da; aim = Math.atan2(dy, dx); }
  }
  return aim;
}
function readInput(p) {
  const pad = readPad();
  if (pad) usingPad = true;
  let mx = 0, my = 0;
  if (pad) { mx += pad.lx; my += pad.ly; }
  if (keys.KeyA || keys.ArrowLeft) mx--; if (keys.KeyD || keys.ArrowRight) mx++;
  if (keys.KeyW || keys.ArrowUp) my--; if (keys.KeyS || keys.ArrowDown) my++;
  mx += jL[0]; my += jL[1];
  const m = Math.hypot(mx, my); if (m > 1) { mx /= m; my /= m; } if (m < .2) { mx = my = 0; }
  let aim = p.aim, fire = false, firePressed = false;
  const rm = Math.hypot(jR[0], jR[1]);
  if (pad && (pad.rx || pad.ry || pad.fire)) {
    // control: la palanca derecha apunta (con ayuda de puntería), el gatillo dispara
    if (pad.rx || pad.ry) aim = aimAssist(p, Math.atan2(pad.ry, pad.rx));
    else if (mx || my) aim = aimAssist(p, Math.atan2(my, mx));
    fire = pad.fire; firePressed = pad.fireEdge; usingMouse = false;
  } else if (tapFire || (jRdown && rm <= .25 && performance.now() - jRt0 > 200)) {
    // teléfono: clic en la palanca de disparo = tiro al zombie visible más cercano
    const z = nearestTarget(p);
    if (z) { aim = Math.atan2(z.y - (p.y - 1), z.x - p.x); fire = firePressed = true; }
    else if (tapFire) { fire = firePressed = true; }       // sin zombies a la vista: dispara hacia donde mira
    lastStickAim = aim; lastStickT = performance.now();
    tapFire = false;
  } else if (rm > .25) {
    // teléfono: ayuda de puntería si hay un zombie cerca de la dirección
    aim = aimAssist(p, Math.atan2(jR[1], jR[0]));
    // a fondo dispara; con la palanca todas las armas siguen disparando a su ritmo mientras la mantengas
    fire = rm > .55; firePressed = fire;
    lastStickAim = aim; lastStickT = performance.now();
  } else {
    if (usingMouse) {
      const r = cv.getBoundingClientRect(), sc = r.width / VW;
      const wx = (mouseX - r.left) / sc + cam.x, wy = (mouseY - r.top) / sc + cam.y;
      aim = Math.atan2(wy - (p.y - 1), wx - p.x);
      fire = mouseDown; firePressed = mousePressed;
    }
    // recién soltaste la palanca de apuntar: la mira se queda donde estaba (no salta a donde caminas)
    else if (performance.now() - lastStickT < 1500) aim = lastStickAim;
    else if (mx || my) aim = Math.atan2(my, mx);
    if (keys.Space) { fire = true; firePressed = firePressed || pressed.Space; }
  }
  // mapa: M / Back. Con el mapa abierto, las teclas eligen ruta y no disparan ni compran
  const wasOpen = mapOpen;
  if (pressed.KeyM || (pad && pad.map)) toggleMap();
  if (wasOpen && mapOpen) {
    if (pressed.KeyB || (pad && pad.actEdge)) setRoute('box');
    else if (pressed.KeyP || (pad && pad.reload)) setRoute('potion');
    else if (pressed.KeyG || (pad && pad.swap)) setRoute('pap');
    else if (pressed.Escape || (pad && pad.knife)) closeMap();
  }
  if (wasOpen) {
    for (const k in pressed) pressed[k] = false; for (const k in tpress) tpress[k] = false; mousePressed = false;
    return { mx, my, aim, fire: false, firePressed: false };
  }
  const inp = {
    mx, my, aim, fire, firePressed,
    reload: pressed.KeyR || tpress.reload || (pad && pad.reload), knife: pressed.KeyF || pressed.KeyV || tpress.knife || (pad && pad.knife),
    swap: pressed.KeyQ || pressed.Digit1 || pressed.Digit2 || tpress.swap || (pad && pad.swap),
    act: keys.KeyE || tbtn.act || (pad && pad.act), actPressed: pressed.KeyE || tpress.act || (pad && pad.actEdge),
  };
  for (const k in pressed) pressed[k] = false; for (const k in tpress) tpress[k] = false; mousePressed = false;
  return inp;
}

/* ============================ DIBUJO ============================ */
let ctx = cv.getContext('2d'), S = 1;
const cam = { x: 0, y: 0 };
const dark = document.createElement('canvas'); dark.width = VW; dark.height = VH; const dctx = dark.getContext('2d');
const r = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
const hash = (x, y) => { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; };
function drawFloor(style, x, y, X, Y) {
  const h = hash(x, y);
  switch (style) {
    case 'carpet': r(X, Y, 16, 16, '#6e1a26'); if ((x + y) % 2 === 0) { r(X + 7, Y + 7, 2, 2, '#b8873a'); } r(X, Y, 16, 1, '#5e1520'); break;
    case 'checker': r(X, Y, 16, 16, (x + y) % 2 ? '#d8ccb0' : '#3a3040'); break;
    case 'carpetDark': r(X, Y, 16, 16, '#43121c'); if (h < .3) r(X + (h * 40 | 0) % 14, Y + 5, 2, 1, '#55182a'); break;
    case 'wood': r(X, Y, 16, 16, '#8a5a32'); r(X, Y + 3, 16, 1, '#6b4424'); r(X, Y + 7, 16, 1, '#6b4424'); r(X, Y + 11, 16, 1, '#6b4424'); r(X, Y + 15, 16, 1, '#6b4424'); r(X + ((x * 5) % 16), Y, 1, 4, '#6b4424'); break;
    case 'asphalt': r(X, Y, 16, 16, '#34343b'); if (h < .5) r(X + (h * 30 | 0) % 15, Y + (h * 70 | 0) % 15, 1, 1, '#4a4a52'); if (h > .9) r(X + 2, Y + 9, 6, 1, '#2a2a30'); break;
    case 'purple': r(X, Y, 16, 16, '#3e2650'); if ((x + y) % 3 === 0) r(X + 4, Y + 4, 8, 8, '#45295a'); break;
    case 'gravel': r(X, Y, 16, 16, '#55505c'); for (let k = 0; k < 4; k++) { const q = hash(x * 4 + k, y); r(X + (q * 15 | 0), Y + (q * 97 | 0) % 15, 1, 1, '#6e6878'); } break;
    case 'concrete': r(X, Y, 16, 16, '#48483f'); if (h < .15) r(X + 3, Y + 6, 7, 1, '#3a3a33'); r(X, Y, 1, 16, '#42423a'); break;
    default: r(X, Y, 16, 16, '#5a4030');
  }
}
function floorStyleAt(x, y) {
  const rm = roomAt[idx(x, y)]; return rm >= 0 ? ROOMS[rm].fl : 'wood';
}
function isWallFace(x, y) { const b = T(x, y + 1); return b === FLOOR || b === SEAT; }
function nearFloor(x, y) { for (const [dx, dy] of N8) { const t = T(x + dx, y + dy); if (t === FLOOR || t === SEAT || t === DOOR || t === WIN) return true; } return false; }
function drawTile(x, y, X, Y) {
  const t = T(x, y);
  if (t === FLOOR) { drawFloor(floorStyleAt(x, y), x, y, X, Y); return; }
  if (t === SEAT) { drawFloor('carpetDark', x, y, X, Y); r(X + 1, Y + 2, 14, 5, '#a8243a'); r(X + 1, Y + 7, 14, 6, '#7a1a2a'); r(X + 1, Y + 2, 14, 1, '#c8405a'); r(X, Y + 3, 1, 10, '#2a0c12'); r(X + 15, Y + 3, 1, 10, '#2a0c12'); return; }
  if (t === OUT) { r(X, Y, 16, 16, '#15110e'); const h = hash(x, y); if (h < .4) r(X + (h * 37 | 0) % 15, Y + 12, 1, 3, '#2a3a1e'); return; }
  if (t === DOOR) {
    const d = DOORS[doorAt[idx(x, y)]];
    r(X, Y, 16, 16, '#5a3820');
    if (d.vertical) { for (let k = 0; k < 16; k += 4) r(X + k, Y, 1, 16, '#3e2614'); } else { for (let k = 0; k < 16; k += 4) r(X, Y + k, 16, 1, '#3e2614'); }
    r(X, Y + 7, 16, 2, '#7d7d88'); r(X + 7, Y, 2, 16, '#7d7d88');
    return;
  }
  if (t === WIN) {
    const w = WINDOWS[winAt[idx(x, y)]];
    r(X, Y, 16, 16, '#2a1d24'); r(X + 2, Y + 2, 12, 12, '#0c080c');
    for (let b = 0; b < w.boards; b++) {
      if (w.vertical) r(X + 2 + b * 2, Y + 1, 2, 14, b % 2 ? '#9a6a3a' : '#b07a46');
      else r(X + 1, Y + 2 + b * 2, 14, 2, b % 2 ? '#9a6a3a' : '#b07a46');
    }
    return;
  }
  // pared o vacío
  if (!nearFloor(x, y)) { r(X, Y, 16, 16, '#0b0810'); return; }
  if (isWallFace(x, y)) {
    r(X, Y, 16, 16, '#3a2630'); r(X, Y, 16, 5, '#22161c');
    for (let row = 5; row < 16; row += 4) { r(X, Y + row, 16, 1, '#2a1a22'); const off = (row / 4 | 0) % 2 ? 0 : 8; r(X + off, Y + row, 1, 4, '#2a1a22'); }
  } else r(X, Y, 16, 16, '#22161c');
}
function drawWallBuy(wb) {
  const X = wb.x - 8, Y = wb.y - 8;
  ctx.globalAlpha = .9; r(X + 2, Y + 8, 12, 1, '#e8e0d0'); r(X + 3, Y + 9, 3, 3, '#e8e0d0');
  if (wb.w === 'escopeta' || wb.w === 'rifle' || wb.w === 'ametra') r(X + 10, Y + 9, 4, 2, '#e8e0d0');
  if (wb.w === 'subfusil') r(X + 8, Y + 9, 2, 4, '#e8e0d0');
  ctx.globalAlpha = 1;
}
function drawGunInHand(p, X, Y) {
  const cs = Math.cos(p.aim), sn = Math.sin(p.aim), len = p.guns[p.cur].id === 'pistola' ? 5 : 8;
  const g = p.guns[p.cur];
  ctx.strokeStyle = g.up ? '#c77dff' : g.id === 'hielo' ? '#8fe8ff' : g.id === 'confeti' ? '#ff7eb6' : '#1a1a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + cs * len, Y + sn * len); ctx.stroke();
  if (p.flash > 0) r(Math.round(X + cs * (len + 2)) - 1, Math.round(Y + sn * (len + 2)) - 1, 3, 3, '#ffe08a');
  if (p.knifeAnim > 0) r(Math.round(X + cs * 10) - 1, Math.round(Y + sn * 10) - 1, 3, 3, '#e0e6f0');
}
function drawBoxEtc() {
  const now = performance.now(), blink = Math.floor(now / 300) % 2;
  // baúl misterioso (baúl de mago)
  const b = G.box, L = BOX_LOCS[b.loc];
  if (b.st !== 'gone') {
    const X = L.x - 10, Y = L.y - 6, open = b.st === 'spin' || b.st === 'ready';
    r(X, Y + 2, 20, 10, '#3a1850'); r(X, Y + 2, 20, 1, '#ffc93c'); r(X, Y + 11, 20, 1, '#ffc93c'); r(X + 9, Y + 5, 2, 3, '#ffc93c');
    if (open) { r(X, Y - 4, 20, 4, '#4a2260'); r(X, Y - 4, 20, 1, '#ffc93c'); r(X + 2, Y, 16, 2, '#fff2b3'); }
    else { r(X, Y, 20, 3, '#4a2260'); r(X, Y, 20, 1, '#ffc93c'); }
    if (!open && blink) text('?', L.x, Y - 9, '#b78cff', 6, 'center');
    // luz que sale del baúl
    if (open) { ctx.globalAlpha = .35; r(L.x - 4, Y - 40, 8, 38, '#b78cff'); ctx.globalAlpha = 1; }
    if (b.st === 'spin') text(b.show, L.x, Y - 18, '#f4e6d0', 6, 'center');
    if (b.st === 'ready') text(WEAPONS[b.gun].n, L.x, Y - 18 - (blink ? 1 : 0), '#ffc93c', 6, 'center');
  } else {
    r(L.x - 10, L.y - 4, 20, 10, 'rgba(58,24,80,.35)');
  }
  // máquina de mejora (humo dorado)
  {
    const X = PAP.x - 9, Y = PAP.y - 14;
    r(X, Y, 18, 22, '#1a1410'); r(X + 1, Y + 1, 16, 20, G.power ? '#b8860b' : '#4a3a20'); r(X + 3, Y + 4, 12, 8, '#1a1410');
    r(X + 3, Y + 15, 12, 2, '#1a1410');
    if (G.power) {
      r(X + 4, Y + 5, 10, 6, G.pap.st === 'work' && blink ? '#fff2b3' : '#ffd84a');
      if (G.pap.st === 'work') for (let i = 0; i < 3; i++) { const s = (now / 200 + i * 2) % 6; ctx.globalAlpha = .4; r(X + 4 + i * 4, Y - 2 - s * 2, 3, 3, '#ffe9a0'); ctx.globalAlpha = 1; }
      if (G.pap.st === 'ready') text('LISTA', PAP.x, Y - 9, '#ffc93c', 6, 'center');
    }
  }
  // pociones (máquinas de dulcería)
  for (const po of POTIONS) {
    const X = po.x - 6, Y = po.y - 12;
    r(X, Y, 12, 16, '#1a1018'); r(X + 1, Y + 1, 10, 14, G.power ? po.c : '#4a3a40');
    r(X + 3, Y + 3, 6, 5, '#1a1018'); if (G.power) r(X + 4, Y + 4, 4, 3, blink ? '#fff' : '#f4e6d0');
    r(X + 3, Y + 11, 6, 2, '#1a1018');
  }
  // premios en el suelo
  for (const d of G.drops) {
    if (d.l < 5 && blink) continue;
    const D = DROPS[d.k], bob = Math.sin(now / 200) * 2;
    ctx.globalAlpha = .35; r(d.x - 8, d.y - 8 + bob, 16, 16, D.c); ctx.globalAlpha = 1;
    r(d.x - 5, d.y - 5 + bob, 10, 10, '#1a1018'); text(D.l, d.x + 1, d.y - 3 + bob, D.c, 6, 'center');
  }
}
function text(s, x, y, c, size = 8, align = 'left') {
  ctx.font = size + "px 'Press Start 2P', monospace"; ctx.textAlign = align; ctx.textBaseline = 'top';
  ctx.fillStyle = '#000'; ctx.fillText(s, x + 1, y + 1); ctx.fillStyle = c; ctx.fillText(s, x, y);
}
// ---- línea guía hacia un compañero caído ----
// Se calcula UNA vez (cuando cae), desde donde estabas tú; no se recalcula al moverte.
// Cada quien ve solo su propia línea (se dibuja en su pantalla, no viaja por la red).
const GUIDES = {};
function guidePath(sx, sy, tx, ty) {
  const s = idx(Math.floor(sx / TS), Math.floor(sy / TS)), t = idx(Math.floor(tx / TS), Math.floor(ty / TS));
  const prev = new Int32Array(MW * MH).fill(-1), q = [s]; prev[s] = s;
  for (let h = 0; h < q.length && prev[t] < 0; h++) {
    const c = q[h], cx = c % MW, cy = (c / MW) | 0;
    for (const [dx, dy] of N4) {
      const nx = cx + dx, ny = cy + dy, j = idx(nx, ny);
      if (!inb(nx, ny) || prev[j] >= 0 || tiles[j] !== FLOOR) continue;
      prev[j] = c; q.push(j);
    }
  }
  if (prev[t] < 0) return [[sx, sy], [tx, ty]];          // sin camino caminable (p. ej. por la trampilla): línea recta
  const pts = [];
  for (let c = t; ; c = prev[c]) { pts.push([(c % MW) * TS + 8, ((c / MW) | 0) * TS + 8]); if (c === s) break; }
  pts.reverse(); pts[0] = [sx, sy]; pts[pts.length - 1] = [tx, ty];
  // quitar puntos en línea recta para que el trazo sea limpio
  return pts.filter((p, i) => i === 0 || i === pts.length - 1 || (pts[i - 1][0] - p[0]) * (pts[i + 1][1] - p[1]) !== (pts[i - 1][1] - p[1]) * (pts[i + 1][0] - p[0]));
}
function drawGuides(me) {
  G.players.forEach((o, i) => {
    const need = o !== me && o.down && !o.dead && alive(me);
    if (!need) { delete GUIDES[i]; return; }
    if (!GUIDES[i]) GUIDES[i] = guidePath(me.x, me.y, o.x, o.y);
    const pts = GUIDES[i];
    const path = () => { ctx.beginPath(); pts.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };
    ctx.save(); ctx.globalAlpha = .8; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.setLineDash([]); path(); ctx.globalAlpha = .35; ctx.stroke();
    ctx.globalAlpha = .85; ctx.strokeStyle = '#ffc93c'; ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]); ctx.lineDashOffset = -performance.now() / 60;   // puntos que avanzan hacia el caído
    path(); ctx.stroke();
    ctx.restore();
  });
}
/* ============================ MAPA Y RUTAS ============================ */
// Cada jugador abre su propio mapa y elige una ruta (al baúl, a la poción más cercana o a la máquina dorada).
// La ruta se calcula una vez y se dibuja como línea azul en el piso; desaparece al llegar.
let mapOpen = false, ROUTE = null, routeMsgText = '', routeMsgUntil = 0;
function routeMsg(t) { routeMsgText = t; routeMsgUntil = performance.now() + 4500; }
function bfsFrom(sx, sy) {        // camino por el piso; las puertas cerradas cuentan (para decirte cuál abrir)
  const prev = new Int32Array(MW * MH).fill(-1), s = idx(Math.floor(sx / TS), Math.floor(sy / TS)), q = [s]; prev[s] = s;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], cx = c % MW, cy = (c / MW) | 0;
    for (const [dx, dy] of N4) {
      const nx = cx + dx, ny = cy + dy, j = idx(nx, ny);
      if (!inb(nx, ny) || prev[j] >= 0 || (tiles[j] !== FLOOR && tiles[j] !== DOOR)) continue;
      prev[j] = c; q.push(j);
    }
  }
  return { prev, s };
}
function pathLen(B, j) { let n = 0; for (let c = j; c !== B.s; c = B.prev[c]) n++; return n; }
function setRoute(kind) {
  const me = G && G.players[myIdx]; if (!me || !alive(me)) return;
  let targets = [];
  if (kind === 'box') {
    if (G.box.st === 'gone') { routeMsg('El baúl se está mudando… prueba en unos segundos'); return; }
    const L = BOX_LOCS[G.box.loc]; targets = [{ x: L.x, y: L.y, n: 'Baúl misterioso' }];
  } else if (kind === 'potion') {
    targets = POTIONS.filter(po => !hasPot(me, po.id)).map(po => ({ x: po.x, y: po.y, n: po.n + ' [' + po.cost + ']', luz: true }));
    if (!targets.length) { routeMsg('Ya tienes todas las pociones'); return; }
  } else if (kind === 'pap') targets = [{ x: PAP.x, y: PAP.y, n: 'Máquina dorada [5000]', luz: true }];
  const B = bfsFrom(me.x, me.y);
  let best = null, bd = 1e9, bj = -1;
  for (const t of targets) {      // casilla de piso alcanzable junto al objetivo
    const cx = Math.floor(t.x / TS), cy = Math.floor(t.y / TS);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const j = idx(cx + dx, cy + dy); if (B.prev[j] < 0) continue;
      const d = pathLen(B, j); if (d < bd) { bd = d; best = t; bj = j; }
    }
  }
  if (!best) { best = targets[0]; ROUTE = { pts: [[me.x, me.y], [best.x, best.y]], x: best.x, y: best.y }; routeMsg('Ruta: ' + best.n); closeMap(); return; }
  const cells = []; for (let c = bj; ; c = B.prev[c]) { cells.push(c); if (c === B.s) break; }
  cells.reverse();
  const doors = [...new Set(cells.filter(c => tiles[c] === DOOR).map(c => doorAt[c]))].map(id => DOORS[id].cost);
  let pts = cells.map(c => [(c % MW) * TS + 8, ((c / MW) | 0) * TS + 8]);
  pts[0] = [me.x, me.y]; pts.push([best.x, best.y]);
  pts = pts.filter((p, i) => i === 0 || i === pts.length - 1 || (pts[i - 1][0] - p[0]) * (pts[i + 1][1] - p[1]) !== (pts[i - 1][1] - p[1]) * (pts[i + 1][0] - p[0]));
  ROUTE = { pts, x: best.x, y: best.y };
  routeMsg('Ruta: ' + best.n + (doors.length ? ' · abre puerta ' + doors.join(' + ') : '') + (best.luz && !G.power ? ' · necesita la luz (azotea)' : ''));
  closeMap();
}
function drawRoute(me) {
  if (!ROUTE) return;
  if (!alive(me) || Math.hypot(me.x - ROUTE.x, me.y - ROUTE.y) < 26) { if (alive(me)) routeMsg('¡Llegaste!'); ROUTE = null; return; }
  const path = () => { ctx.beginPath(); ROUTE.pts.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };
  ctx.save(); ctx.lineJoin = 'round';
  ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.globalAlpha = .35; path(); ctx.stroke();
  ctx.globalAlpha = .85; ctx.strokeStyle = '#5bd8ff'; ctx.lineWidth = 2; ctx.setLineDash([2, 5]); ctx.lineDashOffset = -performance.now() / 50; path(); ctx.stroke();
  ctx.restore();
  const t = ROUTE, b = Math.floor(performance.now() / 300) % 2;     // marca en el destino
  r(t.x - 4, t.y - 14 - b, 8, 2, '#5bd8ff'); r(t.x - 1, t.y - 12 - b, 2, 3, '#5bd8ff');
}
const MAPFL = { carpet: '#7a2030', checker: '#8a8070', carpetDark: '#4d1822', wood: '#8a5a32', asphalt: '#4a4a52', purple: '#4e3060', gravel: '#6a6470', concrete: '#5a5a50' };
function drawMap(me) {
  r(0, 0, VW, VH, 'rgba(8,4,8,.88)');
  const k = (VH - 14) / (MH * TS), ox = 60, oy = 7, s = TS * k;
  const P = (x, y) => [ox + x * k, oy + y * k];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = T(x, y); let c = null;
    if (t === FLOOR) { const rm = roomAt[idx(x, y)]; c = rm >= 0 ? MAPFL[ROOMS[rm].fl] : '#5a4030'; ctx.globalAlpha = rm >= 0 && !G.roomOpen[rm] ? .35 : 1; }
    else if (t === SEAT) { c = '#2a0c12'; ctx.globalAlpha = G.roomOpen[2] ? 1 : .35; }
    else if (t === DOOR) { c = '#ffc93c'; ctx.globalAlpha = 1; }
    else if (t === WIN) { c = '#b07a46'; ctx.globalAlpha = 1; }
    if (c) { ctx.fillStyle = c; ctx.fillRect(ox + x * s, oy + y * s, s + .3, s + .3); }
  }
  ctx.globalAlpha = 1;
  const dot = (x, y, c, n = 3) => { const [X, Y] = P(x, y); r(Math.round(X - n / 2), Math.round(Y - n / 2), n, n, c); };
  const blink = Math.floor(performance.now() / 300) % 2;
  if (G.box.st !== 'gone') { const L = BOX_LOCS[G.box.loc]; dot(L.x, L.y, '#000', 6); dot(L.x, L.y, '#b78cff', 4); }
  POTIONS.forEach(po => { dot(po.x, po.y, '#000', 5); dot(po.x, po.y, po.c, 3); });
  dot(PAP.x, PAP.y, '#000', 6); dot(PAP.x, PAP.y, '#ffd84a', 4);
  if (!G.power) dot(SWITCH.x, SWITCH.y, blink ? '#4caf3a' : '#1a1418', 4);
  TRAPS.forEach(tr => dot(tr.x, tr.y, '#8a5a32', 3));
  if (ROUTE) { ctx.save(); ctx.strokeStyle = '#5bd8ff'; ctx.lineWidth = 1; ctx.beginPath(); ROUTE.pts.forEach(([x, y], i) => { const [X, Y] = P(x, y); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); ctx.restore(); }
  G.players.forEach(o => { if (o.dead) return; dot(o.x, o.y, '#000', 5); dot(o.x, o.y, o.down ? '#ff4040' : CHARS[o.ch].c, 3); });
  if (blink) dot(me.x, me.y, '#fff', 5), dot(me.x, me.y, CHARS[me.ch].c, 3);
  // leyenda
  const lx = 4; let ly = 8;
  text('MAPA', lx, ly, '#d8283a', 8); ly += 14;
  [['Tú', CHARS[me.ch].c], ['Baúl', '#b78cff'], ['Pociones', '#e8443a'], ['Máquina', '#ffd84a'], ['Puerta', '#ffc93c'], ['Luz', '#4caf3a']].forEach(([n, c]) => { r(lx, ly + 1, 4, 4, c); text(n, lx + 7, ly, '#f4e6d0', 6); ly += 9; });
  if (!isTouch) (usingPad ? ['A baúl', 'X poción', 'Y máquina'] : ['B baúl', 'P poción', 'G máquina']).forEach((t, i) => text(t, lx, VH - 32 + i * 9, '#a88', 6));
}
function openMap() { if (phase !== 'play' || !G) return; mapOpen = true; syncMapUI(); }
function closeMap() { mapOpen = false; syncMapUI(); }
function toggleMap() { mapOpen ? closeMap() : openMap(); }
function syncMapUI() { const el = document.getElementById('mapUI'); if (el) el.classList.toggle('hidden', !mapOpen); }

function render() {
  ctx.setTransform(S, 0, 0, S, 0, 0); ctx.imageSmoothingEnabled = false;
  r(0, 0, VW, VH, '#0b0810');
  if (!G) return;
  const me = G.players[myIdx] || G.players[0];
  // si te desangraste, la cámara sigue a un compañero vivo
  const camP = me.dead || me.left ? (G.players.find(alive) || me) : me;
  cam.x = Math.round(Math.max(0, Math.min(MW * TS - VW, camP.x - VW / 2)));
  cam.y = Math.round(Math.max(0, Math.min(MH * TS - VH, camP.y - VH / 2)));
  ctx.save(); ctx.translate(-cam.x, -cam.y);
  const x0 = Math.floor(cam.x / TS), y0 = Math.floor(cam.y / TS);
  for (let y = y0; y <= y0 + VH / TS + 1; y++) for (let x = x0; x <= x0 + VW / TS + 1; x++) drawTile(x, y, x * TS, y * TS);
  // manchas de sangre
  for (const b of G.blood) { r(Math.round(b.x - b.s / 2), Math.round(b.y - b.s / 3), Math.round(b.s), Math.round(b.s * .6), '#5a0a12'); }
  // objetos
  WALLBUYS.forEach(drawWallBuy);
  r(SWITCH.x - 5, SWITCH.y - 7, 10, 12, '#55606a'); r(SWITCH.x - 4, SWITCH.y - 6, 8, 10, '#2a3036');
  r(SWITCH.x - 1, G.power ? SWITCH.y - 6 : SWITCH.y - 1, 2, 5, G.power ? '#4caf3a' : '#e8443a');
  for (const tr of TRAPS) {
    r(tr.x - 7, tr.y - 7, 14, 14, '#2a1c10'); r(tr.x - 6, tr.y - 6, 12, 12, '#4a3220'); r(tr.x - 6, tr.y - 1, 12, 1, '#2a1c10');
    if (G.power && Math.floor(performance.now() / 400) % 2) { r(tr.x - 7, tr.y - 7, 14, 1, '#ffc93c'); r(tr.x - 7, tr.y + 6, 14, 1, '#ffc93c'); }
  }
  // letrero de neón en la azotea
  {
    const nx = (4 + MX) * TS, ny = (2 + MY) * TS, on = G.power && Math.floor(performance.now() / 700) % 6 !== 0;
    r(nx, ny, 112, 18, '#1a0e14'); text('CINE', nx + 8, ny + 5, on ? '#ff3c7a' : '#4a2a36', 8);
    text('ROYAL', nx + 50, ny + 5, on ? '#3cf0ff' : '#2a3a46', 8);
  }
  drawBoxEtc();
  // precios de puertas
  for (const d of DOORS) if (!d.open) { r(d.x - 13, d.y - 5, 26, 10, 'rgba(0,0,0,.7)'); text(String(d.cost), d.x, d.y - 3, '#ffc93c', 6, 'center'); }
  // entidades ordenadas por y
  const ents = [];
  G.zombies.forEach(z => ents.push([z.y, 'z', z]));
  G.players.forEach((p, i) => { if (!p.dead) ents.push([p.y, 'p', p, i]); });
  G.fx.forEach(f => { if (f.k === 'corpse') ents.push([f.y - 1, 'c', f]); });
  ents.sort((a, b) => a[0] - b[0]);
  for (const [, k, e] of ents) {
    if (k === 'z') {
      const bob = Math.floor(e.anim * 6) % 2, X = Math.round(e.x), Y = Math.round(e.y);
      r(X - 5, Y + 5, 10, 2, 'rgba(0,0,0,.35)');
      const spr = e.flash > 0 ? SP.zombieW : e.gold ? SP.zombieG : SP.zombie;
      ctx.save(); if (e.face < 0) { ctx.translate(X, 0); ctx.scale(-1, 1); ctx.drawImage(spr, -6, Y - 8 - bob); } else ctx.drawImage(spr, X - 6, Y - 8 - bob); ctx.restore();
      if (e.gold) { const t = performance.now() / 150 + e.id; for (let i = 0; i < 3; i++) { const an = t + i * 2.1; r(Math.round(X + Math.cos(an) * 8), Math.round(Y - 4 + Math.sin(an) * 7), 1, 1, '#fff2b3'); } }
    } else if (k === 'c') {
      ctx.globalAlpha = Math.max(0, e.l / .6); ctx.drawImage(SP.zombie, Math.round(e.x) - 6, Math.round(e.y) - 4, 12, 9); ctx.globalAlpha = 1;
    } else {
      const X = Math.round(e.x), Y = Math.round(e.y), bob = e.mv ? Math.floor(performance.now() / 110) % 2 : 0;
      r(X - 5, Y + 5, 10, 2, 'rgba(0,0,0,.35)');
      const flip = Math.cos(e.aim) < 0, spr = SP['p' + e.ch];
      const ghost = e.left || e.away;
      if (e.down || ghost) { ctx.globalAlpha = ghost ? .35 : .5; }
      ctx.save(); if (flip) { ctx.translate(X, 0); ctx.scale(-1, 1); ctx.drawImage(spr, -6, Y - 8 - bob); } else ctx.drawImage(spr, X - 6, Y - 8 - bob); ctx.restore();
      ctx.globalAlpha = 1;
      if (!e.down) drawGunInHand(e, X, Y - 1 - bob);
      text(e.name, X, Y - 17, CHARS[e.ch].c, 6, 'center');
      if (ghost) text('RECONECTANDO…', X, Y - 25, '#8fd0ff', 6, 'center');
      if (e.down) {   // barra: verde = lo están reviviendo, roja = tiempo antes de desangrarse
        r(X - 9, Y - 23, 18, 3, '#000');
        if (e.revT > 0) r(X - 8, Y - 22, Math.round(16 * Math.min(1, e.revT / 3)), 1, '#4caf3a');
        else r(X - 8, Y - 22, Math.round(16 * Math.max(0, e.bleed / 30)), 1, '#e8443a');
        if (Math.floor(performance.now() / 400) % 2) text('¡AYUDA!', X, Y - 31, '#ff6b6b', 6, 'center');
      }
    }
  }
  // trazos de bala y partículas
  ctx.lineWidth = 1;
  for (const t of G.tracers) { ctx.strokeStyle = t.c || 'rgba(255,224,138,.8)'; ctx.lineWidth = t.c === '#8fe8ff' || t.c === '#c77dff' ? 2 : 1; ctx.beginPath(); ctx.moveTo(t.x1, t.y1); ctx.lineTo(t.x2, t.y2); ctx.stroke(); }
  ctx.lineWidth = 1;
  for (const f of G.fx) {
    if (!f.k) r(Math.round(f.x), Math.round(f.y), 2, 2, f.c);
    else if (f.k === 'boom') { ctx.globalAlpha = f.l / .3 * .6; ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.arc(f.x, f.y, f.R * (1.2 - f.l / .3 * .6), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    else if (f.k === 'dove') { const t = 2.5 - f.l, X = Math.round(f.x + t * 30), Y = Math.round(f.y - 10 - t * 40), w = Math.floor(t * 8) % 2; r(X - 2, Y, 5, 3, '#fff'); r(X - 5 + (w ? 0 : 1), Y - 1 - w, 3, 2, '#fff'); r(X + 3, Y - 1 - w, 3, 2, '#fff'); r(X + 3, Y + 1, 1, 1, '#ffb02e'); }
  }
  ctx.restore();
  // oscuridad: linterna alrededor de cada jugador
  dctx.globalCompositeOperation = 'source-over'; dctx.clearRect(0, 0, VW, VH);
  dctx.fillStyle = G.power ? 'rgba(6,3,10,.38)' : 'rgba(6,3,10,.78)'; dctx.fillRect(0, 0, VW, VH);
  dctx.globalCompositeOperation = 'destination-out';
  for (const p of G.players) { if (p.dead || p.left) continue;
    const sx = p.x - cam.x, sy = p.y - cam.y, R = G.power ? 120 : 82 + (p.flash > 0 ? 20 : 0);
    const g = dctx.createRadialGradient(sx, sy, 8, sx, sy, R); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = g; dctx.beginPath(); dctx.arc(sx, sy, R, 0, Math.PI * 2); dctx.fill();
  }
  // los zombies dorados brillan un poco en la oscuridad
  for (const z of G.zombies) if (z.gold) { const sx = z.x - cam.x, sy = z.y - cam.y, g = dctx.createRadialGradient(sx, sy, 2, sx, sy, 26); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); dctx.fillStyle = g; dctx.beginPath(); dctx.arc(sx, sy, 26, 0, Math.PI * 2); dctx.fill(); }
  ctx.drawImage(dark, 0, 0);
  ctx.save(); ctx.translate(-cam.x, -cam.y); drawGuides(me); drawRoute(me); ctx.restore();   // la línea guía va encima de la oscuridad
  // compañeros caídos fuera de la pantalla: flecha roja en el borde
  for (const o of G.players) if (o !== me && o.down && !o.dead && !o.left) {
    const sx = o.x - cam.x, sy = o.y - cam.y;
    if (sx > 0 && sy > 0 && sx < VW && sy < VH) continue;
    const ex = Math.max(8, Math.min(VW - 8, sx)), ey = Math.max(30, Math.min(VH - 30, sy));
    r(ex - 3, ey - 3, 6, 6, '#000'); r(ex - 2, ey - 2, 4, 4, Math.floor(performance.now() / 300) % 2 ? '#ff4040' : '#ffc93c');
  }
  drawHUD(me);
  if (performance.now() < routeMsgUntil && !mapOpen) routeMsgText.split(' · ').forEach((l, i) => text(l, VW / 2, 28 + i * 9, '#5bd8ff', 6, 'center'));
  if (mapOpen) drawMap(me);
}
function drawHUD(p) {
  const wf = G.fx.find(f => f.k === 'white'); if (wf) { ctx.globalAlpha = wf.l / .5; r(0, 0, VW, VH, '#fff'); ctx.globalAlpha = 1; }
  // pociones que tienes
  p.potions.forEach((id, i) => { const po = POTIONS.find(o => o.id === id); r(28 + i * 10, VH - 14, 8, 10, '#1a1018'); r(29 + i * 10, VH - 13, 6, 8, po.c); });
  // premios activos
  let py = 18;
  if (G.x2T > 0 && (G.x2T > 5 || Math.floor(performance.now() / 250) % 2)) { text('x2 ' + Math.ceil(G.x2T), 6, py, '#ffc93c', 6); py += 9; }
  if (G.killT > 0 && (G.killT > 5 || Math.floor(performance.now() / 250) % 2)) { text('GOLPE MORTAL ' + Math.ceil(G.killT), 6, py, '#ff4040', 6); }
  if (G.msgT > 0) { ctx.globalAlpha = Math.min(1, G.msgT); text(G.msg, VW / 2, 62, '#ffc93c', 6, 'center'); ctx.globalAlpha = 1; }
  if (p.hp < p.maxHp) { const a = (1 - p.hp / p.maxHp) * .55; r(0, 0, VW, 6, `rgba(160,0,20,${a})`); r(0, VH - 6, VW, 6, `rgba(160,0,20,${a})`); r(0, 0, 6, VH, `rgba(160,0,20,${a})`); r(VW - 6, 0, 6, VH, `rgba(160,0,20,${a})`); }
  text(String(G.round || 0), 6, VH - 22, '#d8283a', 16);
  text(String(p.pts), VW - 6, 6, '#ffc93c', 8, 'right');
  const g = p.guns[p.cur], W = wstat(g);
  text(W.n, VW - 6, VH - 24, g.up ? '#c77dff' : '#f4e6d0', 6, 'right');
  text(p.relT > 0 ? 'RECARGANDO' : `${g.ammo} / ${g.res}`, VW - 6, VH - 14, g.ammo === 0 ? '#ff6b6b' : '#f4e6d0', 8, 'right');
  const it = interactable(p);
  if (it) {
    const t = (usingPad ? 'A: ' : isTouch ? '' : 'E: ') + it.txt, can = it.cost === undefined || p.pts >= it.cost;
    text(t, VW / 2, VH - 38, can ? '#f4e6d0' : '#ff8080', 6, 'center');
  }
  if (G.banner > 0) {
    ctx.globalAlpha = Math.min(1, G.banner); text('RONDA ' + G.round, VW / 2, 40, '#d8283a', 16, 'center'); ctx.globalAlpha = 1;
  } else if (G.banner < 0) {
    ctx.globalAlpha = Math.min(1, -G.banner); text('¡SE HIZO LA LUZ!', VW / 2, 40, '#ffc93c', 10, 'center'); ctx.globalAlpha = 1;
  }
  if (padToast > 0) text('Control conectado', VW / 2, 18, '#8fd0ff', 6, 'center');
  // compañeros (puntos y estado)
  if (!G.solo) G.players.forEach((o, i) => {
    if (o === p) return;
    const st = o.left || o.away ? ' RECONECT.' : o.dead ? ' FUERA' : o.down ? ' CAÍDO ' + Math.ceil(o.bleed) : '';
    text(o.name + ' ' + o.pts + st, VW - 6, 17 + (i - (i > p.idx ? 1 : 0)) * 8, o.down ? '#ff6b6b' : o.dead || o.left ? '#888' : CHARS[o.ch].c, 6, 'right');
  });
  if (p.down) text('¡CAÍSTE! QUE TE REVIVAN · ' + Math.ceil(p.bleed), VW / 2, 50, '#ff6b6b', 6, 'center');
  if (p.dead) text('TE DESANGRASTE · VUELVES LA PRÓXIMA RONDA', VW / 2, 50, '#ff6b6b', 6, 'center');
  if (netOn && !isHost) {
    const lag = performance.now() - lastRx;
    if (lag > 1500) text('RECONECTANDO…', VW / 2, 26, '#ff6b6b', 6, 'center');
    else text(ping + 'ms', VW / 2, 6, ping < 120 ? '#4caf3a' : ping < 250 ? '#ffc93c' : '#ff6b6b', 6, 'center');
  }
  const room = roomAt[idx(Math.floor(p.x / TS), Math.floor(p.y / TS))];
  if (room >= 0) text(ROOMS[room].n, 6, 6, 'rgba(244,230,208,.7)', 6);
}

/* ============================ BUCLE ============================ */
function update(dt) {
  if (phase !== 'play' || !G) return;
  if (!isHost) { guestUpdate(dt); return; }
  for (const p of G.players) p._rev = false;
  const now = performance.now();
  G.players.forEach((p, i) => { p.away = netOn && i !== myIdx && !p.left && (!RIN[i] || now - RIN[i].at > 1500); });
  G.players.forEach((p, i) => updatePlayer(p, i === myIdx ? readInput(p) : takeRemote(i, p), dt));
  // caídos: si nadie los está reviviendo se desangran
  for (const p of G.players) if (p.down && !p.dead && !p.left && !p.away && !p._rev) {   // desconectado: no se desangra
    p.revT = 0; p.bleed -= dt;
    if (p.bleed <= 0) { p.dead = true; p.down = false; sfx('hurt'); flash(p.name.toUpperCase() + ' SE DESANGRÓ'); }
  }
  if (G.state === 'break') { G.breakT -= dt; if (G.breakT <= 0) startRound(); }
  else {
    G.spawnT -= dt;
    const maxAlive = 24;
    if (G.toSpawn > 0 && G.spawnT <= 0 && G.zombies.length < maxAlive) { if (spawnZombie()) G.toSpawn--; G.spawnT = Math.max(.5, 2.2 - G.round * .15); }
    if (G.toSpawn <= 0 && G.zombies.length === 0) { G.state = 'break'; G.breakT = 9; sfx('roundEnd'); }
  }
  updateZombies(dt);
  updateBox(dt);
  if (G.pap.st === 'work') { G.pap.t -= dt; if (G.pap.t <= 0) { G.pap.st = 'ready'; G.pap.t = 10; sfx('buy'); } }
  else if (G.pap.st === 'ready') { G.pap.t -= dt; if (G.pap.t <= 0) G.pap = { st: 'idle', t: 0, owner: null, gid: null }; }
  for (const d of G.drops) d.l -= dt;
  G.drops = G.drops.filter(d => d.l > 0 && !d.taken);
  G.x2T -= dt; G.killT -= dt;
  commonTimers(dt);
  if (!G.players.some(p => alive(p) || (p.away && !p.dead))) gameOver();
}
function commonTimers(dt) {
  G.msgT -= dt;
  if (G.banner > 0) G.banner = Math.max(0, G.banner - dt); else if (G.banner < 0) G.banner = Math.min(0, G.banner + dt);
  for (const f of G.fx) { f.l -= dt; if (!f.k) { f.x += f.vx * dt; f.y += f.vy * dt; } }
  G.fx = G.fx.filter(f => f.l > 0);
  for (const t of G.tracers) t.l -= dt; G.tracers = G.tracers.filter(t => t.l > 0);
}
// invitado: mueve a su jugador aquí mismo (sin esperar) y lo demás lo dibuja con lo que manda el anfitrión
function guestUpdate(dt) {
  const me = G.players[myIdx];
  if (me) {
    const inp = readInput(me);
    GOUT.fire = inp.fire; GOUT.act = inp.act;
    GOUT.fp = GOUT.fp || inp.firePressed; GOUT.ap = GOUT.ap || inp.actPressed;
    GOUT.rl = GOUT.rl || !!inp.reload; GOUT.kn = GOUT.kn || !!inp.knife; GOUT.sw = GOUT.sw || !!inp.swap;
    if (alive(me) || me.down) me.aim = inp.aim;
    // sin conexión con el anfitrión: tu personaje se queda quieto hasta reconectar
    if (alive(me) && performance.now() - lastRx < 1500) {
      me.mv = !!(inp.mx || inp.my);
      const spd = hasPot(me, 'veloz') ? 88 : 70;
      if (me.mv) move(me, inp.mx * spd, inp.my * spd, dt, pSolid, 4);
    } else me.mv = false;
  }
  const k = Math.min(1, dt * 12);
  G.players.forEach((p, i) => { p.flash -= dt; p.knifeAnim -= dt; if (i === myIdx || p.tx === undefined) return; p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; });
  for (const z of G.zombies) { z.anim += dt; z.flash -= dt; z.x += (z.tx - z.x) * k; z.y += (z.ty - z.y) * k; }
  for (const d of G.drops) d.l -= dt;
  commonTimers(dt);
}
function updateBox(dt) {
  const b = G.box;
  if (b.st === 'spin') {
    b.t -= dt;
    b.show = WEAPONS[BOX_POOL[Math.floor(performance.now() / 120) % BOX_POOL.length]].n;
    if (b.t <= 0) {
      if (b.uses >= b.minUses && Math.random() < .35) {      // la paloma se lleva el baúl
        b.st = 'gone'; b.t = 4; sfx('dove'); flash('¡LA PALOMA SE LLEVÓ EL BAÚL!');
        if (G.players[b.owner]) G.players[b.owner].pts += 950;
        const L = BOX_LOCS[b.loc]; addFx({ k: 'dove', x: L.x, y: L.y, l: 2.5 });
      } else {
        const owned = G.players[b.owner] ? G.players[b.owner].guns.map(g => g.id) : [];
        const pool = BOX_POOL.filter(id => !owned.includes(id));
        b.gun = pool[Math.floor(Math.random() * pool.length)]; b.st = 'ready'; b.t = 9;
      }
    }
  } else if (b.st === 'ready') {
    b.t -= dt; if (b.t <= 0) { b.st = 'idle'; b.gun = null; }
  } else if (b.st === 'gone') {
    b.t -= dt;
    if (b.t <= 0) {
      let n; do { n = Math.floor(Math.random() * BOX_LOCS.length); } while (n === b.loc);
      b.loc = n; b.st = 'idle'; b.uses = 0; b.minUses = 4 + Math.floor(Math.random() * 4);
    }
  }
}
function takeDrop(k, p) {
  sfx('drop'); flash(DROPS[k].n);
  if (k === 'ammo') G.players.forEach(pl => pl.guns.forEach(g => { const W = wstat(g); g.res = W.res; g.ammo = W.mag; }));
  if (k === 'x2') G.x2T = 30;
  if (k === 'kill') G.killT = 30;
  if (k === 'carp') {      // carpintero: todas las ventanas reparadas
    WINDOWS.forEach(w => { w.boards = 6; }); sfx('board');
    G.players.forEach(pl => { if (alive(pl)) pl.pts += 200; });
  }
  if (k === 'bomb') {
    sfx('boom'); addFx({ k: 'white', l: .5 });
    for (const z of G.zombies) if (!z.dead && z.st === 'in') { z.hp = 0; z.dead = true; addFx({ k: 'corpse', x: z.x, y: z.y, l: .6 }); }
    G.players.forEach(pl => { if (alive(pl)) pl.pts += 400; });
  }
}
function gameOver() {
  phase = 'over';
  const d = { r: G.round, pl: G.players.map(p => ({ n: p.name, k: p.kills, c: p.ch })) };
  play_('hurt'); showOver(d);
  if (netOn) broadcast({ t: 'over', d });
}
function showOver(d) {
  const rows = d.pl.map(p => `<span style="color:${CHARS[p.c].c}">${esc(p.n)}</span>: ${p.k} zombies`).join('<br>');
  $('overTxt').innerHTML = `Sobrevivieron <b style="color:#d8283a">${d.r} rondas</b><br><br>${rows}`;
  $('bRetry').classList.toggle('hidden', netOn && !isHost);
  $('overWait').textContent = netOn && !isHost ? 'Esperando a que el anfitrión empiece otra…' : '';
  show('over');
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ============================ RED (PeerJS) ============================ */
// El anfitrión simula todo el juego. Cada invitado manda su posición y botones;
// el anfitrión manda ~15 fotos por segundo del mundo.
const NET_PREFIX = 'fdm-zt-', CODE_AB = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
let peer = null, hostConn = null, room = [], roomCode = '', ping = 0, lastRx = 0, lastTry = 0, lastSnap = 0, lastIn = 0, lastPing = 0, lostSince = 0;
const RIN = [];                    // última entrada de cada invitado (en el anfitrión)
let GOUT = {};                     // botones del invitado acumulados entre envíos
let CID = '';
try { CID = sessionStorage.getItem('fdm-cid') || ''; if (!CID) { CID = Math.random().toString(36).slice(2, 10); sessionStorage.setItem('fdm-cid', CID); } } catch (e) { CID = Math.random().toString(36).slice(2, 10); }
// igual que en la cocina: solo mandar si NO hay nada esperando en la fila (ni en PeerJS ni en el canal).
// Si la red va lenta, mejor saltarse una foto que acumular fotos viejas (eso causaba el desfase).
const canStream = c => c && c.open && (c.bufferSize || 0) === 0 && (!c.dataChannel || c.dataChannel.bufferedAmount < 8000);
function send(c, m) { try { if (c && c.open) c.send(m); } catch (e) { } }
function broadcast(m) { room.forEach(r => r.conn && send(r.conn, m)); }
function setStatus(s) { $('status').textContent = s; }
function newPeer(id) {
  const p = id ? new Peer(id) : new Peer();
  p.on('disconnected', () => { if (!p.destroyed) try { p.reconnect(); } catch (e) { } });
  return p;
}

// ---- anfitrión ----
function createRoom() {
  ensureAudio(); leaveNet(true);
  if (typeof Peer === 'undefined') { setStatus('No cargó la red. Revisa tu internet.'); return; }
  roomCode = Array.from({ length: 4 }, () => CODE_AB[Math.random() * CODE_AB.length | 0]).join('');
  setStatus('Creando sala…');
  const p = peer = newPeer(NET_PREFIX + roomCode);
  p.on('open', () => {
    if (p !== peer) return;
    isHost = true; netOn = true; myIdx = 0; room = [{ name: myName(), ch: myChar, conn: null, cid: CID }];
    phase = 'lobby'; show('lobby'); renderLobby(); setStatus('');
  });
  p.on('error', e => {
    if (p !== peer) return;
    if (e.type === 'unavailable-id') { p.destroy(); createRoom(); }
    else if (phase === 'menu') setStatus('Error de red: ' + e.type);
  });
  p.on('connection', c => {
    c.on('data', m => hostOnData(c, m));
    c.on('close', () => hostOnClose(c));
    c.on('error', () => hostOnClose(c));
  });
}
function roomList() { return room.map(r => ({ name: r.name, ch: r.ch })); }
function syncLobby() { room.forEach((r, i) => r.conn && send(r.conn, { t: 'welcome', idx: i })); broadcast({ t: 'lobby', list: roomList(), code: roomCode }); renderLobby(); }
function hostOnData(c, m) {
  if (!m || !m.t) return;
  if (m.t === 'join') {
    const name = String(m.name || '').trim().slice(0, 12) || 'Jugador', ch = Math.max(0, Math.min(CHARS.length - 1, m.ch | 0));
    // ¿es alguien que ya estaba (se reconecta)?
    let i = room.findIndex((r, k) => k > 0 && r.cid === m.cid);
    if (i > 0) {
      const old = room[i].conn; room[i].conn = c; if (old && old !== c) try { old.close(); } catch (e) { }
      if (G && G.players[i]) { G.players[i].left = false; G.players[i].tp++; }
    } else {
      if (room.length >= 4) { send(c, { t: 'full' }); return; }
      room.push({ name, ch, conn: c, cid: m.cid }); i = room.length - 1;
      if (phase === 'play' && G) {               // entra a mitad de partida junto a un compañero
        const p = newPlayer(ch, name), a = G.players.find(alive) || G.players[0];
        p.idx = i; p.x = a.x; p.y = a.y; p.tp = 1; p.invT = 3; G.players.push(p); G.solo = false;
        flash(name.toUpperCase() + ' SE UNIÓ');
      }
    }
    send(c, { t: 'welcome', idx: i });
    if (phase === 'lobby') syncLobby();
    else if (G) { send(c, { t: 'start', list: G.players.map(p => ({ name: p.name, ch: p.ch })) }); if (phase === 'over') send(c, { t: 'over', d: { r: G.round, pl: G.players.map(p => ({ n: p.name, k: p.kills, c: p.ch })) } }); }
    else syncLobby();
    return;
  }
  const i = room.findIndex(r => r.conn === c); if (i <= 0) return;
  if (m.t === 'in') {
    const o = RIN[i] || {};
    RIN[i] = Object.assign(m, { at: performance.now(), fp: o.fp || m.fp, ap: o.ap || m.ap, rl: o.rl || m.rl, kn: o.kn || m.kn, sw: o.sw || m.sw });
  } else if (m.t === 'ping') send(c, { t: 'pong', t0: m.t0 });
}
function hostOnClose(c) {
  const i = room.findIndex(r => r.conn === c); if (i <= 0) return;
  if (phase === 'lobby') { room.splice(i, 1); syncLobby(); return; }
  room[i].conn = null; RIN[i] = null;
  if (G && G.players[i]) { G.players[i].left = true; flash(G.players[i].name.toUpperCase() + ' SE DESCONECTÓ'); }
}
function takeRemote(i, p) {
  const m = RIN[i];
  if (!m || performance.now() - m.at > 1000) return { mx: 0, my: 0, aim: p.aim };   // sin datos: quieto
  const inp = { pos: [m.x, m.y], tp: m.tp, mv: m.mv, aim: m.aim, fire: m.fire, firePressed: m.fp, reload: m.rl, knife: m.kn, swap: m.sw, act: m.act, actPressed: m.ap };
  m.fp = m.ap = m.rl = m.kn = m.sw = false;
  return inp;
}
function hostStart() {
  room = room.filter((r, k) => k === 0 || (r.conn && r.conn.open));
  room.forEach((r, i) => r.conn && send(r.conn, { t: 'welcome', idx: i }));
  const list = roomList();
  RIN.length = 0; evQ = { fx: [], tr: [], bl: [] }; sndQ = [];
  ensureAudio(); newGame(list); phase = 'play'; show(null);
  broadcast({ t: 'start', list });
}
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
function buildSnap() {
  const s = {
    t: 's', r: G.round, st: G.state, bn: r2(G.banner), pw: G.power, ro: G.roomOpen, dr: DOORS.map(d => d.open ? 1 : 0), wb: WINDOWS.map(w => w.boards),
    bx: { loc: G.box.loc, st: G.box.st, gun: G.box.gun, show: G.box.show, owner: G.box.owner }, pp: { st: G.pap.st, owner: G.pap.owner, gid: G.pap.gid },
    dp: G.drops.map(d => [Math.round(d.x), Math.round(d.y), d.k, r1(d.l)]), x2: r1(G.x2T), kl: r1(G.killT), msg: G.msg, mt: r1(G.msgT),
    z: G.zombies.map(z => [z.id, Math.round(z.x), Math.round(z.y), z.face, z.flash > 0 ? 1 : 0, z.gold ? 1 : 0]),
    pl: G.players.map(p => ({
      x: r1(p.x), y: r1(p.y), aim: r2(p.aim), mv: p.mv, hp: Math.ceil(p.hp), maxHp: p.maxHp, pts: p.pts, kills: p.kills, down: p.down, dead: p.dead, left: p.left,
      bleed: r1(p.bleed), revT: r2(p.revT), guns: p.guns, cur: p.cur, relT: r2(p.relT), potions: p.potions, flash: r2(p.flash), knifeAnim: r2(p.knifeAnim),
      name: p.name, ch: p.ch, tp: p.tp, away: !!p.away, hurtT: r1(Math.min(p.hurtT, 9)), invT: r1(p.invT),
    })),
    // efectos con números redondeados (fotos más ligeras = menos retraso)
    ev: {
      fx: evQ.fx.map(f => { const o = {}; for (const k in f) o[k] = typeof f[k] === 'number' ? Math.round(f[k] * 100) / 100 : f[k]; return o; }),
      tr: evQ.tr.map(t => ({ x1: Math.round(t.x1), y1: Math.round(t.y1), x2: Math.round(t.x2), y2: Math.round(t.y2), l: t.l, c: t.c })),
      bl: evQ.bl.map(b => ({ x: Math.round(b.x), y: Math.round(b.y), s: r1(b.s) })),
    }, snd: sndQ,
  };
  evQ = { fx: [], tr: [], bl: [] }; sndQ = [];
  return s;
}

// ---- invitado ----
function joinRoom() {
  const code = $('code').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 4) { setStatus('El código tiene 4 letras'); return; }
  ensureAudio(); leaveNet(true);
  if (typeof Peer === 'undefined') { setStatus('No cargó la red. Revisa tu internet.'); return; }
  roomCode = code; isHost = false; netOn = true; setStatus('Conectando…');
  const p = peer = newPeer();
  p.on('open', () => { if (p === peer) connectHost(); });
  p.on('error', e => {
    if (p !== peer) return;
    if (e.type === 'peer-unavailable') { if (phase === 'menu') { leaveNet(true); setStatus('No existe la sala ' + code); } }
    else if (phase === 'menu') setStatus('Error de red: ' + e.type);
  });
}
function connectHost() {
  lastTry = performance.now();
  const c = hostConn = peer.connect(NET_PREFIX + roomCode, { reliable: true, serialization: 'json' });
  c.on('open', () => { if (c !== hostConn) return; lastRx = performance.now(); lostSince = 0; send(c, { t: 'join', name: myName(), ch: myChar, cid: CID }); });
  c.on('data', m => { if (c !== hostConn) return; lastRx = performance.now(); lostSince = 0; guestOnData(m); });
}
function guestOnData(m) {
  if (!m || !m.t) return;
  if (m.t === 'welcome') { myIdx = m.idx; if (phase === 'menu') { phase = 'lobby'; show('lobby'); setStatus(''); } }
  else if (m.t === 'lobby') { roomCode = m.code || roomCode; renderLobby(m.list); }
  else if (m.t === 'full') { leaveNet(true); setStatus('La sala está llena (máximo 4)'); }
  else if (m.t === 'bye') leaveNet(false, 'El anfitrión cerró la sala');
  else if (m.t === 'start') { newGame(m.list); phase = 'play'; show(null); }
  else if (m.t === 'over') { phase = 'over'; showOver(m.d); }
  else if (m.t === 'pong') ping = Math.round(performance.now() - m.t0);
  else if (m.t === 's' && G && phase === 'play') applySnap(m);
}
function applySnap(s) {
  G.round = s.r; G.state = s.st; G.banner = s.bn; G.power = s.pw; G.roomOpen = s.ro;
  s.dr.forEach((o, i) => { const d = DOORS[i]; if (o && !d.open) { d.open = true; d.tiles.forEach(([x, y]) => setT(x, y, FLOOR, d.a)); } });
  s.wb.forEach((b, i) => { WINDOWS[i].boards = b; });
  Object.assign(G.box, s.bx); G.pap = s.pp;
  G.drops = s.dp.map(([x, y, k, l]) => ({ x, y, k, l }));
  G.x2T = s.x2; G.killT = s.kl; G.msg = s.msg; G.msgT = s.mt;
  const byId = new Map(G.zombies.map(z => [z.id, z]));
  G.zombies = s.z.map(([id, x, y, face, fl, gd]) => {
    let z = byId.get(id);
    if (!z) z = { id, x, y, anim: Math.random() * 10, flash: 0 };
    else if (Math.hypot(z.x - x, z.y - y) > 48) { z.x = x; z.y = y; }
    z.tx = x; z.ty = y; z.face = face; z.gold = !!gd; if (fl) z.flash = .08;
    return z;
  });
  s.pl.forEach((d, i) => {
    let p = G.players[i];
    if (!p) { p = newPlayer(d.ch, d.name); p.idx = i; p.x = d.x; p.y = d.y; G.players[i] = p; G.solo = false; }
    const { x, y, aim, mv, ...rest } = d;
    if (i === myIdx) {
      if (d.tp !== p.tp || d.down || d.dead) { p.x = x; p.y = y; }   // teletransporte o caído: manda el anfitrión
      Object.assign(p, rest);
    } else {
      if (Math.hypot(p.x - x, p.y - y) > 48) { p.x = x; p.y = y; }
      Object.assign(p, rest); p.tx = x; p.ty = y; p.aim = aim; p.mv = mv;
    }
  });
  G.fx.push(...s.ev.fx); G.tracers.push(...s.ev.tr);
  for (const b of s.ev.bl) { if (G.blood.length > 160) G.blood.shift(); G.blood.push(b); }
  s.snd.forEach(play_);
}

// ---- reloj de red (también corre con la pestaña en segundo plano) ----
function netTick(now) {
  if (!netOn) return;
  if (isHost) {
    if ((phase === 'play') && now - lastSnap > 66 && room.some(r => canStream(r.conn))) {   // si nadie puede recibir, se guarda para la siguiente foto
      lastSnap = now; const s = buildSnap();
      room.forEach(r => { if (canStream(r.conn)) send(r.conn, s); });
    }
    return;
  }
  if (phase === 'menu') return;
  const me = G && G.players[myIdx];
  if (phase === 'play' && me && hostConn && now - lastIn > 50 && canStream(hostConn)) {
    lastIn = now;
    send(hostConn, { t: 'in', x: r1(me.x), y: r1(me.y), aim: r2(me.aim), mv: me.mv, tp: me.tp, ...GOUT });
    GOUT = {};
  }
  if (hostConn && now - lastPing > 2000) { lastPing = now; send(hostConn, { t: 'ping', t0: now }); }
  // sin noticias del anfitrión: reconectar
  if (now - lastRx > 4000) {
    if (!lostSince) lostSince = now;
    if (now - lostSince > 45000) { leaveNet(false, 'Se perdió la conexión con el anfitrión'); return; }
    if (now - lastTry > 4000) {
      lastTry = now;
      try { hostConn && hostConn.close(); } catch (e) { } hostConn = null;
      if (!peer || peer.destroyed) {                 // el teléfono mató la conexión: crear otra
        const p = peer = newPeer(); p.on('open', () => { if (p === peer) connectHost(); }); p.on('error', () => { });
      } else if (peer.disconnected) { try { peer.reconnect(); } catch (e) { } }   // al volver, el siguiente intento conecta
      else if (peer.open) connectHost();
    }
  }
}
function leaveNet(quiet, msg) {
  if (netOn && isHost) broadcast({ t: 'bye' });
  const p = peer; peer = null; hostConn = null;
  if (p) setTimeout(() => { try { p.destroy(); } catch (e) { } }, 150);
  room = []; RIN.length = 0; netOn = false; isHost = true; myIdx = 0; GOUT = {};
  if (!quiet) { phase = 'menu'; G = null; show('menu'); }
  setStatus(msg || '');
}

/* ============================ BUCLE ============================ */
let lastTick = performance.now();
function tick() {
  const now = performance.now(), dt = Math.min(.05, (now - lastTick) / 1000); lastTick = now;
  if (dt <= 0) return;
  if (phase !== 'play') {
    const pad = readPad();
    if (pad && (pad.start || pad.actEdge)) {
      if (phase === 'menu') play();
      else if (phase === 'lobby' && isHost) hostStart();
      else if (phase === 'over' && (!netOn || isHost)) retry();
    }
  }
  padToast -= dt;
  update(dt); netTick(now);
}
// el juego avanza con un temporizador en un Worker: así no se congela si la pestaña queda atrás
try {
  const w = new Worker(URL.createObjectURL(new Blob(['setInterval(()=>postMessage(0),16)'], { type: 'text/javascript' })));
  w.onmessage = tick;
} catch (e) { setInterval(tick, 16); }
function frame() { render(); requestAnimationFrame(frame); }

/* ============================ UI ============================ */
const $ = id => document.getElementById(id);
function show(id) { ['menu', 'help', 'over', 'lobby'].forEach(o => $(o).classList.toggle('hidden', o !== id)); $('bMap').classList.toggle('hidden', phase !== 'play'); if (phase !== 'play') closeMap(); $('touch').classList.toggle('hidden', !(isTouch && !usingPad && phase === 'play')); resize(); }
CHARS.forEach((c, i) => {
  const b = document.createElement('button'); b.className = 'char' + (i === myChar ? ' sel' : '');
  const cvs = document.createElement('canvas'); cvs.width = 12; cvs.height = 14; cvs.getContext('2d').drawImage(SP['p' + i], 0, 0);
  b.append(cvs, c.n); b.onclick = () => { myChar = i; document.querySelectorAll('.char').forEach(o => o.classList.toggle('sel', o === b)); };
  $('chars').append(b);
});
// nombre del jugador (se recuerda en este dispositivo)
function myName() { return ($('name').value || '').trim().slice(0, 12) || CHARS[myChar].n; }
try { $('name').value = localStorage.getItem('fdm-name') || ''; } catch (e) { }
$('name').addEventListener('input', () => { try { localStorage.setItem('fdm-name', $('name').value.trim()); } catch (e) { } });
function renderLobby(list) {
  list = list || roomList();
  $('roomCode').textContent = roomCode;
  $('lobbyList').innerHTML = list.map((p, i) => `<div class="pl"><span style="color:${CHARS[p.ch].c}">■</span> ${esc(p.name)}${i === 0 ? ' <small>(anfitrión)</small>' : ''}${i === myIdx ? ' <small>(tú)</small>' : ''}</div>`).join('')
    + Array.from({ length: 4 - list.length }, () => '<div class="pl empty">· libre ·</div>').join('');
  $('bStart').classList.toggle('hidden', !isHost);
  $('lobbyStatus').textContent = isHost ? (list.length > 1 ? '¡Listos! Empieza cuando quieran.' : 'Esperando amigos… (puedes empezar solo)') : 'Esperando a que el anfitrión empiece…';
}
function play() { ensureAudio(); leaveNet(true); newGame(); phase = 'play'; show(null); }
function retry() { if (netOn && isHost) hostStart(); else play(); }
$('bPlay').onclick = play; $('bRetry').onclick = retry;
$('bCreate').onclick = createRoom; $('bJoin').onclick = joinRoom;
$('code').addEventListener('keydown', e => { if (e.key === 'Enter') joinRoom(); });
$('bStart').onclick = hostStart;
$('bMap').onclick = () => { ensureAudio(); toggleMap(); };
$('rBox').onclick = () => setRoute('box'); $('rPot').onclick = () => setRoute('potion'); $('rPap').onclick = () => setRoute('pap');
$('rOff').onclick = () => { ROUTE = null; closeMap(); }; $('rClose').onclick = closeMap;
$('bLeave').onclick = () => leaveNet(false);
$('bMenu').onclick = () => { if (netOn) leaveNet(false); else { phase = 'menu'; G = null; show('menu'); } };
$('bShare').onclick = async () => {
  const url = location.origin + location.pathname + '?sala=' + roomCode;
  const txt = '¡Únete a mi partida de Función de Medianoche! Código: ' + roomCode;
  try { if (navigator.share) { await navigator.share({ title: 'Función de Medianoche', text: txt, url }); return; } } catch (e) { return; }
  try { await navigator.clipboard.writeText(txt + ' ' + url); $('lobbyStatus').textContent = '¡Enlace copiado!'; } catch (e) { $('lobbyStatus').textContent = url; }
};
{ const q = new URLSearchParams(location.search).get('sala'); if (q) $('code').value = q.toUpperCase().slice(0, 4); }
$('bHelp').onclick = () => show('help'); $('bHelpClose').onclick = () => show(phase === 'play' ? null : phase === 'lobby' ? 'lobby' : phase === 'over' ? 'over' : 'menu');
$('fs').onclick = () => {
  const d = document;
  if (!d.fullscreenElement) { (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen || (() => { })).call(d.documentElement); try { screen.orientation.lock('landscape').catch(() => { }); } catch (e) { } }
  else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
};
function resize() {
  const vw = innerWidth, vh = innerHeight;
  const sc = Math.min(vw / VW, vh / VH);
  const cw = Math.floor(VW * sc), ch = Math.floor(VH * sc), dpr = Math.min(3, devicePixelRatio || 1);
  cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
  cv.style.left = Math.floor((vw - cw) / 2) + 'px'; cv.style.top = Math.floor((vh - ch) / 2) + 'px';
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); S = cv.width / VW;
}
addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));
resize();
if (document.fonts && document.fonts.load) document.fonts.load("8px 'Press Start 2P'");
requestAnimationFrame(frame);

/* ============================ PWA (instalar en el dispositivo) ============================ */
if ('serviceWorker' in navigator && location.protocol !== 'file:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone;
let installEv = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEv = e; $('bInstall').classList.remove('hidden'); });
$('bInstall').onclick = async () => { if (!installEv) return; installEv.prompt(); try { await installEv.userChoice; } catch (e) { } installEv = null; $('bInstall').classList.add('hidden'); };
addEventListener('appinstalled', () => { $('bInstall').classList.add('hidden'); setStatus('¡Instalado! Ábrelo desde su ícono.'); });
if (!standalone && /iPhone|iPad|iPod/.test(navigator.userAgent)) $('iosHint').classList.remove('hidden');
