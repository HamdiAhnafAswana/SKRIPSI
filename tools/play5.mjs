// ============================================================================
//  UJI INTERAKSI LEVEL 5 (CROSSOVER PC -> PC)  --  node tools/play5.mjs
//
//  Menjalankan game sungguhan di Node (stub DOM/canvas) dan memainkan Level 5
//  "Teknologi Jaringan Lanjutan: Kabel Crossover PC -> PC" dari briefing
//  sampai layar hasil:
//
//   Skenario 1  Pilih kabel STRAIGHT (salah) -> ditolak untuk PC ke PC
//   Skenario 2  Pilih kabel CROSSOVER -> seret ke PC1 -> PC2 -> link aktif
//   Skenario 3  Konfigurasi IP -> ping PC2 berhasil
//   Skenario 4  Modal ping sukses -> "Lihat Hasil" -> layar hasil & RAPOR
//
//  Plus: validasi kabel (straight ditolak), kabel dinamis (drag & lepas),
//  dan penyimpanan hasil (best/stars/board5/log/lencana).
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

/* ---- koordinat (lihat levels/level5-crossover.js) ---- */
const TRAY_STRAIGHT = { x: 102, y: 190 };   // kartu kabel straight (CABLE_ROWS[0])
const TRAY_CROSSOVER = { x: 102, y: 244 };  // kartu kabel crossover (CABLE_ROWS[1])
const PC1 = { x: 306, y: 148 };             // pusat PC1
const PC2 = { x: 634, y: 148 };             // pusat PC2
const DROPDOWN = { pc1: 114, pc2: 166, subnet: 218 };
const OPT = (key, i) => ({ x: 848, y: DROPDOWN[key] + 34 + i * 30 + 14 });
const BTN_PING_PC2 = { x: 848, y: 310 };    // tombol Ping PC2 di panel kanan
const BTN_LANJUT_HASIL = { x: 480, y: 338 };// tombol "Lihat Hasil" di modal ping sukses

