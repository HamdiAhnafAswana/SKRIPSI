// ============================================================================
//  AMBIL TAYAN LAYAR LEVEL 2  --  node tools/shot.mjs [nama-adegan ...]
//
//  Menjalankan index.html di Chrome headless, MemAIKAN level 2 sampai
//  beberapa titik, lalu menyimpan PNG tiap adegan ke tools/shots/.
//
//  Cara kerjanya deterministik: loop rAF game dimatikan dan performance.now
//  diganti jam palsu, jadi setiap adegan selalu menghasilkan frame yang sama
//  (tidak ada ketergantungan kecepatan mesin).
//
//  Baris warna di bawah kanvas (y 600..626) adalah KODE KEADAAN yang bisa
//  dibaca tools/peek.mjs:
//    sel 0..7   langkah 0..6   hijau=sudah lewat, kuning=sedang, abu=belum
//    sel 9      fase           hijau=play kuning=quiz jingga=fin merah=timeout
//    sel 10     merah = lv.finished
//    sel 12..15 modal langkah / bantuan / panjang / tester
//    sel 17..22 animasi glove / strip / conn / cut / trim / crimp
//    sel 24     skor  merah<60  kuning<85  hijau>=85
//    sel 25     merah = ada kesalahan tercatat
//    sel 27..34 isi slot pin 1..8
//    sel 36..38 hasil tester
//    sel 39     modal kartu "Yang kamu pelajari"
//    sel 40     kuning = masih di layar pembuka
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createGameHTML } from './game-loader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'shots');
const TMP = path.join(process.env.TEMP || os.tmpdir(), 'nc-shot');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(p => fs.existsSync(p));
if (!CHROME) { console.log('Chrome/Edge tidak ditemukan'); process.exit(1); }

/* ------------------------------------------------------------------ layout */
const PIN = `<style>
  html,body{background:#000;margin:0;padding:0}
  .wrap{max-width:none;margin:0;padding:0}
  header,.note{display:none}
  canvas{width:960px;height:600px;border:0;border-radius:0}
  #__st{position:absolute;left:0;top:600px;width:960px;height:26px;background:#000}
</style>`;

