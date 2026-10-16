// ============================================================================
//  UJI INTERAKSI LEVEL 4 (JARINGAN)  --  node tools/play4.mjs
//
//  Menjalankan game sungguhan di Node (stub DOM/canvas) dan memainkan Level 4
//  "Simulasi Penggunaan Kabel Jaringan" dengan skenario NEGATIF terlebih
//  dahulu (port terpakai ditolak, IP salah -> ping gagal), lalu diperbaiki
//  sampai sukses:
//
//   Skenario 1  Drag kabel #1 ke port 1        -> link aktif (LED hijau)
//   Skenario 2  Coba kabel #2 ke port 1 (isi)  -> ditolak, port tetap
//   Skenario 3  Drag kabel #2 ke port 2        -> kedua link aktif
//   Skenario 4  Konfigurasi IP salah subnet    -> ping PC2 GAGAL
//   Skenario 5  Perbaiki IP                    -> ping PC2 BERHASIL
//   Skenario 6  Modal ping sukses -> "Lihat Hasil" -> layar hasil & RAPOR
//
//  Plus: validasi port (port terpakai ditolak), kabel dinamis (drag & lepas),
//  dan penyimpanan hasil (best/stars/board4/log/lencana).
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
const DROPDOWN = { pc1: 114, pc2: 166, subnet: 218, gateway: 270 };
const OPT = (key, i) => ({ x: 848, y: DROPDOWN[key] + 34 + i * 30 + 14 });
const BTN_PING_PC2 = { x: 848, y: 362 };
const BTN_LANJUT_HASIL = { x: 480, y: 338 };

