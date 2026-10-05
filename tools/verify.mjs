// ============================================================================
//  VERIFIKASI BUILD  --  node tools/verify.mjs
//
//  Membuktikan bahwa pemecahan file + registry level TIDAK mengubah game:
//    - script hasil build tetap sintaks valid
//    - setiap karakter non-ASCII versi lama masih utuh
//    - satu-satunya baris kode yang berubah adalah daftar INTENTIONAL_CHANGED
//      di bawah ini (perbandingan baris per baris, bukan perkiraan)
//
//  PENTING: Level 2 sengaja ditulis ULANG dari nol (2D, tanpa Three.js),
//  jadi blok Level 2 dikeluarkan dari perbandingan sebelum diff dijalankan.
//  Semua bagian lain game WAJIB identik dengan versi monolit lama, dan hal
//  itu dibuktikan di bawah pada bagian "LEVEL 2 (ditulis ulang)".
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.resolve(ROOT, p), 'utf8');
const tmp = path.join(process.env.TEMP || '/tmp', 'nc-verify.js');

let bad = 0;
const check = (ok, label, extra) => { console.log((ok ? '  OK    ' : '  GAGAL ') + label + (extra ? '   [' + extra + ']' : '')); if (!ok) bad++; };

const out = read('netcrimp2.html');
const orig = read('backup/netcrimp2.ORI.html');
const script = s => s.match(/<script>\r?\n([\s\S]*?)\r?\n<\/script>/)[1];
const js = script(out), origJs = script(orig);

/* --- pisahkan blok LEVEL 2 (ditulis ulang, tidak dibandingkan) -----------
   Pencarian dilakukan per-baris supaya tidak masalah LF vs CRLF.            */
const L2_MARK = {
  out: [/^\/\* ---- level2-kabel-2d\.js/, /^\/\* ---- level3-crossover\.js/],
  orig: [/^\s*LEVEL 2 \u2014 Three\.js/, /^\s*LEVEL 3 \/ 4 \/ 5\s*$/],
};
const cutL2 = (src, m) => {
  const lines = src.split(/\r?\n/);
  let ai = -1, bi = -1;
  for (let i = 0; i < lines.length; i++) {
    if (ai < 0 && m[0].test(lines[i])) ai = i;
    else if (ai >= 0 && i > ai && m[1].test(lines[i])) { bi = i; break; }
  }
  if (ai < 0 || bi < 0) return null;
  while (ai > 0 && !/^\s*\/\*/.test(lines[ai])) ai--;   // naik ke pembuka blok
  while (bi > 0 && !/^\s*\/\*/.test(lines[bi])) bi--;
  return { rest: lines.slice(0, ai).concat(lines.slice(bi)).join('\n'), l2: lines.slice(ai, bi).join('\n') };
};
const outCut = cutL2(js, L2_MARK.out), origCut = cutL2(origJs, L2_MARK.orig);
const l2Found = !!outCut && !!origCut;
const jsRest = outCut ? outCut.rest : js;
const origRest = origCut ? origCut.rest : origJs;

console.log('\n== KERANGKA ==');
check(!/@@BUILD:[A-Z]+@@/.test(out), 'semua placeholder build tergantikan');
check((out.match(/^\(\(\) => \{$/m) || []).length === 1 && /^\}\)\(\);$/m.test(js), 'IIFE utuh');
check(/^<!DOCTYPE html>/.test(out) && /<\/html>\s*$/.test(out), 'kerangka HTML utuh');
check(jsRest.length > origRest.length * 0.98, 'volume script (di luar Level 2) tidak menyusut',
  Math.round(jsRest.length / origRest.length * 100) + '% dari aslinya');

console.log('\n== SINTAKS ==');
fs.writeFileSync(tmp, js, 'utf8');
let syntax = true;
try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }); }
catch (e) { syntax = false; console.log(String(e.stderr).split('\n').slice(0, 8).join('\n')); }
check(syntax, 'sintaks JS valid (node --check)');

