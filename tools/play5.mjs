// ============================================================================
//  UJI INTERAKSI LEVEL 5  --  node tools/play5.mjs
//
//  Menjalankan game di Node (stub DOM/canvas) dan memainkan Level 5
//  "Instalasi Rack Server" dari awal sampai layar hasil:
//   - Kontrak level & inisialisasi (5 perangkat)
//   - Seret 5 perangkat ke slot rak yang benar (UPS paling bawah,
//     patch panel paling atas, switch di atas router)
//   - Cek Susunan Rack -> semua aturan terpenuhi
//   - Sambungan salah (router langsung ke patch panel) -> penalti
//   - Sambungkan 4 kabel sesuai topologi (router-sw, sw-server,
//     sw-patch, ups-server)
//   - Kuis susunan rack -> jawab benar -> layar hasil
//
//  Membuktikan rendering baru (drawDevice detail: ventilasi, LED,
//  sekrup) tidak mengubah mekanisme penempatan & koneksi Level 5.
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

// geometri rak Level 5 (RX=340, RY=70, U=40, N=12, RW=280)
const RX = 340, RY = 70, U = 40, N = 12, RW = 280;
const slotY = (slot, u) => RY + (N - slot - u) * U;         // puncak perangkat di slot
const dotXY = (d, k) => {                                     // dotPos(d, k)
  const r = d.slot != null
    ? { x: RX, y: slotY(d.slot, d.u), h: d.u * U }
    : { x: 20, y: d.ty, h: d.u * U };
  return { x: r.x + RW - 16 - k * 22, y: r.y + r.h / 2 };
};

let lv = null;
// seret perangkat dari home ke slot rak (offY = u*U/2)
function dragDevice(d, slot) {
  const x0 = 60, y0 = d.ty + d.u * U / 2;
  NC.mouse().x = x0; NC.mouse().y = y0;
  frame();
  lv.down({ x: x0, y: y0 });
  frame();
  const ty = slotY(slot, d.u);
  NC.mouse().x = RX + RW / 2; NC.mouse().y = ty + d.u * U / 2;
  frame();
  lv.up({ x: RX + RW / 2, y: ty + d.u * U / 2 });
  frame();
}
function clickDot(d, k, label) {
  const q = dotXY(d, k);
  click(q.x, q.y, label);
}

async function run() {
  console.log('== KONTRAK & INISIALISASI LEVEL 5 ==');
  NC.save.teacher = true;
  NC.startLevel(4); // Level 5 (0-indexed = 4) — Instalasi Rack Server
  lv = NC.scene();
  ok('scene terbentuk & punya draw', typeof lv.draw === 'function');
  ok('kontrak draw/down/up',
    typeof lv.draw === 'function' && typeof lv.down === 'function' &&
    typeof lv.up === 'function');
  ok('5 perangkat terdaftar', lv.devs.length === 5, lv.devs.map(d => d.id).join(','));
  ok('fase awal place', lv.phase === 'place', 'phase=' + lv.phase);
  ok('belum ada sambungan', lv.links.length === 0);

  console.log('\n== SERET PERANGKAT KE RAK (SUSUNAN BENAR) ==');
  // slot benar: patch=11 (atas), sw=10, router=9, server=7 (u=2), ups=5 (u=2, bawah)
  const PLAN = [['patch', 11], ['sw', 10], ['router', 9], ['server', 7], ['ups', 5]];
  const byId = id => lv.devs.find(d => d.id === id);
  PLAN.forEach(([id, slot]) => {
    const d = byId(id);
    dragDevice(d, slot);
    ok(d.n + ' -> slot ' + slot, d.slot === slot, 'slot=' + d.slot);
  });
  ok('semua perangkat di rack', lv.devs.every(d => d.slot != null));
  ok('perangkat tidak saling menembus',
    PLAN.every(([id, s]) => {
      const d = byId(id);
      return lv.devs.every(o => o === d || o.slot == null ||
        !(s < o.slot + o.u && o.slot < s + d.u));
    }));

  console.log('\n== CEK SUSUNAN RACK ==');
  click(821, 516, 'klik Cek Susunan Rack');                   // btn (716..926, 494..538)
  ok('susunan dinyatakan benar (4 aturan terpenuhi)',
    lv.ruleOk && lv.ruleOk.length === 4 && lv.ruleOk.every(Boolean),
    JSON.stringify(lv.ruleOk));
  ok('fase masuk cable', lv.phase === 'cable', 'phase=' + lv.phase);

  console.log('\n== SAMBUNGAN TIDAK ADA DI TOPOLOGI -> PENALTI ==');
  clickDot(byId('router'), 0, 'klik port Router');
  clickDot(byId('patch'), 0, 'klik port Patch Panel (salah)');
  ok('sambungan router-patch ditolak', lv.links.length === 0, 'links=' + lv.links.length);
  ok('penalti + penjelasan jalur lewat switch tercatat',
    lv.mistakes.some(m => m.indexOf('Patch panel tidak langsung ke router') >= 0),
    'skor=' + lv.score);

  console.log('\n== SAMBUNGKAN 4 KABEL SESUAI TOPOLOGI ==');
  const CONN = [['router', 0, 'sw', 0], ['sw', 1, 'server', 0], ['sw', 2, 'patch', 0], ['ups', 0, 'server', 1]];
  CONN.forEach(([a, ka, b, kb]) => {
    clickDot(byId(a), ka, 'klik port ' + a + ' #' + (ka + 1));
    clickDot(byId(b), kb, 'klik port ' + b + ' #' + (kb + 1));
    ok('tersambung ' + a + ' - ' + b,
      lv.links.some(l => l.key === [a, b].sort().join('|')),
      'links=' + lv.links.length);
  });
  ok('4 sambungan terbentuk', lv.links.length === 4);
  ok('port terpakai ditandai', lv.devs.every(d => d.used.filter(Boolean).length >= 1));
  ok('fase cabled', lv.phase === 'cabled', 'phase=' + lv.phase);

  console.log('\n== TUNGGU KUIS ==');
  await wait(1500);
  frames(3);
  ok('fase masuk quiz', lv.phase === 'quiz', 'phase=' + lv.phase);

  console.log('\n== JAWAB KUIS ==');
  const q = lv.quiz;
  ok('soal kuis tersedia (3 pilihan)', !!q && q.opts.length === 3, q ? q.opts.length + ' opsi' : 'null');
  click(480, 303 + q.ans * 58, 'jawab benar: "' + q.opts[q.ans] + '"');
  ok('jawaban benar diterima', lv.phase === 'fin', 'phase=' + lv.phase);

  console.log('\n== TUNGGU LAYAR HASIL ==');
  await wait(2600);
  frames(6);
  ok('level selesai (finished)', lv.finished === true, 'finished=' + lv.finished);
  ok('skor tersimpan di save.best[6]', (NC.save.best[6] || 0) === lv.score, 'best=' + NC.save.best[6]);
  ok('bintang tersimpan', (NC.save.stars[6] || 0) >= 1, 'stars=' + NC.save.stars[6]);
  ok('log level 5 tersimpan', NC.save.log.some(e => e.level === 5 && e.hasil === 'Lulus'));
  ok('scene berpindah ke layar hasil', NC.scene() !== lv);

  console.log('\n== RINGKASAN TEST PLAY5 ==');
  console.log('frame digambar : ' + drawn);
  console.log('total kegagalan : ' + failures);
  if (failures) { console.log('==> GAGAL'); process.exit(1); }
  console.log('==> SEMUA PENGUJIAN LEVEL 5 LULUS!');
}
run();