/* ------------------------------------------------------------------ driver */
const DRIVER = (scenario) => `
<script>
(function () {
  try { run(); }
  catch (e) {
    document.title = 'ERROR ' + (e && e.message);
    const d = document.createElement('div'); d.id = '__err';
    d.textContent = String((e && e.stack) || e); document.body.appendChild(d);
    st.innerHTML = '<i style="display:inline-block;width:24px;height:26px;background:#d6336c"></i>'.repeat(3);
  }
  function run() {
  const NC = globalThis.__NC;
  const cv = document.querySelector('canvas');
  const st = document.createElement('div'); st.id = '__st'; document.body.appendChild(st);
  let VT = Date.now();                                   // jam palsu (epoch, sama dengan Date.now)
  performance.now = () => VT;
  const draw = () => { NC.newFrame(); const s = NC.scene(); s.draw(); if (s.tick) s.tick(); };
  const wait = ms => { VT += ms; draw(); draw(); };      // majukan jam & gambar 2 frame
  //Animasi naik-ke-slot (520ms) & denyut_hint juga butuh jam berjalan,
  // jadi settle() selalu menyisakan waktu huvud walau lv.anim sudah null.
  const settle = () => { for (let i = 0; i < 24 && NC.scene().anim; i++) wait(300); wait(700); };
  const pos = (x, y) => { const r = cv.getBoundingClientRect(); return { clientX: r.left + x * r.width / NC.W, clientY: r.top + y * r.height / NC.H }; };
  function tap(x, y) {
    draw();
    const o = Object.assign({ bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 }, pos(x, y));
    cv.dispatchEvent(new PointerEvent('pointerdown', o));
    cv.dispatchEvent(new PointerEvent('pointerup', o));
    draw();
  }
  function drag(x0, y0, x1, y1) {
    draw();
    cv.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1 }, pos(x0, y0))));
    for (let i = 1; i <= 5; i++) { const t = i / 5; cv.dispatchEvent(new PointerEvent('pointermove', Object.assign({ bubbles: true, pointerId: 1, pointerType: 'mouse' }, pos(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)))); }
    cv.dispatchEvent(new PointerEvent('pointerup', Object.assign({ bubbles: true, pointerId: 1, pointerType: 'mouse' }, pos(x1, y1))));
    draw();
  }
  const SLOT_W = 36, SLOT_GAP = 8, PIN_X = 280, PIN_PADX = 28;   // ikut src/levels/level2-kabel-2d.js
  const slotCX = i => PIN_X + PIN_PADX + i * (SLOT_W + SLOT_GAP) + SLOT_W / 2;
  const SLOT_MID = 150, LOOSE_Y = 306;
  const looseX = i => 396 + i * 24;   // ikut BASE_X0 di src
  const T568B = ['wo', 'o', 'wg', 'b', 'wb', 'g', 'wbr', 'br'];
  const T568A = ['wg', 'g', 'wo', 'b', 'wb', 'o', 'wbr', 'br'];
  const SALAH = ['wg', 'g', 'o', 'wo', 'wb', 'b', 'wbr', 'br'];   // bukan T568A/B -> tester GAGAL
  const CARD_L = i => [86, 120 + i * 88], CARD_R = i => [874, 120 + i * 88];
  const MULAI = [480, 52 + 430 + 23], STRIP_LANGKAH = [74, 70], STRIP_BANTUAN = [208, 70];
  const LEN_CM = i => [270 + 26 + i * 120 + 54, 170 + 80 + 26];   // tombol 30/40/60 cm
  const TESTER_RUN = [200 + 280 - 76, 120 + 380 - 58 + 22], TESTER_SEND = [200 + 560 - 24 - 152 + 76, 120 + 380 - 58 + 22];
  const LEARN_NEXT = [480, 62 + 452 - 58 + 22];
  const lv = () => NC.scene();
  const mulai = () => { if (lv().phase === 'intro') { tap(...MULAI); wait(200); } };
  const gloveStrip = () => { tap(...CARD_L(0)); settle(); tap(...CARD_L(1)); settle(); };
  function susun(std, n) { for (let i = 0; i < n; i++) { const k = lv().KAB.loose.indexOf(std[i]); tap(looseX(k), LOOSE_Y); tap(slotCX(i), SLOT_MID); } settle(); }
  const thruTrim = cm => { tap(...CARD_L(2)); wait(200); if (lv().modal === 'len') tap(...LEN_CM(cm === undefined ? 1 : cm)); settle(); };
  const thruConn = () => { tap(...CARD_R(0)); settle(); };
  const thruCrimp = () => { tap(...CARD_R(1)); settle(); };
  const thruTest = () => { tap(...CARD_R(2)); wait(200); };

  NC.save.teacher = true;
  NC.startLevel(1);
  draw();
  ${scenario}
  draw();
  const s = lv(), cells = [];
  for (let i = 0; i < 8; i++) cells.push(i < s.step ? '#2f9e44' : i === s.step ? '#f5c518' : '#2b3648');
  cells[9] = s.phase === 'play' ? '#2f9e44' : s.phase === 'quiz' ? '#f5c518' : s.phase === 'fin' ? '#e8590c' : '#e03131';
  cells[10] = s.finished ? '#e03131' : '#2b3648';
  [s.modal === 'steps', s.modal === 'help', s.modal === 'len', s.modal === 'test']
    .forEach((v, i) => cells[12 + i] = v ? '#2f9e44' : '#2b3648');
  ['glove', 'strip', 'conn', 'cut', 'trim', 'crimp'].forEach((t, i) => cells[17 + i] = (s.anim && s.anim.type) === t ? '#f5c518' : '#2b3648');
  cells[24] = s.score < 60 ? '#e03131' : s.score < 85 ? '#f5c518' : '#2f9e44';
  cells[25] = (s.mistakes || []).length ? '#e03131' : '#2b3648';
  for (let i = 0; i < 8; i++) cells[27 + i] = (s.KAB && s.KAB.slots[i]) ? '#2f9e44' : '#2b3648';
  const tp = s.test ? s.test.phase : '-';
  cells[36] = tp === 'ok' ? '#2f9e44' : tp === 'fail' ? '#e03131' : tp === 'run' ? '#f5c518' : '#2b3648';
  cells[37] = (s.test && s.test.std === 'T568A') ? '#2f9e44' : '#2b3648';
  cells[38] = (s.test && s.test.std === 'T568B') ? '#2f9e44' : '#2b3648';
  cells[39] = s.modal === 'learn' ? '#2f9e44' : '#2b3648';
  cells[40] = s.phase === 'intro' ? '#f5c518' : '#2b3648';
  for (let i = 0; i < 48; i++) if (!cells[i]) cells[i] = '#000000';   // isi lubang (map() melewati hole)
  st.innerHTML = cells.map((c, i) => '<i style="display:inline-block;width:24px;height:26px;background:' + c
    + ([8, 11, 16, 23, 26].includes(i) ? ';margin-right:10px' : '') + '"></i>').join('')
    + '<b id="__dbg">' + JSON.stringify({
      phase: s.phase, step: s.step, inBox: s.inBox, anim: s.anim && s.anim.type, sel: s.sel, drag: !!s.drag,
      glove: s.KAB.glove, stripped: s.KAB.stripped, lenChosen: s.KAB.lenChosen, trimmed: s.KAB.trimmed,
      conn: s.KAB.conn, crimped: s.KAB.crimped, loose: s.KAB.loose.join(' '), slots: s.KAB.slots.map(v => v || '-').join(' '),
      cv: cv.width + 'x' + cv.height
    }).replace(/</g, '&lt;') + '</b>';
  }
})();
</script>`;

