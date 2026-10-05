// ============================================================================
//  UJI INTERAKSI LEVEL 2  --  node tools/play2.mjs
//
//  Menjalankan game sungguhan di Node (stub DOM/canvas) lalu MEMAIKAN level 2
//  seperti pemain sungguhan: klik kartu alat, susun/seret konduktor ke slot,
//  pilih panjang, crimping, jalankan tester, kirim hasil.
//  Semua error akan tampil di sini.
//
// -tested: alur utama (klik-klik), alur seret (drag), modal bawah,
//  penalti RJ-45 sebelum diratakan, tester GAGAL -> ulang, layar hasil.
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'netcrimp2.html'), 'utf8');
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
vm.runInContext(js, sandbox, { filename: 'netcrimp2.html' });

const NC = sandbox.__NC;
const wait = ms => new Promise(r => setTimeout(r, ms));

let drawn = 0, failures = 0;
function frame() {
  NC.newFrame();                       // sama seperti ui/21-loop.js: btns dibersihkan tiap frame
  const sc = NC.scene(); sc.draw(); if (sc.tick) sc.tick(); drawn++;
}
function frames(n) { for (let i = 0; i < n; i++) frame(); }
/** Tunggu sampai animasi level selesai (sama seperti loop render sungguhan). */
async function settle(lv, max = 40) {
  for (let i = 0; i < max; i++) { frames(2); if (!lv.anim) return true; await wait(70); }
  return false;
}
function ok(label, cond, extra) {
  if (!cond) failures++;
  console.log((cond ? '  OK    ' : '  GAGAL ') + label + (extra ? '   [' + extra + ']' : ''));
}

/** Klik persis seperti core/06-input.js: hit dulu, baru scene.down. */
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
/** Seret: pointerdown -> beberapa pointermove -> pointerup. */
function drag(x0, y0, x1, y1, label) {
  const sc = NC.scene();
  NC.mouse().x = x0; NC.mouse().y = y0; frame();
  if (sc.down) sc.down({ x: x0, y: y0 });
  for (let i = 1; i <= 6; i++) {
    const t = i / 6, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    NC.mouse().x = x; NC.mouse().y = y;
    if (sc.move) sc.move({ x, y });
    frame();
  }
  if (sc.up) sc.up({ x: x1, y: y1 });
  frame();
  if (label) ok(label, true);
}

/* ---------- koordinat layout level 2 (sama persis dengan src) ---------- */
const INTRO_MULAI = { x: 480, y: 52 + 430 + 23 };       // tombol MULAI di layar pembuka
const CARD_L = i => ({ x: 86, y: 120 + i * 88 });    // ALAT   (kiri, 16..156)
const CARD_R = i => ({ x: 874, y: 120 + i * 88 });   // PASANG (kanan, 804..944)
const STRIP = { langkah: { x: 74, y: 70 }, bantuan: { x: 208, y: 70 }, mudah: { x: 339, y: 70 } };
const PIN = { x: 280, y: 92, w: 400 };
const SLOT_W = 36, SLOT_GAP = 8;
const PIN_PADX = (PIN.w - (SLOT_W * 8 + SLOT_GAP * 7)) / 2;   // 28
const slotCX = i => PIN.x + PIN_PADX + i * (SLOT_W + SLOT_GAP) + SLOT_W / 2;
const SLOT_MID = 150;            // tengah zona slot pin (118..182)
const LOOSE_Y = 306;             // di dalam jangkauan konduktor berdiri
const CX = 480, CON_STEP = 24;
const BASE_X0 = 396;
const looseX = i => BASE_X0 + i * CON_STEP;
// modal panjang: x=270,y=170; tombol 108x52 di (x+26+i*120, y+80)
const LEN_MODAL_BTN_40 = { x: 270 + 26 + 120 + 54, y: 170 + 80 + 26 };
// modal tester: x=200,y=120,w=560,h=380; baris tombol by=y+h-58
const TESTER_RUN = { x: 200 + 280 - 76, y: 120 + 380 - 58 + 22 };
const TESTER_SEND = { x: 200 + 560 - 24 - 152 + 76, y: 120 + 380 - 58 + 22 };
const LEARN_NEXT = { x: 480, y: 62 + 452 - 58 + 22 };
const MODAL_TUTUP = { langkah: { x: 480, y: 62 + 440 - 52 + 19 }, bantuan: { x: 480, y: 52 + 496 - 50 + 19 } };

/** Buka level 2 lalu tekan MULAI di layar pembuka. */
function mulaiLevel() {
  NC.startLevel(1);
  const s = NC.scene();
  frame();
  click(INTRO_MULAI.x, INTRO_MULAI.y);
  return s;
}

