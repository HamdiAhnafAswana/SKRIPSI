// ============================================================================
//  AMBIL TAYANG LAYAR LEVEL 4 (layout baru)  --  node tools/shot4.mjs [adegan ...]
//  Juga memverifikasi tata letak: kartu/status di panel kiri, hasil ping &
//  dropdown di panel kanan, Andi & dialog di footer, dan kanvas responsif
//  (ukuran viewport). Driver memakai event pointer asli -> jalur input nyata.
//
//  Baris warna di bawah kanvas adalah KODE KEADAAN + HASIL CEK TATA LETAK:
//    sel 0   kabel >=2 terpasang            H hijau / abu
//    sel 1   LED link port 1 & 2 menyala
//    sel 2   fase play H / fix Y / quiz O / fin(+selai) R
//    sel 3   pingResult ok
//    sel 4   modal troubleshooting aktif
//    sel 5   modal hint aktif
//    sel 6   dropdown terbuka (kuning)
//    sel 10..17  cek tata letak (H lulus, R gagal):
//       10 kartu kabel di dalam panel kiri   11 status terakhir di panel kiri
//       12 kotak hasil ping di panel kanan   13 dropdown dalam kanvas
//       14 Andi ada di footer (tidak nontok) 15 dialog Andi di dalam footer
//       16 Bantuan di dalam footer           17 kanvas -> CSS responsif ✓
//  Mode responsif: RES=1920x1080|1366x768|390x844|1024x600|1280x720|480x800
//  (ujian CSS scaling — kanvas mengisi viewport, letterbox gelap)
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createGameHTML } from './game-loader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'shots');
const TMP = path.join(process.env.TEMP || os.tmpdir(), 'nc-shot4');
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
// Mode biasa: kanvas pas 960x600 di tengah jendela (pemeriksaan isi level).
// Mode responsif: CSS meniru src/styles/global.css (panggung 100vw x 100dvh,
// kanvas diukur oleh fit() di core/05-canvas.js, letterbox gelap).
const RES = process.env.RES;
let WIN_W = 960, WIN_H = 626 + 120;
let PIN = `<style>
  *{box-sizing:border-box}
  html,body{background:#000;margin:0;padding:0}
  .wrap{max-width:none;margin:0;padding:0}
  header,.note{display:none}
  canvas{width:auto;max-width:100%;height:auto;max-height:calc(100vh - 150px);aspect-ratio:960/600;margin:0 auto;display:block;background:#0c1726}
  #__st{position:absolute;left:0;top:600px;width:960px;height:26px;background:#000}
</style>`;
if (RES) {
  const [w, h] = RES.split('x').map(Number);
  WIN_W = w; WIN_H = h;
  PIN = `<style>
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;height:100%;width:100%;overflow:hidden;background:#070f1a}
  body{display:flex;align-items:center;justify-content:center}
  #nama{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
  header,.note{display:none}
  canvas{display:block;background:#0c1726;border-radius:10px;touch-action:none}
  #__st{position:fixed;left:-9999px;top:0;width:960px;height:26px;background:#000}
</style>`;
}

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
  let VT = Date.now();
  performance.now = () => VT;
  const draw = () => { NC.newFrame(); const s = NC.scene(); s.draw(); if (s.tick) s.tick(); };
  const wait = ms => { VT += ms; draw(); draw(); };
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
  const lv = () => NC.scene();
  const mulai = () => { for (let i = 0; i < 8; i++) tap(695, 451); wait(200); tap(623, 504); wait(300); };
  const kabel = () => { drag(102, 190, 309, 422); wait(1750); drag(102, 190, 631, 422); wait(1750); };
  const cfg = () => { tap(848, 128); tap(848, 162); tap(848, 180); tap(848, 214); tap(848, 232); tap(848, 266); tap(848, 284); tap(848, 318); wait(300); };
  const ping = () => { tap(848, 362); wait(400); };
  const diag = () => { for (let k = 0; k < 18 && lv().phase !== 'fix'; k++) { tap(480, 280 + (k % 3) * 36); wait(60); } };
  const perbaiki = () => { tap(480, 478); wait(300); };
  const kuis = () => { for (let i = 0; i < 4; i++) { const q = lv().quizzes[lv().quizIdx || 0]; tap(480, 303 + q.ans * 58); wait(200); } };

  NC.save.teacher = true;
  NC.startLevel(3);
  draw();
  ${scenario}
  draw();
  const s = lv(), lg = s.lg || {};
  const result = s.phase === undefined && lg.PL === undefined;
  const cells = [];
  const FASE = result ? '#d6336c' : s.phase === 'play' ? '#2f9e44' : s.phase === 'fix' ? '#f5c518' : s.phase === 'quiz' ? '#e8590c' : s.phase === 'brief' ? '#7c5cff' : '#e03131';
  cells[0] = result || (s.placedCables.length >= 2) ? '#2f9e44' : '#2b3648';
  cells[1] = result || (s.PORTS && s.PORTS.some(p => p.id <= 4 && p.linkLED) && s.PORTS.some(p => p.id >= 5 && p.linkLED)) ? '#2f9e44' : '#2b3648';
  cells[2] = FASE;
  cells[3] = result || s.pingResult === 'ok' ? '#2f9e44' : '#2b3648';
  cells[4] = !result && s.modal === 'troubleshoot' ? '#2f9e44' : '#2b3648';
  cells[5] = !result && s.modal === 'hint' ? '#2f9e44' : '#2b3648';
  cells[6] = !result && s.openField ? '#f5c518' : '#2b3648';

  // ---- cek tata letak (matematis dari konstanta yang dipakai gambar) ----
  const A = [];
  const PL = lg.PL || {}, PR = lg.PR || {}, BAR = lg.BAR || {}, rows = lg.CABLE_ROWS || [];
  if (result) { for (let i = 0; i < 8; i++) A.push(true); }
  else {
  // 10 kartu terakhir di dalam panel kiri
  A.push(rows.length && rows[rows.length - 1] + 23 <= PL.y + PL.h);
  // 11 status terakhir (baris ke-4) di dalam panel kiri
  A.push(PL.y + 330 + 20 + 3 * 28 <= PL.y + PL.h - 6);
  // 12 kotak hasil ping di dalam panel kanan (ry=PY+98, h=84; PY=divY+18)
  A.push(!s.pingResult || 428 + 84 <= PR.y + PR.h);
  // 13 dropdown (apabila terbuka) tidak melewati bawah panel kanan
  if (s.openField) { const f = (lg.FIELDS || []).find(x => x.key === s.openField); const sy = lg.fieldSelectorY(s.openField); A.push(sy + 28 + 6 + (f ? f.options.length : 4) * 30 <= PR.y + PR.h); }
  else A.push(true);
  // 14 Andi (pusat BAR.y+23, skala 0.26: kepala -20.5, kaki +39) SEPENUHNYA di dalam footer
  { const head = BAR.y + 23 - 20.54, feet = BAR.y + 23 + 39; A.push(head >= BAR.y && feet <= BAR.y + BAR.h); }
  // 15 gelembung dialog di dalam footer, tidak menabrak tombol Bantuan
  A.push(BAR.x + 78 >= BAR.x && BAR.x + 78 + (BAR.w - 78 - 108) <= BAR.x + BAR.w - 104 && BAR.y + 17 + 30 <= BAR.y + BAR.h);
  // 16 tombol Bantuan di dalam footer
  A.push(BAR.x + BAR.w - 104 >= BAR.x && BAR.y + 17 + 30 <= BAR.y + BAR.h);
  // 17 kanvas responsif: sepenuhnya di dalam viewport (tanpa terpotong), rasio 16:10 dipertahankan
  { const r = cv.getBoundingClientRect(); const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    A.push(r.left >= -0.5 && r.right <= vw + 0.5 && r.top >= -0.5 && r.bottom <= vh + 0.5 && Math.abs(r.width / r.height - 960 / 600) < 0.03); }
  }
  A.forEach((v, i) => cells[10 + i] = v ? '#2f9e44' : '#e03131');
  // 20 Level 4 benar-benar tuntas (bintang tersimpan)
  cells[20] = (NC.save.stars[3] || 0) >= 1 ? '#2f9e44' : '#2b3648';
  for (let i = 0; i < 48; i++) if (!cells[i]) cells[i] = '#000000';
  st.innerHTML = cells.map((c, i) => '<i style="display:inline-block;width:24px;height:26px;background:' + c
    + ([8, 11, 16, 23, 26].includes(i) ? ';margin-right:10px' : '') + '"></i>').join('')
    + '<b id="__dbg">' + JSON.stringify({
      phase: s.phase, placed: (s.placedCables || []).length, ping: s.pingResult, modal: s.modal, openField: s.openField,
      stars3: (NC.save.stars[3] || 0),
      solved: (s.troubleshootSolved || []).length, cvAttr: cv.width + 'x' + cv.height,      A: A.map(Boolean),
      cvRect: (() => { const r = cv.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })(),
      win: document.documentElement.clientWidth + 'x' + document.documentElement.clientHeight,
      lg: { PL: PL, PR: PR, BAR: BAR, rows: rows }
    }).replace(/</g, '&lt;') + '</b>';
  }
})();
</script>`;

const SCENES = {
  '00-brief': ``,
  '01-mulai': `mulai();`,
  '02-kabel': `mulai(); kabel();`,
  '03-dropdown': `mulai(); kabel(); tap(848, 128); wait(200);`,
  '04-terisi': `mulai(); kabel(); cfg(); ping(); wait(300);`,
  '05-fix': `mulai(); kabel(); cfg(); ping(); diag();`,
  '06-kuis': `mulai(); kabel(); cfg(); ping(); diag(); perbaiki(); ping(); diag(); perbaiki(); ping();`,
  '07-hasil': `mulai(); kabel(); cfg(); ping(); diag(); perbaiki(); ping(); diag(); perbaiki(); ping(); kuis(); wait(2800);`,
};

/* ------------------------------------------------------------------ render */
const game = createGameHTML();
const EXPORTS = `globalThis.__NC = { W, H, LEVELS, levelTotal, levelList, go, startLevel,
  scene: () => scene, save, persist, baseLevel, endLevel, mouse: () => mouse, btns: () => btns, inR,
  newFrame: () => { hoverBtn = false; btns = []; } };`;
const js = ('window.requestAnimationFrame = () => 0;\n'
  + 'window.setTimeout = (f, t) => { if (t && t >= 5000) return setTimeout(f, t); f(); return 0; };\n'
  + game.match(/<script>\r?\n([\s\S]*?)\r?\n<\/script>/)[1])
  .replace(/\}\)\(\);\s*$/, EXPORTS + '\n})();');

const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
let names = only.length ? only : Object.keys(SCENES);
if (RES) names = only.length ? only : ['00-brief', '04-terisi'];

/* --------- baca kode keadaan dari DOM (lebih andal daripada piksel) ------ */
const NAMEC = { '#2f9e44': 'H', '#f5c518': 'Y', '#e8590c': 'O', '#e03131': 'R', '#d6336c': 'D', '#7c5cff': 'B', '#2b3648': '.', '#000000': ' ' };
function decode(raw) {
  const dom = raw.replace(/<script>[\s\S]*?<\/script>/g, '');
  const err = dom.match(/<div id="__err">([\s\S]*?)<\/div>/);
  if (err) return 'ERROR ' + err[1].slice(0, 240).replace(/\s+/g, ' ');
  const st = dom.match(/<div id="__st"[^>]*>([\s\S]*?)<\/div>/);
  if (!st) return '(strip tidak ada)';
  const c = [...st[1].matchAll(/background:(#[0-9a-f]{6})/g)].map(m => NAMEC[m[1].toLowerCase()] || '?');
  if (process.env.SHOW_DEBUG) {
    const dbg = st[1].match(/<b id="__dbg">(.*?)<\/b>/);
    if (dbg) console.log('        ' + dbg[1].replace(/&lt;/g, '<').replace(/&quot;/g, '"'));
  }
  const at = i => c[i] || ' ';
  const fase = { H: 'play', Y: 'fix', O: 'kuis', B: 'brief', D: 'hasil', R: 'fin/modal?' }[at(2)] || '?';
  const layout = c.slice(10, 18).join('').replace(/H/g, 'L').replace(/R/g, 'X');
  const modal = at(4) === 'H' ? 'trouble' : at(5) === 'H' ? 'hint' : at(6) === 'Y' ? 'dropdown' : '-';
  return 'kabel=' + at(0) + ' link=' + at(1) + ' fase=' + fase + ' ping=' + at(3) + ' modal=' + modal
    + ' | layout[' + layout + '] (' + (layout.includes('X') ? 'ADA GAGAL' : 'semua lulus') + ')'
    + ' | L4=' + (at(20) === 'H' ? 'SELESAI' : 'belum');
}

for (const name of names) {
  const body = SCENES[name];
  if (body === undefined) { console.log('  (tidak dikenal) ' + name); continue; }
  const file = path.join(TMP, 'nc.html');
  fs.writeFileSync(file, game.replace(/<script>\r?\n[\s\S]*?\r?\n<\/script>/, '<script>\n' + js + '\n</script>')
    .replace('</head>', PIN + '\n</head>')
    .replace('</body>', DRIVER(body) + '\n</body>'), 'utf8');
  const png = path.join(OUT, (RES ? 'res-' + RES + '-' : '') + name.replace(/[^\w-]+/g, '-') + '.png');
  fs.rmSync(png, { force: true });
  const base = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=' + WIN_W + ',' + WIN_H,
    'file:///' + file.replace(/\\/g, '/')];
  execFileSync(CHROME, base.concat('--screenshot=' + png), { stdio: 'pipe', timeout: 90000 });
  const dom = execFileSync(CHROME, base.concat('--dump-dom'), { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 90000 });
  const ok = fs.existsSync(png);
  console.log('  ' + (ok ? 'OK   ' : 'GAGAL') + '  ' + (RES ? '[' + RES + '] ' : '') + name.padEnd(18) + decode(dom));
}
console.log('\nSelesai. Lihat PNG di tools/shots/. L=lulus X=gagal');