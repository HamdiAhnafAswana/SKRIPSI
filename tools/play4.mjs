// ============================================================================
//  UJI INTERAKSI LEVEL 4  --  node tools/play4.mjs
//
//  Menjalankan game di Node (stub DOM/canvas) dan memainkan Level 4
//  "Pasang ke Patch Panel" dari awal sampai layar hasil:
//   - Kontrak level & inisialisasi (4 kabel, 8 port, bilah awal)
//   - Drag kabel ke port SALAH -> penalti & kembali home
//   - Drag 4 kabel ke port yang benar sesuai daftar jalur
//   - Alat salah (Crimping Tool) -> penalti "bukan alat untuk punch-down"
//   - Punch-down dengan bilah menghadap dalam -> penalti & port tidak jadi
//   - Atur bilah ke luar, punch-down 4 port -> terminasi & level menang
//   - Animasi punch-down tool (lv.pa) berjalan tanpa error
//   - Layar hasil, skor & log tersimpan
//
//  Membuktikan rendering/animasi baru (drawPunchTool, port berkedalaman,
//  LED status) tidak mengubah mekanisme simulasi Level 4.
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createGameHTML } from './game-loader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = createGameHTML();
const raw = html.match(/<script>\r?\n([\s\S]*?)\r?\n<\/script>/)[1];
const EXPORTS = `globalThis.__NC = { LEVELS, levelTotal, levelList, go, startLevel, scene: () => scene,
  save, persist, baseLevel, endLevel, quizPick, mouse: () => mouse, btns: () => btns, inR,
  newFrame: () => { hoverBtn = false; btns = []; } };`;
const js = raw.replace(/\}\)\(\);\s*$/, EXPORTS + '\n})();');

const store = new Map();
const listeners = new Map();
const noop = () => {};
const onOff = { addEventListener: (k, f) => listeners.set(k, f), removeEventListener: noop };
const CTX_STUB = () => new Proxy({
  canvas: { width: 960, height: 600 },
  measureText: t => ({ width: String(t).length * 7 }),
  createLinearGradient: () => ({ addColorStop() {} }),
  createRadialGradient: () => ({ addColorStop() {} }),
  createPattern: () => ({}),
  getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }),
  createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h * 4)), width: w, height: h }),
}, { get: (t, k) => (k in t ? t[k] : () => { }), set: (t, k, v) => (t[k] = v, true) });

const mkEl = () => ({
  width: 960, height: 600, style: {}, getContext: CTX_STUB,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 600 }),
  addEventListener: noop, removeEventListener: noop,
});
const document = {
  getElementById: () => mkEl(), createElement: t => (t === 'canvas' ? mkEl() : { style: {}, appendChild: noop }),
  head: { appendChild: noop }, body: { appendChild: noop }, addEventListener: (k, f) => listeners.set(k, f),
};
const win = Object.assign({ devicePixelRatio: 1, WebGLRenderingContext: function () {}, screen: {} }, onOff);
const sandbox = {
  document, window: win,
  navigator: { hardwareConcurrency: 8, userAgent: 'node-smoke', clipboard: { writeText: () => Promise.resolve() } },
  localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => 0, setTimeout: (f, t) => setTimeout(f, Math.min(t || 0, 5)), clearTimeout,
  console, Promise, Math, Date, JSON, Uint8ClampedArray, Number, String, Array, Object, Map, Set, isNaN, parseInt, parseFloat, Intl,
};
sandbox.globalThis = sandbox;
win.document = document;
vm.createContext(sandbox);
vm.runInContext(js, sandbox, { filename: 'index.html' });

const NC = sandbox.__NC;
const wait = ms => new Promise(r => setTimeout(r, ms));

let drawn = 0, failures = 0;
function frame() {
  NC.newFrame();
  const sc = NC.scene(); sc.draw(); if (sc.tick) sc.tick(); drawn++;
}
function frames(n) { for (let i = 0; i < n; i++) frame(); }
function ok(label, cond, extra) {
  if (!cond) failures++;
  console.log((cond ? '  OK    ' : '  GAGAL ') + label + (extra ? '   [' + extra + ']' : ''));
}
function click(x, y, label) {
  const sc = NC.scene();
  NC.mouse().x = x; NC.mouse().y = y;
  frame();
  const bs = NC.btns(); let hitFn = null;
  for (let i = bs.length - 1; i >= 0; i--) if (NC.inR({ x, y }, bs[i])) { hitFn = bs[i].fn; break; }
  if (hitFn) hitFn(); else if (sc.down) sc.down({ x, y });
  if (sc.up) sc.up({ x, y });
  frame();
  if (label) ok(label, true);
  return !!hitFn;
}
// drag khusus Level 4: down di kabel -> move (memakai lv.move) -> up di port
function drag(x0, y0, x1, y1) {
  const sc = NC.scene();
  NC.mouse().x = x0; NC.mouse().y = y0;
  frame();
  if (sc.down) sc.down({ x: x0, y: y0 });
  frame();
  NC.mouse().x = x1; NC.mouse().y = y1;
  if (sc.move) sc.move({ x: x1, y: y1 });
  frame();
  if (sc.up) sc.up({ x: x1, y: y1 });
  frame();
}

const BX = j => 290 + j * 77, BY = 124;
const PORT_CX = j => BX(j) + 32, PORT_CY = BY + 46;