/** Susun 8 slot sesuai standar, pakai klik-klik (klik wire lalu klik slot). */
const STD = { T568B: ['wo', 'o', 'wg', 'b', 'wb', 'g', 'wbr', 'br'], T568A: ['wg', 'g', 'wo', 'b', 'wb', 'o', 'wbr', 'br'] };
function susunKlik(lv, std) {
  for (let i = 0; i < 8; i++) {
    const src = lv.KAB.loose.indexOf(std[i]);
    click(looseX(src), LOOSE_Y);
    click(slotCX(i), SLOT_MID);
  }
  frames(4);
  return lv.KAB.slots.join(',') === std.join(',');
}
/** Susun 8 slot dengan cara seret dari konduktor berdiri ke slot. */
function susunSeret(lv, std) {
  for (let i = 0; i < 8; i++) {
    const src = lv.KAB.loose.indexOf(std[i]);
    drag(looseX(src), LOOSE_Y, slotCX(i), SLOT_MID);
  }
  frames(4);
  return lv.KAB.slots.join(',') === std.join(',');
}
/** Susun dengan sengaja salah (tukar pin 2 & 3) supaya tester pasti gagal. */
function susunSalah(lv) {
  const w = STD.T568B.slice();
  const t = w[1]; w[1] = w[2]; w[2] = t;
  return susunKlik(lv, w);
}

