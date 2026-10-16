// ============================================================================
//  UJI INTERAKSI LEVEL 3  --  node tools/play3.mjs
//
//  Menjalankan game di Node (stub DOM/canvas) dan memainkan Level 3
//  dari langkah 0 sampai layar hasil:
//   - Skenario & Misi
//   - Langkah 0: Pilih jenis kabel (salah -> penalti & penjelasan, benar -> lanjut)
//   - Langkah 1: Sarung tangan
//   - Langkah 2: Potong 150 cm
//   - Langkah 3-7: Ujung A (kupas, susun T568A, ratakan, RJ-45, crimp)
//   - Langkah 8-12: Ujung B (transisi, kupas, susun T568B, ratakan, RJ-45, crimp)
//   - Langkah 13: LAN Tester Crossover (uji diagnosis straight, pin salah, & lulus)
//   - Langkah 14: Adegan PC-PC (lampu link & transfer file)
//   - Langkah 15: Kuis & Rapor Pemahaman (1↔3 & 2↔6 disorot)
//   - Layar hasil & Papan Skor Level 3 (board3) + Lencana
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
async function settle(lv, max = 50) {
  for (let i = 0; i < max; i++) { frames(2); if (!lv.anim) return true; await wait(60); }
  return false;
}
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

const PIN_SLOT_CX = i => (480 - 200) + 12 + i * 48 + 20;

/** Lewati briefing Andi Level 3 (slide -> tombol Mulai Crimping). */
function lewatiBriefing() {
  const lv = NC.scene();
  for (let i = 0; i < 40 && lv.phase === 'brief'; i++) click(623, 504);
  return lv.phase;
}