async function run() {
  console.log('== KONTRAK & INISIALISASI LEVEL 4 ==');
  NC.save.teacher = true;
  NC.startLevel(3); // Level 4 (0-indexed = 3)
  const lv = NC.scene();
  ok('scene terbentuk & punya draw', typeof lv.draw === 'function');
  ok('kontrak lengkap draw/down/move/up',
    typeof lv.draw === 'function' && typeof lv.down === 'function' &&
    typeof lv.move === 'function' && typeof lv.up === 'function');
  ok('2 kabel straight + 8 port switch', lv.cables.length === 2 && lv.PORTS.length === 8,
    'kabel=' + lv.cables.length + ' port=' + lv.PORTS.length);
  ok('skor mulai 100', lv.score === 100, 'skor=' + lv.score);
  ok('mulai dari briefing', lv.phase === 'brief', 'phase=' + lv.phase);

  console.log('\n== BRIEFING ==');
  for (let i = 0; i < 10; i++) click(695, 441);
  click(637, 504, 'klik Mulai Misi');
  ok('masuk fase pemasangan kabel', lv.phase === 'play', 'phase=' + lv.phase);

  console.log('\n== SKENARIO 1: KABEL #1 -> PORT 1 -> LINK AKTIF ==');
  drag(CHIP1.x, CHIP1.y, PORT(0).x, PORT(0).y, 'seret kabel #1 ke port 1');
  ok('kabel #1 terpasang di port 1', lv.cables[0].port === 1, 'port=' + lv.cables[0].port);
  ok('kabel #1 terhubung ke PC', !!lv.cables[0].pc, 'pc=' + lv.cables[0].pc);
  await wait(1100); frames(3);
  ok('link aktif (LED hijau)', lv.PORTS[0].linkLED === true, 'linkLED=' + lv.PORTS[0].linkLED);

  console.log('\n== SKENARIO 2: PORT TERPAKAI DITOLAK ==');
  drag(CHIP2.x, CHIP2.y, PORT(0).x, PORT(0).y, 'coba seret kabel #2 ke port 1 (terpakai)');
  ok('kabel #2 ditolak (port 1 tetap milik kabel #1)', lv.cables[1].port === null && lv.PORTS[0].cable === 'c1',
    'port1.cable=' + lv.PORTS[0].cable);

  console.log('\n== SKENARIO 3: KABEL #2 -> PORT 2 -> KEDUA LINK AKTIF ==');
  drag(CHIP2.x, CHIP2.y, PORT(1).x, PORT(1).y, 'seret kabel #2 ke port 2');
  ok('kabel #2 terpasang di port 2', lv.cables[1].port === 2, 'port=' + lv.cables[1].port);
  await wait(1100); frames(3);
  ok('kedua link aktif', lv.PORTS[0].linkLED === true && lv.PORTS[1].linkLED === true,
    'p1=' + lv.PORTS[0].linkLED + ' p2=' + lv.PORTS[1].linkLED);

  console.log('\n== SKENARIO 4: KONFIGURASI IP SALAH -> PING GAGAL ==');
  click(848, DROPDOWN.pc1, 'buka dropdown IP PC1');
  click(OPT('pc1', 0).x, OPT('pc1', 0).y, 'pilih IP PC1');
  click(848, DROPDOWN.pc2, 'buka dropdown IP PC2');
  click(OPT('pc2', 2).x, OPT('pc2', 2).y, 'pilih IP PC2 (subnet berbeda)');
  click(848, DROPDOWN.subnet, 'buka dropdown Subnet');
  click(OPT('subnet', 0).x, OPT('subnet', 0).y, 'pilih Subnet');
  ok('IP terkonfigurasi', !!(lv.ipConfig.pc1 && lv.ipConfig.pc2 && lv.ipConfig.subnet),
    lv.ipConfig.pc1 + ' / ' + lv.ipConfig.pc2 + ' / ' + lv.ipConfig.subnet);
  click(BTN_PING_PC2.x, BTN_PING_PC2.y, 'klik Ping PC2');
  ok('ping GAGAL (subnet beda)', lv.pingResult === 'fail', 'ping=' + lv.pingResult);

  console.log('\n== SKENARIO 5: PERBAIKI IP -> PING BERHASIL ==');
  click(848, DROPDOWN.pc2, 'buka dropdown IP PC2');
  click(OPT('pc2', 0).x, OPT('pc2', 0).y, 'pilih IP PC2 (subnet sama)');
  click(BTN_PING_PC2.x, BTN_PING_PC2.y, 'klik Ping PC2 lagi');
  ok('ping berhasil', lv.pingResult === 'ok', 'ping=' + lv.pingResult);
  ok('pingPc2 ditandai', lv.pingPc2 === true);
  await wait(1100); frames(3);
  ok('modal "Jaringan berhasil terhubung!" muncul', lv.phase === 'pingSuccess' && lv.modal === 'pingSuccess',
    'phase=' + lv.phase + ' modal=' + lv.modal);

  console.log('\n== SKENARIO 6: LIHAT HASIL -> LAYAR RAPOR ==');
  click(BTN_LANJUT_HASIL.x, BTN_LANJUT_HASIL.y, 'klik Lihat Hasil');
  for (let i = 0; i < 40; i++) { frame(); await wait(50); if (lv.finished) break; }
  ok('level selesai (finished)', lv.finished === true, 'finished=' + lv.finished);
  ok('scene berpindah ke layar hasil', NC.scene() !== lv);
  ok('skor tersimpan di save.best[3]', (NC.save.best[3] || 0) === lv.score, 'best=' + NC.save.best[3]);
  ok('bintang tersimpan', (NC.save.stars[3] || 0) >= 1, 'stars=' + NC.save.stars[3]);
  ok('papan skor board4 terisi', Array.isArray(NC.save.board4) && NC.save.board4.length >= 1,
    'board4=' + (NC.save.board4 || []).length);
  ok('log level 4 tersimpan', NC.save.log.some(e => e.level === 4 && e.hasil === 'Lulus'));
  ok('lencana "Jaringan Hidup" tercatat', (lv.logExtra.lencana || '').includes('Jaringan Hidup'),
    'lencana=' + lv.logExtra.lencana);

  console.log('\n== RINGKASAN TEST PLAY4 ==');
  console.log('frame digambar : ' + drawn);
  console.log('total kegagalan : ' + failures);
  if (failures) { console.log('==> GAGAL'); process.exit(1); }
  console.log('==> SEMUA PENGUJIAN LEVEL 4 LULUS!');
}
run();