async function run() {
  console.log('== KONTRAK & INISIALISASI LEVEL 6 ==');
  NC.save.teacher = true;
  NC.startLevel(5); // Level 6 (0-indexed = 5) — Pasang ke Patch Panel
  const lv = NC.scene();
  ok('scene terbentuk & punya draw', typeof lv.draw === 'function');
  ok('kontrak lengkap draw/down/move/up',
    typeof lv.draw === 'function' && typeof lv.down === 'function' &&
    typeof lv.move === 'function' && typeof lv.up === 'function');
  ok('4 kabel & 8 port', lv.cables.length === 4 && lv.occ.length === 8,
    'kabel=' + lv.cables.length + ' port=' + lv.occ.length);
  ok('bilah awal menghadap dalam', lv.blade === 'in', 'blade=' + lv.blade);
  ok('skor mulai 100', lv.score === 100, 'skor=' + lv.score);
  ok('daftar jalur 4 ruangan', lv.cables.every(c => c.room && c.port >= 1 && c.port <= 8),
    lv.cables.map(c => 'Port ' + c.port + ':' + c.room).join(' ; '));

  console.log('\n== DRAG KE PORT SALAH -> PENALTI ==');
  const c0 = lv.cables[0];
  let jw = -1;
  for (let j = 0; j < 8; j++) if (j + 1 !== c0.port && !lv.occ[j]) { jw = j; break; }
  ok('ada port salah kosong untuk uji penalti', jw >= 0, 'Port ' + (jw + 1));
  drag(c0.hx, c0.hy, PORT_CX(jw), 285);
  ok('kabel ditolak (belum seated)', c0.seated === null, 'seated=' + c0.seated);
  ok('kabel kembali ke home', c0.hx === c0.home && c0.hy === 510, 'hx=' + c0.hx);
  ok('penalti salah port tercatat', lv.mistakes.some(m => m.indexOf('harus ke Port') >= 0),
    'skor=' + lv.score);

  console.log('\n== SEAT 4 KABEL KE PORT YANG BENAR ==');
  lv.cables.forEach((c, i) => {
    drag(c.hx, c.hy, PORT_CX(c.port - 1), 285);
    ok('kabel ' + (i + 1) + ' (' + c.room + ') -> Port ' + c.port,
      c.seated === c.port - 1 && lv.occ[c.port - 1] === c,
      'seated=' + (c.seated == null ? 'null' : c.seated + 1));
  });
  ok('semua port terisi tepat', lv.occ.every((o, j) => (o != null) === lv.cables.some(c => c.port - 1 === j)));

  console.log('\n== ALAT SALAH -> PENALTI ==');
  const jFirst = lv.cables[0].port - 1;         // port terisi pertama (acak)
  click(355, 361, 'pilih Crimping Tool (alat salah)');   // TOOLS[0] (290..420, 330..392)
  ok('tool terpilih crimping', lv.tool === 'crimp', 'tool=' + lv.tool);
  click(PORT_CX(jFirst), PORT_CY, 'klik port berisi kabel');
  ok('crimping tool ditolak untuk punch-down',
    lv.mistakes.some(m => m.indexOf('bukan alat untuk punch-down') >= 0), 'skor=' + lv.score);
  ok('port belum terminasi', !lv.occ[jFirst].punched);

  console.log('\n== PUNCH-DOWN DENGAN BILAH DALAM -> PENALTI ==');
  click(495, 361, 'pilih Punch-down Tool');               // TOOLS[1] (430..560)
  ok('tool terpilih punch-down', lv.tool === 'punch', 'tool=' + lv.tool);
  click(PORT_CX(jFirst), PORT_CY, 'punch dengan bilah menghadap dalam');
  ok('bilah dalam ditolak', lv.mistakes.some(m => m.indexOf('Bilah potong harus menghadap ke luar') >= 0),
    'skor=' + lv.score);
  ok('port tetap belum terminasi', !lv.occ[jFirst].punched);

  console.log('\n== ATUR BILAH KE LUAR & PUNCH-DOWN 4 PORT ==');
  click(818, 361, 'atur bilah menghadap luar');           // btn (725..912, 330..392)
  ok('bilah kini menghadap luar', lv.blade === 'out', 'blade=' + lv.blade);
  lv.cables.forEach((c, i) => {
    const j = c.port - 1;
    click(PORT_CX(j), PORT_CY, 'punch-down Port ' + (j + 1) + ' (' + c.room + ')');
    ok('Port ' + (j + 1) + ' terminasi', c.punched === true, 'punched=' + c.punched);
    frames(8);                                            // animasi punch-down tool berjalan
  });
  ok('animasi punch-down (lv.pa) selesai tanpa error', lv.pa === null || typeof lv.pa.t0 === 'number');
  ok('semua kabel terminasi', lv.cables.every(c => c.punched));
  ok('level menang (phase=fin)', lv.phase === 'fin', 'phase=' + lv.phase);

  console.log('\n== TUNGGU LAYAR HASIL ==');
  await wait(2000);
  frames(6);
  ok('level selesai (finished)', lv.finished === true, 'finished=' + lv.finished);
  ok('skor tersimpan di save.best[5]', (NC.save.best[5] || 0) === lv.score, 'best=' + NC.save.best[5]);
  ok('bintang tersimpan', (NC.save.stars[5] || 0) >= 1, 'stars=' + NC.save.stars[5]);
  ok('log level 6 tersimpan', NC.save.log.some(e => e.level === 6 && e.hasil === 'Lulus'));
  ok('scene berpindah ke layar hasil', NC.scene() !== lv);

  console.log('\n== RINGKASAN TEST PLAY4 ==');
  console.log('frame digambar : ' + drawn);
  console.log('total kegagalan : ' + failures);
  if (failures) { console.log('==> GAGAL'); process.exit(1); }
  console.log('==> SEMUA PENGUJIAN LEVEL 6 LULUS!');
}
run();
