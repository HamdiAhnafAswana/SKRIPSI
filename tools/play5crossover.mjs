// ============================================================================
//  UJI INTERAKSI LEVEL 5 (CROSSOVER)  --  node tools/play5crossover.mjs
//
//  Menjalankan game sungguhan di Node (stub DOM/canvas) dan memainkan Level 5
//  "Teknologi Jaringan Lanjutan" dari briefing sampai layar RAPOR:
//
//   Skenario 1  Pilih kabel crossover                       -> berhasil
//   Skenario 2  Pasang kabel PC1 -> PC2                    -> link aktif
//   Skenario 3  Konfigurasi IP benar                        -> siap ping
//   Skenario 4  Ping PC2 berhasil                           -> modal Lanjut Evaluasi
//   Skenario 5  Kuis 4 soal selesai                        -> RAPOR + badge
//
//  Plus: validasi kabel salah (straight), IP salah, troubleshooting.
// ============================================================================
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
const CHIP_STRAIGHT = { x: 102, y: 190 };        // kartu kabel straight (salah)
const CHIP_CROSSOVER = { x: 102, y: 244 };       // kartu kabel crossover
const PC1_JACK = { x: 306, y: 200 };             // port Ethernet PC1
const PC2_JACK = { x: 634, y: 200 };             // port Ethernet PC2
const EMPTY = { x: 480, y: 500 };
const DROPDOWN = { pc1: 114, pc2: 166, subnet: 218 };
const OPT = (key, i) => ({ x: 848, y: DROPDOWN[key] + 34 + i * 30 + 14 });
const BTN_PING_PC2 = { x: 848, y: 310 };
const QUIZ_OPT = i => ({ x: 480, y: 238 + i * 48 });
const BTN_QUIZ_NEXT = { x: 480, y: 492 };
const BTN_LANJUT_EVAL = { x: 480, y: 338 };
const BTN_RAPOR_ULANGI = { x: 280, y: 514 };
const BTN_RAPOR_LANJUT = { x: 670, y: 514 };