async function run() {
  console.log('== KONTRAK & INISIALISASI LEVEL 5 ==');
  NC.save.teacher = true;
  NC.startLevel(4); // Level 5 (0-indexed = 4)
  const lv = NC.scene();
  ok('scene terbentuk & punya draw', typeof lv.draw === 'function');
  ok('kontrak draw/down/up',
    typeof lv.draw === 'function' && typeof lv.down === 'function' &&
    typeof lv.up === 'function');
  ok('2 kabel (straight + crossover)', lv.cables.length === 2 &&
    lv.cables.some(c => c.type === 'straight') && lv.cables.some(c => c.type === 'crossover'));
  ok('boardKey menunjuk board5', lv.boardKey === 'board5', 'boardKey=' + lv.boardKey);
  ok('skor mulai 100', lv.score === 100, 'skor=' + lv.score);
  ok('mulai dari briefing', lv.phase === 'brief', 'phase=' + lv.phase);

  console.log('\n== BRIEFING ==');
  for (let i = 0; i < 10; i++) click(695, 441);
  click(637, 504, 'klik Mulai Misi');
  ok('masuk fase pemasangan kabel', lv.phase === 'play', 'phase=' + lv.phase);

  console.log('\n== SKENARIO 1: KABEL STRAIGHT DITOLAK ==');
  drag(TRAY_STRAIGHT.x, TRAY_STRAIGHT.y, PC1.x, PC1.y, 'seret kabel straight ke PC1');
  ok('kabel straight ditolak untuk PC ke PC', lv.cables[0].pc === null && lv.cables[0].port === null,
    'pc=' + lv.cables[0].pc + ' port=' + lv.cables[0].port);
  ok('feedback kabel salah tampil', !!lv.flash && /crossover/i.test(lv.flash.msg), lv.flash && lv.flash.msg);

  console.log('\n== SKENARIO 2: KABEL CROSSOVER -> PC1 -> PC2 ==');
  drag(TRAY_CROSSOVER.x, TRAY_CROSSOVER.y, PC1.x, PC1.y, 'seret kabel crossover ke PC1');
  ok('kabel crossover tersambung ke PC1', lv.cables[1].pc === 'pc1', 'pc=' + lv.cables[1].pc);
  const free = lv.cables[1].free || PC1;
  drag(free.x, free.y, PC2.x, PC2.y, 'seret ujung lain ke PC2');
  ok('kabel crossover tersambung ke PC2', lv.cables[1].port === 'pc2', 'port=' + lv.cables[1].port);
  await wait(1100); frames(3);
  ok('link aktif di kedua PC', lv.PCS[0].linkLED === true && lv.PCS[1].linkLED === true,
    'pc1=' + lv.PCS[0].linkLED + ' pc2=' + lv.PCS[1].linkLED);

  console.log('\n== SKENARIO 3: KONFIGURASI IP & PING ==');
  click(848, DROPDOWN.pc1, 'buka dropdown IP PC1');
  click(OPT('pc1', 0).x, OPT('pc1', 0).y, 'pilih IP PC1');
  click(848, DROPDOWN.pc2, 'buka dropdown IP PC2');
  click(OPT('pc2', 0).x, OPT('pc2', 0).y, 'pilih IP PC2');
  click(848, DROPDOWN.subnet, 'buka dropdown Subnet');
  click(OPT('subnet', 0).x, OPT('subnet', 0).y, 'pilih Subnet');
  ok('IP terkonfigurasi', !!(lv.ipConfig.pc1 && lv.ipConfig.pc2 && lv.ipConfig.subnet),
    lv.ipConfig.pc1 + ' / ' + lv.ipConfig.pc2 + ' / ' + lv.ipConfig.subnet);
  click(BTN_PING_PC2.x, BTN_PING_PC2.y, 'klik Ping PC2');
  ok('ping berhasil', lv.pingResult === 'ok', 'ping=' + lv.pingResult);
  ok('pingPc2 ditandai', lv.pingPc2 === true);
  await wait(1100); frames(3);
  ok('modal "Jaringan berhasil terhubung!" muncul', lv.phase === 'pingSuccess' && lv.modal === 'pingSuccess',
    'phase=' + lv.phase + ' modal=' + lv.modal);

  console.log('\n== SKENARIO 4: LIHAT HASIL -> LAYAR RAPOR ==');
  click(BTN_LANJUT_HASIL.x, BTN_LANJUT_HASIL.y, 'klik Lihat Hasil');
  for (let i = 0; i < 40; i++) { frame(); await wait(50); if (lv.finished) break; }
  ok('level selesai (finished)', lv.finished === true, 'finished=' + lv.finished);
  ok('scene berpindah ke layar hasil', NC.scene() !== lv);
  ok('skor tersimpan di save.best[4]', (NC.save.best[4] || 0) === lv.score, 'best=' + NC.save.best[4]);
  ok('bintang tersimpan', (NC.save.stars[4] || 0) >= 1, 'stars=' + NC.save.stars[4]);
  ok('papan skor board5 terisi', Array.isArray(NC.save.board5) && NC.save.board5.length >= 1,
    'board5=' + (NC.save.board5 || []).length);
  ok('log level 5 tersimpan', NC.save.log.some(e => e.level === 5 && e.hasil === 'Lulus'));
  ok('lencana "Direct Connection" tercatat', (lv.logExtra.lencana || '').includes('Direct Connection'),
    'lencana=' + lv.logExtra.lencana);

  console.log('\n== RINGKASAN TEST PLAY5 ==');
  console.log('frame digambar : ' + drawn);
  console.log('total kegagalan : ' + failures);
  if (failures) { console.log('==> GAGAL'); process.exit(1); }
  console.log('==> SEMUA PENGUJIAN LEVEL 5 LULUS!');
}
run();
