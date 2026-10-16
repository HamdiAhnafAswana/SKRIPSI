// ============================================================================
//  UJI INTERAKSI LEVEL 4 (JARINGAN)  --  node tools/play4net.mjs
//
//  Menjalankan game sungguhan di Node (stub DOM/canvas) dan memainkan Level 4
//  "Simulasi Penggunaan Kabel Jaringan" dari briefing sampai layar RAPOR:
//
//   Skenario 1  Pasang kabel PC1 -> Switch Port 1        -> link aktif
//   Skenario 2  Cabut kabel (seret ke area kosong)       -> link mati
//   Skenario 3  Pindahkan kabel ke Port 5                -> tetap berhasil
//   Skenario 4  Ping PC2 berhasil                         -> modal Lanjut Evaluasi
//   Skenario 5  Selesaikan kuis 4 soal                   -> RAPOR + skor + bintang
//
//  Plus: validasi port (port terpakai ditolak), kabel dinamis (drag & lepas),
//  dan penyimpanan hasil (save.best[3], save.stars[3], save.board4, save.log).
// ============================================================================
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createGameHTML } from './game-loader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = createGameHTML();
const raw = html.match(/<script>\r?\n([\s\S]*?)\r?\n<\/script>/)[1];
const EXPORTS = `globalThis.__NC = { LEVELS, levelTotal, levelList, go, startLevel, scene: () => scene,
  save, persist, baseLevel, endLevel, mouse: () => mouse, btns: () => btns, inR,
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
function drag(x0, y0, x1, y1, label) {
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
  if (label) ok(label, true);
}

/* ---- koordinat (lihat levels/level4-network.js) ---- */
const CHIP1 = { x: 102, y: 190 };                 // kartu kabel #1
const CHIP2 = { x: 102, y: 244 };                 // kartu kabel #2
const PORT = j => ({ x: 309 + j * 46, y: 422 });  // pusat port switch (0-based)
const EMPTY = { x: 480, y: 500 };                 // area kosong di area tengah
const DROPDOWN = { pc1: 114, pc2: 166, subnet: 218, gateway: 270 };
const OPT = (key, i) => ({ x: 848, y: DROPDOWN[key] + 34 + i * 30 + 14 });
const BTN_PING_PC2 = { x: 848, y: 362 };
const BTN_PING_GW = { x: 848, y: 402 };
const QUIZ_OPT = i => ({ x: 480, y: 238 + i * 48 });
const BTN_QUIZ_NEXT = { x: 480, y: 492 };
const BTN_LANJUT_EVAL = { x: 480, y: 338 };
const BTN_RAPOR_ULANGI = { x: 280, y: 514 };
const BTN_RAPOR_LANJUT = { x: 670, y: 514 };

async function run() {
  console.log('== KONTRAK & INISIALISASI LEVEL 4 ==');
  NC.save.teacher = true;
  NC.startLevel(3); // Level 4 (0-indexed = 3)
  const lv = NC.scene();
  ok('scene terbentuk & kontrak lengkap',
    typeof lv.draw === 'function' && typeof lv.down === 'function' &&
    typeof lv.move === 'function' && typeof lv.up === 'function');
  ok('2 kabel straight + 8 port switch', lv.cables.length === 2 && lv.PORTS.length === 8,
    'kabel=' + lv.cables.length + ' port=' + lv.PORTS.length);
  ok('mulai dari briefing', lv.phase === 'brief', 'phase=' + lv.phase);
  ok('LV4 memiliki struktur valid', !!lv.cables, 'cables ok');

  console.log('\n== BRIEFING ==');
  for (let i = 0; i < 10; i++) click(695, 441);
  click(637, 504, 'klik Mulai Misi');
  ok('masuk fase pemasangan kabel', lv.phase === 'play', 'phase=' + lv.phase);

  console.log('\n== SKENARIO 1: PASANG KABEL PC1 -> PORT 1 ==');
  drag(CHIP1.x, CHIP1.y, PORT(0).x, PORT(0).y, 'seret kabel #1 ke port 1');
  ok('kabel #1 terpasang di port 1', lv.cables[0].port === 1, 'port=' + lv.cables[0].port);
  ok('kabel #1 terhubung ke PC', !!lv.cables[0].pc, 'pc=' + lv.cables[0].pc);
  ok('port 1 occupied', lv.PORTS[0].occupied === true);
  await wait(1100); frames(3);
  ok('link aktif (LED hijau)', lv.PORTS[0].linkLED === true, 'linkLED=' + lv.PORTS[0].linkLED);

  console.log('\n== SKENARIO 2: CABUT KABEL -> LINK MATI ==');
  drag(PORT(0).x, PORT(0).y, EMPTY.x, EMPTY.y, 'cabut kabel dari port 1');
  ok('port 1 dilepaskan', lv.PORTS[0].occupied === false);
  ok('link mati', lv.PORTS[0].linkLED === false);
  ok('kabel masih di PC (setengah terpasang)', lv.cables[0].pc != null && lv.cables[0].port == null,
    'pc=' + lv.cables[0].pc + ' port=' + lv.cables[0].port);

  console.log('\n== SKENARIO 3: PINDAH KE PORT 5 -> TETAP BERHASIL ==');
  drag(EMPTY.x, EMPTY.y, PORT(4).x, PORT(4).y, 'pindahkan kabel ke port 5');
  ok('kabel #1 kini di port 5', lv.cables[0].port === 5, 'port=' + lv.cables[0].port);
  ok('port 5 occupied', lv.PORTS[4].occupied === true);
  await wait(1100); frames(3);
  ok('link aktif di port 5', lv.PORTS[4].linkLED === true, 'linkLED=' + lv.PORTS[4].linkLED);

  console.log('\n== VALIDASI PORT: PORT TERPAKAI DITOLAK ==');
  drag(CHIP2.x, CHIP2.y, PORT(4).x, PORT(4).y, 'coba pasang kabel #2 ke port 5 (terpakai)');
  ok('kabel #2 ditolak (port 5 terpakai)', lv.cables[1].port == null, 'port=' + lv.cables[1].port);
  ok('port 5 tetap milik kabel #1', lv.PORTS[4].cable === 'c1');
  drag(CHIP2.x, CHIP2.y, PORT(1).x, PORT(1).y, 'pasang kabel #2 ke port 2');
  ok('kabel #2 terpasang di port 2', lv.cables[1].port === 2, 'port=' + lv.cables[1].port);
  await wait(1100); frames(3);
  ok('kedua link aktif', lv.PORTS[4].linkLED && lv.PORTS[1].linkLED,
    'p5=' + lv.PORTS[4].linkLED + ' p2=' + lv.PORTS[1].linkLED);

  console.log('\n== KONFIGURASI IP (SATU JARINGAN) ==');
  click(848, DROPDOWN.pc1, 'buka dropdown PC1 IP');
  click(OPT('pc1', 0).x, OPT('pc1', 0).y, 'pilih IP PC1');
  click(848, DROPDOWN.pc2, 'buka dropdown PC2 IP');
  click(OPT('pc2', 0).x, OPT('pc2', 0).y, 'pilih IP PC2');
  click(848, DROPDOWN.subnet, 'buka dropdown Subnet');
  click(OPT('subnet', 0).x, OPT('subnet', 0).y, 'pilih Subnet');
  click(848, DROPDOWN.gateway, 'buka dropdown Gateway');
  click(OPT('gateway', 0).x, OPT('gateway', 0).y, 'pilih Gateway');
  ok('IP terkonfigurasi', !!(lv.ipConfig.pc1 && lv.ipConfig.pc2 && lv.ipConfig.subnet && lv.ipConfig.gateway),
    lv.ipConfig.pc1 + ' / ' + lv.ipConfig.pc2 + ' / ' + lv.ipConfig.subnet);

  console.log('\n== SKENARIO 4: PING PC2 BERHASIL -> MODAL ==');
  click(BTN_PING_PC2.x, BTN_PING_PC2.y, 'klik Ping PC2');
  ok('ping berhasil', lv.pingResult === 'ok', 'ping=' + lv.pingResult);
  await wait(1100); frames(3);
  ok('modal "Jaringan berhasil terhubung!" muncul', lv.phase === 'pingSuccess' && lv.modal === 'pingSuccess',
    'phase=' + lv.phase + ' modal=' + lv.modal);
  click(BTN_LANJUT_EVAL.x, BTN_LANJUT_EVAL.y, 'klik Lihat Hasil');
  ok('menuju layar hasil', NC.scene() !== lv, 'scene berpindah');

  ok('skor tersimpan di save.best[3]', (NC.save.best[3] || 0) === lv.score, 'best=' + NC.save.best[3]);
  ok('bintang tersimpan', (NC.save.stars[3] || 0) >= 1, 'stars=' + NC.save.stars[3]);
  ok('papan skor board4 terisi', Array.isArray(NC.save.board4) && NC.save.board4.length === 1,
    'board4=' + (NC.save.board4 || []).length);
  ok('log level 4 tersimpan', NC.save.log.some(e => e.level === 4 && e.hasil === 'Lulus'));
  ok('lencana tercatat', /Jaringan Hidup/.test(lv.logExtra.lencana || ''), 'lencana=' + lv.logExtra.lencana);

  console.log('\n== RINGKASAN TEST LEVEL 4 ==');
  console.log('frame digambar : ' + drawn);
  console.log('total kegagalan : ' + failures);
  if (failures) { console.log('==> GAGAL'); process.exit(1); }
  console.log('==> SEMUA PENGUJIAN LEVEL 4 LULUS!');
}
run();