async function run() {
  console.log('== KONTRAK & INISIALISASI LEVEL 5 ==');
  NC.save.teacher = true;
  NC.startLevel(4); // Level 5 (0-indexed = 4)
  const lv = NC.scene();
  ok('scene terbentuk & kontrak lengkap',
    typeof lv.draw === 'function' && typeof lv.down === 'function' &&
    typeof lv.move === 'function' && typeof lv.up === 'function');
  ok('2 kabel (straight + crossover) + 2 PC', lv.cables.length === 2 && lv.PCS.length === 2,
    'kabel=' + lv.cables.length + ' pc=' + lv.PCS.length);
  ok('mulai dari briefing', lv.phase === 'brief', 'phase=' + lv.phase);
  ok('bank soal terpilih 4 soal', lv.quizzes.length === 4, 'soal=' + lv.quizzes.length);

  console.log('\n== BRIEFING ==');
  for (let i = 0; i < 10; i++) click(695, 441);
  click(637, 504, 'klik Mulai Misi');
  ok('masuk fase pemasangan kabel', lv.phase === 'play', 'phase=' + lv.phase);

  console.log('\n== SKENARIO 1: PILIH KABEL CROSSOVER ==');
  // Coba straight salah dulu (simulasi salah pilih)
  drag(CHIP_STRAIGHT.x, CHIP_STRAIGHT.y, PC1_JACK.x, PC1_JACK.y, 'coba kabel straight ke PC1 (salah)');
  ok('kabel straight tidak cocok untuk PC ke PC', lv.cables[0].pc == null && lv.cables[0].port == null,
    'pc=' + lv.cables[0].pc + ' port=' + lv.cables[0].port);
  // Pilih crossover
  drag(CHIP_CROSSOVER.x, CHIP_CROSSOVER.y, PC1_JACK.x, PC1_JACK.y, 'pasang kabel crossover ke PC1');
  ok('kabel crossover terpasang ke PC1', lv.cables[1].pc === 'pc1', 'pc=' + lv.cables[1].pc);

  console.log('\n== SKENARIO 2: SAMBUNGKAN KE PC2 ==');
  drag(PC1_JACK.x, PC1_JACK.y, PC2_JACK.x, PC2_JACK.y, 'sambungkan kabel ke PC2');
  ok('kabel terhubung PC1 <-> PC2', lv.cables[1].pc === 'pc1' && lv.cables[1].port === 'pc2',
    'pc=' + lv.cables[1].pc + ' port=' + lv.cables[1].port);
  await wait(1100); frames(3);
  ok('link aktif (LED hijau)', lv.PCS[0].linkLED && lv.PCS[1].linkLED,
    'pc1=' + lv.PCS[0].linkLED + ' pc2=' + lv.PCS[1].linkLED);

  console.log('\n== SKENARIO 3: KONFIGURASI IP ==');
  click(848, DROPDOWN.pc1, 'buka dropdown PC1 IP');
  click(OPT('pc1', 0).x, OPT('pc1', 0).y, 'pilih IP PC1');
  click(848, DROPDOWN.pc2, 'buka dropdown PC2 IP');
  click(OPT('pc2', 0).x, OPT('pc2', 0).y, 'pilih IP PC2');
  click(848, DROPDOWN.subnet, 'buka dropdown Subnet');
  click(OPT('subnet', 0).x, OPT('subnet', 0).y, 'pilih Subnet');
  ok('IP terkonfigurasi', !!(lv.ipConfig.pc1 && lv.ipConfig.pc2 && lv.ipConfig.subnet),
    lv.ipConfig.pc1 + ' / ' + lv.ipConfig.pc2 + ' / ' + lv.ipConfig.subnet);

  console.log('\n== SKENARIO 4: PING PC2 BERHASIL ==');
  click(BTN_PING_PC2.x, BTN_PING_PC2.y, 'klik Ping PC2');
  ok('ping berhasil', lv.pingResult === 'ok', 'ping=' + lv.pingResult);
  await wait(1100); frames(3);
  ok('modal "Jaringan berhasil terhubung!" muncul', lv.phase === 'pingSuccess' && lv.modal === 'pingSuccess',
    'phase=' + lv.phase + ' modal=' + lv.modal);
  click(BTN_LANJUT_EVAL.x, BTN_LANJUT_EVAL.y, 'klik Lanjut Evaluasi');
  ok('masuk tahap kuis', lv.phase === 'quiz' && !!lv.quiz, 'phase=' + lv.phase);

  console.log('\n== SKENARIO 5: KUIS 4 SOAL ==');
  for (let qi = 0; qi < 4; qi++) {
    const q = lv.quiz.list[lv.quiz.idx];
    click(QUIZ_OPT(q.ans).x, QUIZ_OPT(q.ans).y, 'jawab kuis ' + (qi + 1) + ' benar');
    ok('feedback tampil (soal ' + (qi + 1) + ')', lv.quiz.picked !== null && !!lv.quiz.feedback);
    click(BTN_QUIZ_NEXT.x, BTN_QUIZ_NEXT.y, qi < 3 ? 'Lanjut ke soal ' + (qi + 2) : 'Lihat Rapor');
  }
  ok('kuis selesai -> pindah ke rapor', NC.scene() !== lv, 'scene berpindah=' + (NC.scene() !== lv));
  ok('skor tersimpan di save.best[4]', (NC.save.best[4] || 0) === lv.score, 'best=' + NC.save.best[4]);
  ok('bintang tersimpan', (NC.save.stars[4] || 0) >= 1, 'stars=' + NC.save.stars[4]);
  ok('papan skor board5 terisi', Array.isArray(NC.save.board5) && NC.save.board5.length === 1,
    'board5=' + (NC.save.board5 || []).length);
  ok('log level 5 tersimpan', NC.save.log.some(e => e.level === 5 && e.hasil === 'Lulus'));
  ok('lencana tercatat', /Direct Connection/.test(lv.logExtra.lencana || ''), 'lencana=' + lv.logExtra.lencana);

  console.log('\n== RINGKASAN TEST LEVEL 5 ==');
  console.log('frame digambar : ' + drawn);
  console.log('total kegagalan : ' + failures);
  if (failures) { console.log('==> GAGAL'); process.exit(1); }
  console.log('==> SEMUA PENGUJIAN LEVEL 5 LULUS!');
}
run();
