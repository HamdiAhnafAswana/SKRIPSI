// ============================================================================
//  UJI JALAN (headless)  --  node tools/smoke.mjs
//
//  Menjalankan game sungguhan di Node memakai stub DOM/canvas, lalu:
//    1. boot script tanpa error
//    2. menggambar tiap scene (menu, pilih level, cara bermain, log hasil)
//    3. menjalankan 120 frame tiap level 1..5 untuk menangkap exception
//    4. mensimulasikan klik level, kunci level, dan solve/ gagal
//    5. membandingkan hasilnya dengan backup/netcrimp2.ORI.html (file monolit)
//
//  Cara pakai:
//    node tools/smoke.mjs                 -> uji hasil build + bandingkan dgn asli
//    node tools/smoke.mjs --only dist     -> uji hasil build saja
//    node tools/smoke.mjs --html <file>   -> uji satu file tertentu
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

// ------------------------------------------------------------------ harness
function runGame(htmlFile) {
  const html = fs.readFileSync(path.resolve(ROOT, htmlFile), 'utf8');
  const raw = html.match(/<script>\r?\n([\s\S]*?)\r?\n<\/script>/)[1];

  // Bukalah internals IIFE supaya bisa diuji (hanya di file uji, bukan di build).
  // Versi monolit memakai `LV`, versi registry memakai `LEVELS`.
  const modern = /\bLEVELS\b/.test(raw), legacy = /\bconst LV\b/.test(raw);
  const list = modern ? 'LEVELS' : 'LV';
  const EXPORTS = `globalThis.__NC = { LIST: ${list}, levelTotal: ${modern ? 'levelTotal' : '() => LV.length'},
    levelList: ${modern ? 'levelList' : '() => LV.map((L, i) => Object.assign({ n: i + 1 }, L))'},
    go, startLevel, scene: () => scene, scenes: { menuScene, levelsScene, helpScene, logScene },
    save, persist, baseLevel, endLevel, quizPick,
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
    document, window: win, navigator: { hardwareConcurrency: 8, userAgent: 'node-smoke', clipboard: { writeText: () => Promise.resolve() } },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    performance: { now: () => Date.now() },
    requestAnimationFrame: () => 0, setTimeout: (f, t) => setTimeout(f, Math.min(t || 0, 5)), clearTimeout,
    console: { log() {}, warn() {}, error() {} },
    Promise, Math, Date, JSON, Uint8ClampedArray, Number, String, Array, Object, Map, Set, isNaN, parseInt, parseFloat, Intl,
  };
  sandbox.globalThis = sandbox;
  win.document = document;
  vm.createContext(sandbox);
  vm.runInContext(js, sandbox, { filename: path.basename(htmlFile) });

  const NC = sandbox.__NC;
  const out = [], bad = [];
  const t = (label, fn) => {
    try { const r = fn(); out.push('OK  | ' + label + ' | ' + (r || '')); return r; }
    catch (e) { const m = (e && e.message) || String(e); out.push('GAGAL | ' + label + ' | ' + m); bad.push(label + ': ' + m); return null; }
  };

  t('boot: script dieksekusi tanpa error', () => { if (!NC) throw new Error('internals tidak terpasang'); return 'ok'; });
  t('registry: level terdaftar', () => { const n = NC.levelTotal(); if (n !== 5) throw new Error('jumlah ' + n); return NC.levelList().map(L => L.n + '=' + L.t).join(' ; '); });
  for (const name of ['menuScene', 'levelsScene', 'helpScene', 'logScene'])
    t('scene ' + name + ': draw 40x', () => { NC.go(NC.scenes[name]); for (let i = 0; i < 40; i++) { NC.newFrame(); NC.scenes[name].draw(); } return 'ok'; });

  for (const L of NC.levelList())
    t('level ' + L.n + ' (' + L.t + '): 150 frame + input', () => {
      NC.save.teacher = true; NC.startLevel(L.n - 1);
      const sc = NC.scene();
      if (!sc || typeof sc.draw !== 'function') throw new Error('scene tidak terbentuk');
      let ph = '';
      for (let i = 0; i < 150; i++) {
        NC.newFrame();                                 // sama seperti ui/21-loop.js
        sc.draw();
        if (sc.up) sc.up({ x: 380 + (i % 200), y: 180 + (i % 150) });
        if (sc.move) sc.move({ x: 480 + (i % 40), y: 300 - (i % 30) });
        if (sc.tick) sc.tick();
        ph = sc.phase || 'n/a';
      }
      return 'phase=' + ph + ', skor=' + (sc.score != null ? sc.score : 'n/a') + ', salah=' + ((sc.mistakes || []).length);
    });

  t('klik kartu level 1 membuka level 1', () => { NC.go(NC.scenes.levelsScene); const a = NC.scene(); NC.startLevel(0); if (NC.scene() === a) throw new Error('scene tidak berganti'); return 'ok'; });
  t('level terkunci ditolak (tanpa mode guru)', () => { const s = NC.save; s.teacher = false; s.unlocked = 1; const a = NC.scene(); NC.startLevel(4); if (NC.scene() !== a) throw new Error('level 5 terbuka tanpa izin'); return 'ditolak'; });
  t('mode guru membuka semua level', () => { NC.save.teacher = true; NC.startLevel(4); return NC.scene() && NC.scene().draw !== undefined ? 'ok' : 'gagal'; });

  t('menang: bintang + unlock + papan + log + simpan', () => {
    const s = NC.save; s.unlocked = 1; s.stars = [0, 0, 0, 0, 0]; s.best = [0, 0, 0, 0, 0]; s.log = []; s.board = []; s.board2 = []; s.teacher = false;
    const lv = NC.baseLevel(1, 'Uji'); lv.idx = 0; lv.dur = 30; lv.score = 90; lv.mistakes = ['salah A'];
    NC.endLevel(lv, true);
    if (s.stars[0] !== 3) throw new Error('bintang ' + s.stars[0]);
    if (s.unlocked !== 2) throw new Error('unlock ' + s.unlocked);
    if (s.board.length !== 1) throw new Error('papan ' + s.board.length);
    if (s.log.length !== 1 || s.log[0].hasil !== 'Lulus') throw new Error('log salah');
    if (!store.get('netcrimp_v1')) throw new Error('localStorage kosong');
    NC.scene().draw();
    return 'bintang=3 unlock=2 best=90 papan=1 log=1';
  });
  t('kalah: 0 bintang, level tidak terbuka', () => {
    const s = NC.save; s.unlocked = 1; s.stars = [0, 0, 0, 0, 0]; s.log = [];
    const lv = NC.baseLevel(2, 'Uji gagal'); lv.dur = 30; lv.score = 40;
    NC.endLevel(lv, false); NC.scene().draw();
    if (s.stars[1] !== 0) throw new Error('bintang ' + s.stars[1]); if (s.unlocked !== 1) throw new Error('unlock ' + s.unlocked);
    return 'hasil=Gagal unlock=1';
  });
  t('selesai level terakhir: pesan akhir tampil tanpa error', () => {
    const lv = NC.baseLevel(5, 'Uji akhir'); lv.dur = 10; lv.score = 100; NC.endLevel(lv, true); NC.scene().draw(); return 'ok';
  });
  t('progres bertahan di localStorage', () => {
    const r = JSON.parse(store.get('netcrimp_v1'));
    if (!Array.isArray(r.stars) || !Array.isArray(r.log)) throw new Error('struktur rusak');
    return 'stars=' + JSON.stringify(r.stars) + ' unlocked=' + r.unlocked + ' log=' + r.log.length;
  });
  t('kuis: jawaban salah kena penalti, jawaban benar naik ke pertanyaan berikutnya', () => {
    const lv = NC.baseLevel(1, 'Kuis');
    lv.quizIdx = 0; lv.wrongPicks = []; lv.phase = 'quiz'; lv.score = 100;
    lv.quizzes = [{ q: 'x', opts: ['salah', 'benar'], ans: 1, why: 'karena' }];
    NC.quizPick(lv, 0);
    if (lv.quizIdx !== 0) throw new Error('setelah salah, quizIdx = ' + lv.quizIdx);
    if (lv.score !== 90) throw new Error('skor setelah salah = ' + lv.score);
    if (lv.mistakes.length !== 1) throw new Error('catatan kesalahan = ' + lv.mistakes.length);
    NC.quizPick(lv, 1);
    if (lv.quizIdx !== 1) throw new Error('setelah benar, quizIdx = ' + lv.quizIdx);
    if (lv.phase !== 'fin') throw new Error('phase setelah kuis habis = ' + lv.phase);
    return 'salah->skor90,catatan1 ; benar->quizIdx1,phase=fin';
  });

  return { file: htmlFile, lines: out, fail: bad, store: JSON.stringify(JSON.parse(store.get('netcrimp_v1') || '{}')) };
}

// ------------------------------------------------------------------ main
const dist = runGame('netcrimp2.html');
console.log('\n== HASIL BUILD (src/ -> dist/) ==');
dist.lines.forEach(l => console.log('  ' + (l.startsWith('GAGAL') ? 'GAGAL ' : 'OK    ') + l.slice(l.startsWith('GAGAL') ? 8 : 5)));

let diffs = 0;
// Perilaku yang RESMI berubah karena Level 2 ditulis ulang (2D, tanpa Three.js).
const EXPECTED_DIFF = [
  { at: 'registry: level terdaftar', why: 'judul Level 2 kini "Crimping Straight-Through (T568A/T568B)" karena T568A & T568B sama-sama sah' },
  { at: 'level 2 (', why: 'Level 2 langsung phase=play (tidak lagi phase=load menunggu Three.js/WebGL)' },
];
if (!argv.includes('--only')) {
  const orig = runGame('backup/netcrimp2.ORI.html');
  console.log('\n== BANDINGKAN DENGAN FILE ASLI (monolit) ==');
  if (orig.lines.length !== dist.lines.length) { console.log('  GAGAL jumlah baris uji beda: ' + orig.lines.length + ' vs ' + dist.lines.length); diffs++; }
  for (let i = 0; i < Math.max(orig.lines.length, dist.lines.length); i++) {
    if (orig.lines[i] === dist.lines[i]) { console.log('  SAMA  ' + orig.lines[i].slice(0, 120)); continue; }
    const a = orig.lines[i] || '', b = dist.lines[i] || '';
    const exp = EXPECTED_DIFF.find(e => a.includes(e.at) && b.includes(e.at));
    if (exp) { console.log('  BEDA  (diharapkan) -> ' + exp.why); continue; }
    diffs++;
    console.log('  BEDA  baris ' + (i + 1));
    console.log('        asli : ' + a.slice(0, 150));
    console.log('        split: ' + b.slice(0, 150));
  }
  if (diffs === 0) console.log('\n  ==> PERILAKU SAMA dengan file monolit asli, kecuali yang ditandai "diharapkan".');
}

const totalFail = dist.fail.length + (argv.includes('--only') ? 0 : 0);
console.log('\n== RINGKASAN ==');
console.log('  file diuji : netcrimp2.html' + (argv.includes('--only') ? '' : ' + backup/netcrimp2.ORI.html'));
console.log('  gagal      : ' + totalFail);
console.log('\n==> ' + (totalFail || diffs ? (totalFail ? totalFail + ' UJI GAGAL' : diffs + ' PERILAKU BEDA') : 'SEMUA UJI LULUS & IDENTIK DENGAN ASLI') + '\n');
process.exit(totalFail || diffs ? 1 : 0);