const SCENES = {
  '00-pembuka': ``,
  '01-awal': `mulai();`,
  '02-kupas': `mulai(); gloveStrip();`,
  '03-susun sebagian': `mulai(); gloveStrip(); susun(T568B, 3);`,
  '04-semua-terisi': `mulai(); gloveStrip(); susun(T568B, 8);`,
  '05-modal-panjang': `mulai(); gloveStrip(); susun(T568B, 8); tap(...CARD_L(2)); wait(200);`,
  '06-rj45-terpasang': `mulai(); gloveStrip(); susun(T568B, 8); thruTrim(); thruConn();`,
  '07-sudah-crimp': `mulai(); gloveStrip(); susun(T568B, 8); thruTrim(); thruConn(); thruCrimp();`,
  '08-tester-siap': `mulai(); gloveStrip(); susun(T568B, 8); thruTrim(); thruConn(); thruCrimp(); thruTest();`,
  '09-tester-lulus': `mulai(); gloveStrip(); susun(T568B, 8); thruTrim(); thruConn(); thruCrimp(); thruTest(); tap(...TESTER_RUN); wait(3400);`,
  '10-tester-gagal': `mulai(); gloveStrip(); susun(SALAH, 8); thruTrim(); thruConn(); thruCrimp(); thruTest(); tap(...TESTER_RUN); wait(3400);`,
  '11-modal-bantuan': `mulai(); tap(...STRIP_BANTUAN); wait(200);`,
  '12-modal-langkah': `mulai(); tap(...STRIP_LANGKAH); wait(200);`,
  '13-kabel-salah-cm': `mulai(); gloveStrip(); susun(T568B, 8); thruTrim(0);`,
  '14-seret-warna': `mulai(); gloveStrip(); for (let i = 0; i < 8; i++) { const k = lv().KAB.loose.indexOf(T568A[i]); drag(looseX(k), LOOSE_Y, slotCX(i), SLOT_MID); } settle();`,
  '15-belajar': `mulai(); gloveStrip(); susun(T568B, 8); thruTrim(); thruConn(); thruCrimp(); thruTest(); tap(...TESTER_RUN); wait(3400); tap(...TESTER_SEND); wait(600);`,
  '16-mode-mudah': `mulai(); tap(339, 70); wait(200); gloveStrip(); susun(T568B, 3);`,
  '17-kuis': `mulai(); gloveStrip(); susun(T568B, 8); thruTrim(); thruConn(); thruCrimp(); thruTest(); tap(...TESTER_RUN); wait(3400); tap(...TESTER_SEND); wait(600); tap(...LEARN_NEXT); wait(400);`,
  // toast core (say) menutupi bar bawah selama 4,6 detik; adegan ini menunggu
  // toastnya habis supaya bar Andi bisa diperiksa piksel per piksel
  '18-bar-andi': `mulai(); wait(5000); gloveStrip(); susun(T568B, 8);`,
  // Adegan animasi sarung tangan (Tahap A-E). wait() memajukan jam palsu.
  // Area kerja bersih sebelum kartu diklik; begitu kartu Sarung Tangan
  // ditekan, satu tangan muncul dan berubah: A telanjang, B sarung mulai
  // masuk dari ujung jari, C hampir penuh, D bersarung penuh, E selesai
  // (tangan hilang lagi, area kerja bersih).
  '19-sarung-A-telanjang': `mulai(); tap(...CARD_L(0)); wait(250);`,
  '20-sarung-B-meraih': `mulai(); tap(...CARD_L(0)); wait(500);`,
  '21-sarung-C-masuk': `mulai(); tap(...CARD_L(0)); wait(800);`,
  '22-sarung-D-manset': `mulai(); tap(...CARD_L(0)); wait(1300);`,
  '23-sarung-E-selesai': `mulai(); tap(...CARD_L(0)); settle();`,
};

/* ------------------------------------------------------------------ render */
const game = createGameHTML();   // game dirakit dari public/game/ (bukan index.html Vite)
const EXPORTS = `globalThis.__NC = { W, H, LEVELS, levelTotal, levelList, go, startLevel,
  scene: () => scene, save, persist, baseLevel, endLevel, quizPick, mouse: () => mouse, btns: () => btns, inR,
  newFrame: () => { hoverBtn = false; btns = []; } };`;