async function main() {
  console.log('\n== KONTRAK LEVEL 2 ==');
  NC.save.teacher = true; NC.save.unlocked = 5;
  NC.startLevel(1);
  let sc = NC.scene();
  frames(3);
  ok('scene terbentuk & punya draw', !!(sc && sc.draw));
  ok('limit waktu terpasang', sc.limit > 0, 'limit=' + sc.limit + ' detik');
  ok('kontrak lengkap draw/down/move/up/exit/makeResult',
    ['draw', 'down', 'move', 'up', 'exit', 'makeResult'].every(k => typeof sc[k] === 'function'));
  ok('skor mulai 100', sc.score === 100, 'skor=' + sc.score);
  ok('lv.quizzes tersedia untuk kuis', Array.isArray(sc.quizzes) && sc.quizzes.length >= 1, sc.quizzes.length + ' soal');
  ok('lv.idx menunjuk level 2 (tombol Ulangi)', sc.idx === 1);

  console.log('\n== LAYAR PEMBUKA ==');
  ok('level dibuka di layar pembuka', sc.phase === 'intro', 'phase=' + sc.phase);
  ok('daftar 6 alat tersedia untuk siswa', sc.tools.length === 6, sc.tools.length + ' alat');
  click(INTRO_MULAI.x, INTRO_MULAI.y, 'tekan MULAI');
  ok('fase masuk ke play', sc.phase === 'play', 'phase=' + sc.phase);

  console.log('\n== ALUR UTAMA (klik-klik) ==');
  click(CARD_L(0).x, CARD_L(0).y, '1. klik Sarung Tangan');
  ok('toast "Sarung tangan HIDUP"', !!sc.flash && /Sarung tangan HIDUP/.test(sc.flash.msg), sc.flash && sc.flash.msg);
  await settle(sc); frames(4);
  ok('langkah -> Kupas selubung', sc.step === 1, 'step=' + sc.step);

  click(CARD_L(1).x, CARD_L(1).y, '2. klik Pengupas Kabel');
  await settle(sc); frames(4);
  ok('langkah -> Susun warna', sc.step === 2, 'step=' + sc.step);

  const s0 = sc.score;
  click(CARD_R(1).x, CARD_R(1).y, '   klik Tang Crimping terlalu dini');
  ok('alat belum waktunya = penalti (bukan diam)', sc.score < s0, s0 + ' -> ' + sc.score);

  ok('3. susun 8 warna T568B (klik-klik)', susunKlik(sc, STD.T568B));
  ok('slot terisi sesuai T568B', sc.KAB.slots.join(',') === STD.T568B.join(','), sc.KAB.slots.join(','));
  await settle(sc); frames(4);
  ok('kabel berpindah ke kotak RJ-45', sc.inBox >= 1, 'inBox=' + sc.inBox);
  ok('langkah -> Potong panjang & ratakan', sc.step === 3, 'step=' + sc.step);

  click(CARD_L(2).x, CARD_L(2).y, '4. klik Pemotong Kabel');
  ok('modal panjang kabel terbuka', sc.modal === 'len', 'modal=' + sc.modal);
  click(LEN_MODAL_BTN_40.x, LEN_MODAL_BTN_40.y, '   pilih 40 cm (tepat)');
  await settle(sc); frames(4);
  ok('langkah -> Pasang konektor RJ45', sc.step === 4, 'step=' + sc.step);

  click(CARD_R(0).x, CARD_R(0).y, '5. klik Konektor RJ45');
  await settle(sc); frames(4);
  ok('langkah -> Crimp dengan tang', sc.step === 5, 'step=' + sc.step);

  click(CARD_R(1).x, CARD_R(1).y, '6. klik Tang Crimping');
  await settle(sc); frames(4);
  ok('langkah -> Uji dengan LAN Tester', sc.step === 6, 'step=' + sc.step);

  click(CARD_R(2).x, CARD_R(2).y, '7. klik Tester');
  ok('modal LAN TESTER terbuka', sc.modal === 'test', 'modal=' + sc.modal);
  click(TESTER_RUN.x, TESTER_RUN.y, '   klik JALANKAN');
  ok('LED mulai menyala berurutan', sc.test && sc.test.phase === 'run', 'phase=' + (sc.test && sc.test.phase));
  await wait(3200); frames(6);
  ok('tester LULUS (T568A atau T568B)', sc.test && sc.test.phase === 'ok',
    'phase=' + (sc.test && sc.test.phase) + ' std=' + (sc.test && sc.test.std));
  click(TESTER_SEND.x, TESTER_SEND.y, '   klik KIRIM & NILAI');
  ok('kartu "Yang kamu pelajari" tampil', sc.modal === 'learn', 'modal=' + sc.modal);
  click(LEARN_NEXT.x, LEARN_NEXT.y, '   klik Lanjut ke Kuis');
  ok('masuk tahap kuis', sc.phase === 'quiz', 'phase=' + sc.phase);
  frames(8);
  ok('layar kuis tampil tanpa error', true);

  console.log('\n== SERET (drag) SEBAGAI CARA LAIN ==');
  sc = mulaiLevel();
  click(CARD_L(0).x, CARD_L(0).y); await settle(sc); frames(2);
  click(CARD_L(1).x, CARD_L(1).y); await settle(sc); frames(2);
  ok('drag juga bisa mengisi semua slot (T568A)', susunSeret(sc, STD.T568A));
  await settle(sc); frames(4);
  ok('kabel berpindah ke kotak RJ-45 setelah seret', sc.inBox >= 1, 'inBox=' + sc.inBox);
  ok('langkah -> Potong panjang', sc.step === 3, 'step=' + sc.step);

  console.log('\n== MODAL BAWAH ==');
  sc = mulaiLevel();
  click(STRIP.langkah.x, STRIP.langkah.y, 'tombol Langkah-langkah');
  ok('modal langkah terbuka', sc.modal === 'steps', 'modal=' + sc.modal);
  click(MODAL_TUTUP.langkah.x, MODAL_TUTUP.langkah.y, '   tombol Tutup');
  ok('modal langkah tertutup', sc.modal === null, 'modal=' + sc.modal);
  click(STRIP.bantuan.x, STRIP.bantuan.y, 'tombol Bantuan Kabel (pertama, gratis)');
  ok('modal bantuan terbuka', sc.modal === 'help', 'modal=' + sc.modal);
  click(MODAL_TUTUP.bantuan.x, MODAL_TUTUP.bantuan.y, '   tombol Tutup');
  ok('bantuan pertama tidak kena penalti', sc.score === 100, 'skor=' + sc.score);
  click(STRIP.bantuan.x, STRIP.bantuan.y, 'tombol Bantuan Kabel kedua');
  ok('modal bantuan terbuka lagi', sc.modal === 'help', 'modal=' + sc.modal);
  ok('bantuan kedua kena penalti', sc.score === 95, 'skor=' + sc.score);
  click(MODAL_TUTUP.bantuan.x, MODAL_TUTUP.bantuan.y, '   tombol Tutup');
  const mm = sc.modeMudah;
  click(STRIP.mudah.x, STRIP.mudah.y, 'toggle Mode Mudah');
  ok('mode mudah berubah', sc.modeMudah !== mm, 'modeMudah=' + sc.modeMudah);
  frames(20);

  console.log('\n== PENALTI KONEKTOR SEBELUM DIRATAKAN ==');
  sc = mulaiLevel();
  click(CARD_L(0).x, CARD_L(0).y); await settle(sc); frames(2);
  click(CARD_L(1).x, CARD_L(1).y); await settle(sc); frames(2);
  ok('susun T568B untuk diuji penalti konektor', susunKlik(sc, STD.T568B));
  await settle(sc); frames(2);
  ok('sudah sampai langkah ratakan', sc.step === 3, 'step=' + sc.step);
  const s1 = sc.score;
  click(CARD_R(0).x, CARD_R(0).y, 'klik RJ45 tanpa ratakan');
  ok('RJ45 tanpa ratakan kena penalti -8', sc.score === s1 - 8, s1 + ' -> ' + sc.score);
  ok('langkah TIDAK maju (harus ratakan dulu)', sc.step === 3, 'step=' + sc.step);
  ok('penalti RJ45 tercatat di mistakes', sc.mistakes.some(m => /belum diratakan/.test(m)), sc.mistakes.join(' | '));
  click(CARD_L(2).x, CARD_L(2).y, 'klik Pemotong Kabel (perbaiki)');
  click(LEN_MODAL_BTN_40.x, LEN_MODAL_BTN_40.y, '   pilih 40 cm');
  await settle(sc); frames(2);
  ok('setelah diratkan, langkah -> pasang RJ45', sc.step === 4, 'step=' + sc.step);
  click(CARD_R(0).x, CARD_R(0).y, 'klik RJ45 lagi (sah)');
  await settle(sc); frames(2);
  ok('RJ45 sekarang diterima', sc.step === 5, 'step=' + sc.step);

  console.log('\n== TESTER GAGAL -> ULANG DARI SUSUN WARNA ==');
  sc = mulaiLevel();
  click(CARD_L(0).x, CARD_L(0).y); await settle(sc); frames(2);
  click(CARD_L(1).x, CARD_L(1).y); await settle(sc); frames(2);
  ok('susun T568B dengan sengaja salah 1 pin', susunSalah(sc));
  await settle(sc); frames(2);
  click(CARD_L(2).x, CARD_L(2).y); click(LEN_MODAL_BTN_40.x, LEN_MODAL_BTN_40.y); await settle(sc); frames(2);
  click(CARD_R(0).x, CARD_R(0).y); await settle(sc); frames(2);
  click(CARD_R(1).x, CARD_R(1).y); await settle(sc); frames(2);
  const rjBefore = sc.KAB.rj45Used;
  click(CARD_R(2).x, CARD_R(2).y, 'buka tester');
  click(TESTER_RUN.x, TESTER_RUN.y, '   JALANKAN');
  await wait(3200); frames(6);
  ok('tester menolak (reset ke langkah susun warna)', sc.step === 2 && sc.inBox === 0,
    'step=' + sc.step + ' inBox=' + sc.inBox);
  ok('modal tester tetap terbuka & menyebut pin salah', sc.modal === 'test' && sc.test.bad.length === 2,
    'pin salah: ' + ((sc.test && sc.test.bad) || []).join(','));
  ok('konektor lama dibuang -> RJ45 +1 lagi', sc.KAB.rj45Used === rjBefore + 1,
    rjBefore + ' -> ' + sc.KAB.rj45Used);
  ok('8 slot dikosongkan lagi', sc.KAB.slots.every(v => v === null));
  ok('penalti gagal uji tercatat', sc.mistakes.some(m => /Gagal uji/.test(m)), sc.mistakes.join(' | '));
  click(TESTER_RUN.x, TESTER_RUN.y, '   klik Perbaiki & Ulang');
  ok('modal tester ditutup, siap susun ulang', sc.modal === null, 'modal=' + sc.modal);
  ok('bisa langsung menyusun ulang (T568B)', susunKlik(sc, STD.T568B));
  await settle(sc); frames(2);
  ok('susunan ulang diterima', sc.step === 3, 'step=' + sc.step);

  console.log('\n== LAYAR HASIL ==');
  sc = mulaiLevel();
  sc.score = 88; sc.dur = 120;
  sc.makeResult(sc, true, 3, true).draw();
  frames(4);
  ok('layar hasil tergambar tanpa error', true);
  ok('lencana tersimpan di save.badges', NC.save.badges.length > 0, NC.save.badges.join(', '));
  ok('progres tersimpan di localStorage', !!store.get('netcrimp_v1'));
  const saved = JSON.parse(store.get('netcrimp_v1'));
  ok('lencana ikut ditulis ke storage', Array.isArray(saved.badges), JSON.stringify(saved.badges));

  console.log('\n== RINGKASAN ==');
  console.log('  frame digambar : ' + drawn);
  console.log('  gagal          : ' + failures);
  console.log('\n==> ' + (failures ? failures + ' UJI GAGAL' : 'SEMUA UJI INTERAKSI LULUS') + '\n');
  process.exit(failures ? 1 : 0);
}

main().catch(e => { console.log('\nERROR FATAL:\n' + (e.stack || e)); process.exit(1); });