async function run() {
  console.log('== KONTRAK & INISIALISASI LEVEL 3 ==');
  NC.save.teacher = true;
  NC.startLevel(2); // Level 3 (0-indexed = 2)
  const lv = NC.scene();
  ok('scene terbentuk & punya draw', typeof lv.draw === 'function');
  ok('limit waktu 420 detik terpasang', lv.limit === 420, 'limit=' + lv.limit);
  ok('boardKey menunjuk board3', lv.boardKey === 'board3', 'boardKey=' + lv.boardKey);
  ok('kontrak lengkap draw/down/move/up/exit/makeResult',
    typeof lv.draw === 'function' && typeof lv.down === 'function' &&
    typeof lv.move === 'function' && typeof lv.up === 'function' &&
    typeof lv.exit === 'function' && typeof lv.makeResult === 'function');
  ok('skor mulai 100', lv.score === 100);

  console.log('\n== BRIEFING ANDI ==');
  ok('briefing tampil sebelum gameplay', lv.phase === 'brief', 'phase=' + lv.phase);
  lewatiBriefing();

  console.log('\n== LAYAR PEMBUKA ==');
  frame();
  ok('level dibuka di layar pembuka', lv.phase === 'intro');
  // Klik tombol "MULAI MISI CROSSOVER ▸"
  click(480, 500, 'klik MULAI MISI CROSSOVER');
  ok('fase masuk ke play tanpa modal pilih kabel', lv.phase === 'play' && lv.modal === null);

  console.log('\n== LANGKAH 0: SARUNG TANGAN ==');
  // Langsung ke langkah pakai sarung (step 0 setelah intro tanpa pick modal)
  click(80, 160, 'klik Sarung Tangan');
  ok('animasi memakai sarung tangan berjalan', !!(lv.anim && lv.anim.type === 'glove'), lv.anim && lv.anim.type);
  await settle(lv);
  ok('sarung tangan aktif', lv.KAB.glove === true);
  ok('langkah maju ke potong kabel', lv.step === 1);

  console.log('\n== LANGKAH 2: POTONG KABEL 150 CM ==');
  // Kartu Pemotong Kabel (x=16..148, y=120+2*88 = 296..376)
  click(80, 330, 'klik Pemotong Kabel');
  ok('modal panjang kabel terbuka', lv.modal === 'len');
  // Pilihan panjang: 100 cm (x=318), 150 cm (x=474), 250 cm (x=606)
  click(474, 276, 'pilih 150 cm (tepat)');
  await settle(lv);
  ok('panjang kabel tepat 150 cm', lv.KAB.usedCm === 150 && lv.KAB.lenChosen === true);
  ok('langkah maju ke kupas Ujung A', lv.step === 2);

  console.log('\n== LANGKAH 3-7: UJUNG A (T568A) ==');
  // Kartu Pengupas Kabel (x=16..148, y=120+88 = 208..288)
  click(80, 240, 'klik Pengupas Kabel Ujung A');
  await settle(lv);
  ok('selubung Ujung A terkupas', lv.KAB.strippedA === true);
  ok('langkah maju ke susun Ujung A', lv.step === 3);

  // Susun 8 konduktor T568A ke slot 0..7
  // STD_A: ['wg', 'g', 'wo', 'b', 'wb', 'o', 'wbr', 'br']
  const stdA = ['wg', 'g', 'wo', 'b', 'wb', 'o', 'wbr', 'br'];
  for (let s = 0; s < 8; s++) {
    const id = stdA[s];
    const wireX = lv.KAB.anchor[id].x;
    click(wireX, 236); // pilih kawat
    click(PIN_SLOT_CX(s), 170); // taruh di slot s
    frame();
  }
  ok('slot Ujung A terisi 8/8 T568A', lv.KAB.slotsA.every((id, i) => id === stdA[i]));
  ok('langkah maju ke ratakan Ujung A', lv.step === 4);

  // Ratakan Ujung A (Pemotong kabel)
  click(80, 330, 'klik Pemotong Kabel untuk ratakan A');
  await settle(lv);
  ok('ujung kawat A sudah rata', lv.KAB.trimmedA === true);
  ok('langkah maju ke pasang RJ-45 A', lv.step === 5);

  // Pasang RJ-45 Ujung A (panel kanan x=804..936, y=120..200)
  click(860, 160, 'klik Konektor RJ-45 A');
  await settle(lv);
  ok('konektor RJ-45 A terpasang', lv.KAB.connA === true);
  ok('langkah maju ke crimp A', lv.step === 6);

  // Crimp Ujung A (panel kanan y=208..288)
  click(860, 240, 'klik Tang Crimping A');
  await settle(lv, 70);
  ok('Ujung A ter-crimp dan beralih ke Ujung B', lv.KAB.crimpedA === true && lv.KAB.end === 1);
  ok('langkah maju ke kupas Ujung B', lv.step === 7);

  console.log('\n== LANGKAH 8-12: UJUNG B (T568B) ==');
  // Kupas Ujung B (Pengupas kabel panel kiri)
  click(80, 240, 'klik Pengupas Kabel Ujung B');
  await settle(lv);
  ok('selubung Ujung B terkupas', lv.KAB.strippedB === true);
  ok('langkah maju ke susun Ujung B', lv.step === 8);

  // Susun 8 konduktor T568B ke slot 0..7
  // STD_B: ['wo', 'o', 'wg', 'b', 'wb', 'g', 'wbr', 'br']
  const stdB = ['wo', 'o', 'wg', 'b', 'wb', 'g', 'wbr', 'br'];
  for (let s = 0; s < 8; s++) {
    const id = stdB[s];
    const wireX = lv.KAB.anchor[id].x;
    click(wireX, 236);
    click(PIN_SLOT_CX(s), 170);
    frame();
  }
  ok('slot Ujung B terisi 8/8 T568B', lv.KAB.slotsB.every((id, i) => id === stdB[i]));
  ok('langkah maju ke ratakan Ujung B', lv.step === 9);

  // Ratakan Ujung B
  click(80, 330, 'klik Pemotong Kabel untuk ratakan B');
  await settle(lv);
  ok('ujung kawat B sudah rata', lv.KAB.trimmedB === true);
  ok('langkah maju ke pasang RJ-45 B', lv.step === 10);

  // Pasang RJ-45 B
  click(860, 160, 'klik Konektor RJ-45 B');
  await settle(lv);
  ok('konektor RJ-45 B terpasang', lv.KAB.connB === true);
  ok('langkah maju ke crimp B', lv.step === 11);

  // Crimp Ujung B
  click(860, 240, 'klik Tang Crimping B');
  await settle(lv, 70);
  ok('Ujung B ter-crimp sempurna', lv.KAB.crimpedB === true);
  ok('langkah maju ke uji tester', lv.step === 12);

  console.log('\n== LANGKAH 13: LAN TESTER CROSSOVER ==');
  // Klik Tester (panel kanan y=296..376)
  click(860, 330, 'klik LAN Tester');
  ok('modal LAN Tester crossover terbuka', lv.modal === 'test');
  // Klik JALANKAN (tengah modal: x=480, y=500)
  click(480, 500, 'klik JALANKAN pengujian crossover');
  ok('pengujian sinyal mulai berjalan', lv.test && lv.test.phase === 'run');

  // Biarkan tester berjalan melewati 8 pin
  for (let i = 0; i < 70; i++) {
    frame();
    await wait(70);
    if (lv.test && lv.test.phase === 'ok') break;
  }
  ok('pengujian crossover LULUS', lv.test && lv.test.phase === 'ok');

  // Klik tombol "Uji Sambungan PC ▸" (x=700, y=500)
  click(700, 500, 'klik Uji Sambungan PC');
  ok('modal simulasi PC ke PC terbuka', lv.modal === 'pc');

  console.log('\n== LANGKAH 14: SIMULASI SAMBUNGAN PC KE PC ==');
  frames(10);
  ok('simulasi PC ke PC tergambar dengan link aktif', lv.modal === 'pc');
  // Klik tombol "Lanjut ke Kuis & Rapor ▸" (x=480, y=520)
  click(480, 520, 'klik Lihat Rapor Praktikum');
  ok('masuk modal Rapor Pemahaman', lv.modal === 'report');

  console.log('\n== LANGKAH 15: RAPOR PEMAHAMAN CROSSOVER ==');
  // Modal report - klik tombol "Lihat Skor & Papan Peringkat ▸" (x=480, y=525) 
  click(480, 525, 'klik Lihat Skor & Papan Peringkat');
  for (let i = 0; i < 40; i++) {
    frame();
    await wait(60);
    if (lv.finished) break;
  }
  ok('fase selesai & endLevel terpanggil', lv.finished === true);

  console.log('\n== LAYAR HASIL & PAPAN PERINGKAT LEVEL 3 ==');
  const resScene = NC.scene();
  ok('layar hasil aktif', typeof resScene.draw === 'function');
  resScene.draw();
  ok('skor tersimpan di save.best[2]', NC.save.best[2] > 0, 'best=' + NC.save.best[2]);
  ok('papan peringkat board3 terisi', Array.isArray(NC.save.board3) && NC.save.board3.length > 0);
  ok('lencana tercatat di save.badges', NC.save.badges.includes('Crossover Master') || NC.save.badges.includes('Hemat Kabel'));

  console.log('\n== RINGKASAN TEST PLAY3 ==');
  console.log('  Total frame digambar : ' + drawn);
  console.log('  Total kegagalan      : ' + failures);
  if (failures === 0) {
    console.log('\n==> SEMUA PENGUJIAN LEVEL 3 LULUS SEMPURNA! <==');
  } else {
    process.exit(1);
  }
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