// matikan loop rAF supaya frame digambar sepenuhnya oleh driver (deterministik)
const js = ('window.requestAnimationFrame = () => 0;\n' + game.match(/<script>\r?\n([\s\S]*?)\r?\n<\/script>/)[1])
  .replace(/\}\)\(\);\s*$/, EXPORTS + '\n})();');

const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const names = only.length ? only : Object.keys(SCENES);

/* --------- baca kode keadaan dari DOM (lebih andal daripada piksel) ------ */
const NAMEC = { '#2f9e44': 'H', '#f5c518': 'Y', '#e8590c': 'O', '#e03131': 'R', '#2b3648': '.', '#000000': ' ' };
function decode(raw) {
  const dom = raw.replace(/<script>[\s\S]*?<\/script>/g, '');   // buang sumber driver
  const err = dom.match(/<div id="__err">([\s\S]*?)<\/div>/);
  if (err) return 'ERROR ' + err[1].slice(0, 240).replace(/\s+/g, ' ');
  const st = dom.match(/<div id="__st"[^>]*>([\s\S]*?)<\/div>/);
  if (!st) return '(strip tidak ada)';
  const c = [...st[1].matchAll(/background:(#[0-9a-f]{6})/g)].map(m => NAMEC[m[1].toLowerCase()] || '?');
  if (process.env.SHOW_DEBUG) {
    const dbg = st[1].match(/<b id="__dbg">(.*?)<\/b>/);
    if (dbg) console.log('        ' + dbg[1]);
  }
  const at = i => c[i] || ' ';
  const steps = 'langkah=' + c.slice(0, 8).join('');
  const fase = at(40) === 'Y' ? 'PEMBUKA'
    : { H: 'main', Y: 'kuis', O: 'selesai', R: 'TIMEOUT' }[at(9)] || '?';
  const modal = ['langkah', 'bantuan', 'panjang', 'tester'].filter((_, i) => at(12 + i) === 'H')
    .concat(at(39) === 'H' ? ['belajar'] : []).join('+') || '-';
  const anim = ['glove', 'strip', 'conn', 'cut', 'trim', 'crimp'].filter((_, i) => at(17 + i) === 'Y').join('+') || '-';
  const skor = { H: '>=85', Y: '60-84', R: '<60' }[at(24)] || '?';
  const slot = c.slice(27, 35).join('').replace(/H/g, '#');
  const test = { H: 'LULUS', R: 'GAGAL', Y: 'MENGETES', '.': 'siap' }[at(36)] || '?';
  const std = at(37) === 'H' ? 'T568A' : at(38) === 'H' ? 'T568B' : '-';
  return steps + ' fase=' + fase + ' selesai=' + at(10) + ' modal=' + modal + ' anim=' + anim
    + ' skor=' + skor + ' salah=' + at(25) + ' slot=' + slot + ' tester=' + test + (std === '-' ? '' : ' ' + std);
}

for (const name of names) {
  const body = SCENES[name];
  if (body === undefined) { console.log('  (tidak dikenal) ' + name); continue; }
  const file = path.join(TMP, 'nc.html');
  fs.writeFileSync(file, game.replace(/<script>\r?\n[\s\S]*?\r?\n<\/script>/, '<script>\n' + js + '\n</script>')
    .replace('</head>', PIN + '\n</head>')
    .replace('</body>', DRIVER(body) + '\n</body>'), 'utf8');
  const png = path.join(OUT, name.replace(/[^\w-]+/g, '-') + '.png');
  fs.rmSync(png, { force: true });
  // Jendela dibuat lebih tinggi dari isi halaman: headless=new memotong bagian
  // bawah viewport (sekitar 90px), sehingga baris terakhir kanvas yang
  // penting (bar Andi, y=548..596) terpotong kalau tingginya pas 626.
  // Sisa baris di bawah 626 dibiarkan hitam; probe hanya membaca y < 626.
  const WIN_H = 626 + 120;
  const base = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=960,' + WIN_H, 'file:///' + file.replace(/\\/g, '/')];
  execFileSync(CHROME, base.concat('--screenshot=' + png), { stdio: 'pipe', timeout: 90000 });
  const dom = execFileSync(CHROME, base.concat('--dump-dom'), { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 90000 });
  const ok = fs.existsSync(png);
  console.log('  ' + (ok ? 'OK   ' : 'GAGAL') + '  ' + name.padEnd(21) + decode(dom));
}
console.log('\nSelesai. Buka file di tools/shots/ untuk melihat hasil gambar.');
console.log('H=langkah selesai  .=belum   Y=sedang   R=merah   O=jingga\n');