console.log('\n== REGISTRY LEVEL ==');
const registered = [...js.matchAll(/^registerLevel\((\d+),\s*\{/gm)].map(m => +m[1]);
check(registered.join(',') === '1,2,3,4,5', 'level 1..5 terdaftar tepat sekali', registered.join(','));
check(new Set(registered).size === registered.length, 'tidak ada nomor level dobel');
check(!/\bconst LV\b/.test(js) && !/\bLV\[/.test(js), 'array LV lama sudah hilang total');
const needed = ['registerLevel', 'levelList', 'levelTotal', 'baseLevel', 'endLevel', 'hud', 'drawQuiz', 'quizPick',
  'makeL1', 'makeL2', 'makeCrimp', 'makeL4', 'makeL5', 'go', 'startLevel', 'frame', 'levelsScene', 'menuScene', 'helpScene', 'logScene', 'resultScene'];
const missing = needed.filter(n =>
  !new RegExp('^\\s*function ' + n + '\\s*\\(', 'm').test(js) &&
  !new RegExp('^\\s*(?:const|let|var) ' + n + '\\s*=', 'm').test(js));
check(!missing.length, 'semua fungsi inti masih ada', missing.join(', ') || 'lengkap');

console.log('\n== KODE LAMA TIDAK HILANG (di luar Level 2) ==');
check(l2Found, 'blok Level 2 di build & versi lama berhasil dipisah',
  l2Found ? 'lama ' + origCut.l2.split(/\r?\n/).length + ' baris -> baru ' + outCut.l2.split(/\r?\n/).length + ' baris' : 'penanda tidak ditemukan');
// Daftar ini = satu-satunya baris kode yang SENGAJA diubah saat pemecahan.
const INTENTIONAL_CHANGED = [
  'LEVEL 3 / 4 / 5',
  'Daftar level & scene menu',
  'const LV = [',
  "{ t: 'Persiapan Alat & Bahan',                  m: 'Briefing, studi kasus acak, dan pemilihan alat', mk: makeL1 },",
  "{ t: 'Crimping Straight-Through (T568B)',       m: 'Satu kabel: potong, kupas, susun, crimp, uji',    mk: makeL2 },",
  "{ t: 'Crimping Crossover (T568A\u2013T568B)',        m: 'Drag dua ujung berbeda, lebih sulit',             mk: () => makeCrimp(3) },",
  "{ t: 'Pasang ke Patch Panel',                   m: 'Drag kabel ke port, klik punch-down tool',        mk: makeL4 },",
  "{ t: 'Instalasi Rack Server',                   m: 'Drag semua komponen ke rack, sambungkan',         mk: makeL5 }",
  'function startLevel(i) { if (!(save.teacher || i < save.unlocked)) return; go(LV[i].mk()); }',
  'LV.forEach((L, i) => {',
  'const x = 36 + i * 180, y = 126, w = 168, h = 328, open = save.teacher || i < save.unlocked;',
  "txt(i + 1, x + w / 2, y + 54, { s: 30, f: FONT_H, a: 'center', c: open ? '#06131f' : '#5f7389', w: 600 });",
  'for (let k = 0; k < 3; k++)star(x + w / 2 - 34 + k * 34, y + h - 62, 13, k < (save.stars[i] || 0));',
  "txt(save.best[i] ? 'Skor terbaik ' + save.best[i] : 'Belum dimainkan', x + w / 2, y + h - 22, { s: 13, a: 'center', c: C.mute });",
  'hit(x, y, w, h, () => startLevel(i));',
  'save.unlocked = Math.max(save.unlocked, Math.min(5, lv.n + 1));',
  "if (ok && lv.n < 5) btn(x + 175, by, 255, 46, 'Lanjut ke level ' + (lv.n + 1), () => startLevel(lv.n), { color: C.ok });",
  "if (ok && lv.n === 5) txt('Semua level selesai. Selamat!', W / 2, y + 446, { s: 14, a: 'center', c: C.warn });",
  "['Level 1', 'Baca briefing dari Pak Andi, lalu buka lemari alat dan ambil alat yang tepat sesuai studi kasus. Ada batas waktu 75 detik, combo bonus, dan kuis di akhir.'],",
  "['Level 2', 'Kerjakan SATU kabel dari awal sampai siap dipakai (PC \u2192 switch) dalam adegan 3D. Klik alat di panel kiri/kanan, lalu lakukan gerakan singkat: seret, tahan, atau pilih slot pin.'],",
  "['Level 3', 'Ujung A disusun T568A dan ujung B T568B. Ada batas waktu; contekan mengurangi skor.'],",
  "['Level 4', 'Seret kabel ke port sesuai daftar jalur. Pilih Punch-down Tool, hadapkan bilah ke luar, lalu klik port.'],",
  "['Level 5', 'Seret perangkat ke rack (yang berat di bawah), cek susunan, lalu sambungkan port ke port.']",
  // refactor layar "Cara bermain": baris deskripsi level kini diambil dari
  // levelList()/L.desc, jadi larik konstan ini tidak ada lagi.
  'const rows = [',
  "const y = 94 + i * 66; rr(60, y, 840, 58, 12); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();",
  "txt(r[0], 80, y + 35, { s: 19, f: FONT_H, c: C.acc, w: 600 }); para(r[1], 170, y + 25, 710, 19, { s: 13.5, c: C.text });",
];
const norm = s => s.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
const outSet = new Set(norm(jsRest));
const removed = norm(origRest).filter(l => !outSet.has(l));
const allow = new Set(INTENTIONAL_CHANGED);
const unexpected = removed.filter(l => !allow.has(l));
const notHappened = INTENTIONAL_CHANGED.filter(l => outSet.has(l));
check(!unexpected.length, 'tidak ada baris kode lama yang hilang tanpa sengaja',
  unexpected.length ? unexpected.length + ' baris tak dikenal: ' + unexpected.slice(0, 3).join(' | ') : removed.length + ' baris, semuanya di daftar disengaja');
check(!notHappened.length, 'semua perubahan disengaja benar-benar diterapkan',
  notHappened.length ? 'belum berubah: ' + notHappened.slice(0, 2).join(' | ') : removed.length + '/' + INTENTIONAL_CHANGED.length + ' baris');

console.log('\n== LEVEL 2 (ditulis ulang, 2D tanpa Three.js) ==');
// buang komentar dulu supaya kalimat penjelasan di header ikut menyingkir
const stripComment = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
const l2 = outCut ? outCut.l2 : '';
const l2old = origCut ? origCut.l2 : '';
const l2code = stripComment(l2);
check(l2Found && /function makeL2\s*\(/.test(l2), 'fungsi makeL2 ada di blok Level 2 baru');
check(/^registerLevel\(2,\s*\{/m.test(l2), 'Level 2 mendaftarkan dirinya lewat registerLevel(2, ...)');
check(!/\bTHREE\b|WebGL|webgl|getContext\(\s*['"]webgl|init3D|dispose3D|render3D|makeScene3D/.test(l2code),
  'blok Level 2 tidak menyentuh Three.js / WebGL sama sekali');
check(!/setTimeout\s*\(/.test(l2code), 'blok Level 2 tidak memakai setTimeout (animasi digantung di draw)');
check(!/document\.(createElement|getElementById|querySelector)/.test(l2code), 'blok Level 2 tidak membuat elemen DOM baru');
check(/lv\.draw\s*=/.test(l2) && /lv\.down\s*=/.test(l2) && /lv\.move\s*=/.test(l2)
  && /lv\.up\s*=/.test(l2) && /lv\.exit\s*=/.test(l2) && /lv\.makeResult\s*=/.test(l2),
  'kontrak level lengkap: draw / down / move / up / exit / makeResult');
check(/lv\.limit\s*=/.test(l2) && /lv\.penalize\s*\(/.test(l2code), 'batas waktu & lv.penalize terpasang');
// Level 2 tidak memanggil lv.win() langsung: ia masuk ke tahap 'quiz', lalu
// quizPick() di core memanggil lv.win() setelah semua soal selesai.
check(/lv\.phase\s*=\s*'quiz'/.test(l2code) && /lv\.quizIdx >= quizzes\.length\) lv\.win\(/.test(jsRest)
  && /if \(lv\.phase === 'fin'[\s\S]*?endLevel\(lv, true\)/.test(jsRest),
  'rantai selesai: quiz -> quizPick() -> lv.win() -> endLevel(lv, true)');
check(/boardKey\s*=\s*'board2'/.test(l2) && /logExtra/.test(l2), 'logExtra + papan skor board2 tetap terhubung');
// Level 2 versi lama adalah Three.js (~1050 baris). Yang diuji sekarang adalah
// hasil tulis ulang 2D: kontras, ukuran, animasi sprite, dan pemb pedagogy.
check(!/l2Anim\s*\(\s*'glove'/.test(l2code) && /say\('Sarung tangan HIDUP'/.test(l2code),
  'sarung tangan hanya toast (tidak ada animasi di area kerja)');
check(/drawSprite\('strip'/.test(l2code) && /drawSprite\('gunting'/.test(l2code) && /drawSprite\('crimp'/.test(l2code),
  'animasi alat memakai sprite sungguhan (strip / gunting / crimp)');
check(/#0b1626/.test(l2code) && /createLinearGradient/.test(l2code), 'latar area kerja gelap bergradasi + grid');
check(/l2ModalIntro/.test(l2code) && /Yang kamu pelajari/.test(l2code), 'layar pembuka + kartu "Yang kamu pelajari"');
check(/'APA', p\[0\]/.test(l2code) && /'KENAPA', p\[1\]/.test(l2code) && /'AWAS', p\[2\]/.test(l2code),
  'bar Andi punya 3 kolom APA / KENAPA / AWAS');
const num = (src, re) => { const m = src.match(re); return m ? +m[1] : NaN; };
const vJacket = num(l2code, /const JACKET_W = (\d+)/);
const vConW = num(l2code, /const CON_W = (\d+)/);
const vConStep = num(l2code, /const CON_STEP = (\d+)/);
const vSlotW = num(l2code, /const SLOT_W = (\d+)/);
const vSlotGap = num(l2code, /SLOT_W = \d+, SLOT_GAP = (\d+)/);
const vPinW = num(l2code, /const PIN = \{[^}]*w: (\d+)/);
// CONN boleh menulis lebar langsung (w: 400) atau mewarisi PIN.w
const vConnW = /const CONN = \{[^}]*w: PIN\.w/.test(l2code) ? vPinW : num(l2code, /const CONN = \{[^}]*w: (\d+)/);
const vSlotSpan = 8 * vSlotW + 7 * vSlotGap;
check(vJacket >= 130, 'lebar selubung >= 130 px', 'JACKET_W=' + vJacket);
check(vConW >= 13 && vConStep - vConW >= 3, 'konduktor lebar >= 13 px dengan celah >= 3 px',
  'CON_W=' + vConW + ' celah=' + (vConStep - vConW));
// 36 px masih di atas lebar ujung jari lazily & angka pin 14 px tetap terbaca
check(vSlotW >= 36, 'slot pin lebar >= 36 px (target 36..40)', 'SLOT_W=' + vSlotW);
check(vSlotW <= 40, 'slot pin tidak lebih dari 40 px (kotak RJ-45 tetap rapat)', 'SLOT_W=' + vSlotW);
check(vPinW >= 380 && vPinW <= 400, 'kotak pin RJ-45 rapat 380..400 px', 'PIN.w=' + vPinW);
check(vConnW >= 190, 'RJ-45 lebar >= 190 px', 'CONN.w=' + vConnW);
check(vConnW >= vSlotSpan, 'badan RJ-45 menutup seluruh 8 slot (tidak ada pin di luar badan)',
  'w=' + vConnW + ' vs rentang slot ' + vSlotSpan + ' px');

// helpers yang WAJIB 3 argumen; panggilan 1-argumen menghasilkan NaN dan
// objek yang harusnya tergambar justru lenyap (sudah pernah terjadi).
const WRONG_ARITY = [];
for (const [fname, need] of [['clamp', 3], ['lerp', 3]]) {
  const re = new RegExp('(?<![\\w.$])' + fname + '\\s*\\(', 'g');
  let m;
  while ((m = re.exec(l2code))) {
    let depth = 1, i = m.index + m[0].length, commas = 0, str = null;
    for (; i < l2code.length && depth > 0; i++) {
      const c = l2code[i];
      if (str) { if (c === '\\') i++; else if (c === str) str = null; continue; }
      if (c === '"' || c === "'" || c === '`') { str = c; continue; }
      if (c === '(' || c === '[' || c === '{') depth++;
      else if (c === ')' || c === ']' || c === '}') depth--;
      else if (c === ',' && depth === 1) commas++;
    }
    if (commas + 1 < need) {
      const line = l2code.slice(0, m.index).split('\n').length;
      WRONG_ARITY.push(fname + '() kurang argumen di baris ' + line + ': ' +
        l2code.slice(m.index, Math.min(l2code.length, i)).replace(/\s+/g, ' ').slice(0, 70));
    }
  }
}
check(!WRONG_ARITY.length, 'semua clamp()/lerp() di Level 2 punya argumen lengkap (tidak menghasilkan NaN)',
  WRONG_ARITY.join(' | '));

console.log('\n== TEKS & KARAKTER ==');
const nonAscii = [...new Set([...origRest].filter(c => c.charCodeAt(0) > 126))];
const broken = nonAscii.filter(c => !jsRest.includes(c));
check(!broken.length, 'semua ' + nonAscii.length + ' karakter non-ASCII versi lama utuh (di luar Level 2)',
  broken.length ? 'rusak: ' + broken.map(c => 'U+' + c.charCodeAt(0).toString(16)).join(',') : nonAscii.join(' '));
check(!js.includes('\ufffd'), 'tidak ada karakter pengganti (\\ufffd)');

console.log('\n==> ' + (bad ? bad + ' MASALAH DITEMUKAN' : 'SEMUA CEK LULUS') + '\n');
process.exit(bad ? 1 : 0);