// ============================================================================
//  PRATINJAU ASET SARUNG TANGAN  --  node tools/preview-glove.mjs
//
//  Menggabungkan file core menggambar (tanpa wrapper IIFE) + kode pratinjau,
//  lalu memotret kanvas dengan Chrome headless. Dipakai untuk memeriksa
//  desain ikon panel & sprite area kerja (drawWorkHand / drawHandGrip)
//  tanpa harus menjalankan level.
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAME = path.join(ROOT, 'public', 'game');
const OUT = path.join(ROOT, 'tools', 'shots', 'preview-sarung.png');
const TMP = path.join(process.env.TEMP || os.tmpdir(), 'nc-preview');
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(p => fs.existsSync(p));
if (!CHROME) { console.log('Chrome/Edge tidak ditemukan'); process.exit(1); }

// Urutan mengikuti <script> index.html, tapi tanpa THREE (04) dan tanpa
// loop/DOM game supaya fokus menggambar saja.
const FILES = [
  'core/01-init.js',
  'core/05-canvas.js',
  'core/07-draw.js',
  'core/08-wire-colors.js',
  'core/09-tool-icons.js',
  'core/10-sprites.js',
];
const src = FILES.map(f => fs.readFileSync(path.join(GAME, f), 'utf8')).join('\n');

const W2 = 1400, H2 = 880;
const PREVIEW = `
;(function () {
  const P = document.getElementById('c');
  P.width = ${W2}; P.height = ${H2};
  ctx = P.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const bg = ctx.createLinearGradient(0, 0, 0, ${H2});
  bg.addColorStop(0, '#0c1a28'); bg.addColorStop(1, '#0a131d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, ${W2}, ${H2});
  function label(s, x, y, c) { ctx.fillStyle = c || '#9db2c8'; ctx.font = '600 14px "Nunito",system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); }
  function big(s) { ctx.fillStyle = '#eaf2fb'; ctx.font = '800 18px "Nunito",system-ui,sans-serif'; ctx.textAlign = 'left'; ctx.fillText(s, 24, s === s ? 0 : 0); }
  function cell(x, y, w, h, title) {
    ctx.strokeStyle = '#20364f'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
    label(title, x + 10, y + 20);
  }
  ctx.fillStyle = '#eaf2fb'; ctx.font = '800 17px "Nunito",system-ui,sans-serif';
  ctx.fillText('Pratinjau aset sarung tangan kerja (oranye keselamatan)', 24, 30);

  // ---- Baris 1: ikon panel kecil (case 'sarung_tangan') --------------------
  ctx.fillStyle = '#7dd3fc'; ctx.font = '800 14px "Nunito",system-ui,sans-serif';
  ctx.fillText('IKON PANEL (case sarung_tangan) — berbagai skala pemakaian', 24, 62);
  const sc = [1.7, 1.0, 0.56, 0.4, 0.3, 0.25];
  let ix = 60;
  sc.forEach(s => {
    const cw = 200, cy = 78, ch = 250;
    cell(ix, cy, cw, ch, 'x' + s);
    icon('sarung_tangan', ix + cw / 2, cy + ch / 2 + 8 * s, s);
    ix += cw + 12;
  });

  // ---- Baris 2: sprite area kerja (drawWorkHand) --------------------------
  ctx.fillStyle = '#f59e0b'; ctx.font = '800 14px "Nunito",system-ui,sans-serif';
  ctx.fillText('SPRITE AREA KERJA (drawWorkHand) — tangan telanjang → sarung penuh', 24, 330);
  const phases = [[0, 0, 'cover 0 (telanjang)'], [.35, .12, 'cover .35'], [.65, .35, 'cover .65'], [.85, .6, 'cover .85 + genggam'], [1, .72, 'cover 1 (penuh)']];
  let wx = 60;
  phases.forEach(p => {
    const cw = 236, cy = 346, ch = 240;
    cell(wx, cy, cw, ch, p[2]);
    drawWorkHand(wx + cw / 2, cy + ch / 2 + 26, 1.7, -0.05, p[0], p[1]);
    wx += cw + 12;
  });

  // ---- Baris 3: pose siap menggenggam (drawHandGrip) ----------------------
  ctx.fillStyle = '#34d399'; ctx.font = '800 14px "Nunito",system-ui,sans-serif';
  ctx.fillText('POSE SIAP MENGGENGGAM (drawHandGrip) — aset animasi memegang alat', 24, 620);
  const grips = [[null, 'hold: null (kosong)'], ['cable', 'hold: cable'], ['crimp', 'hold: crimp'], ['crimp', 'crimp (miring)']];
  let gx = 60;
  grips.forEach((g, i) => {
    const cw = 236, cy = 636, ch = 220;
    cell(gx, cy, cw, ch, g[1]);
    if (i < 3) drawHandGrip(gx + cw / 2, cy + ch / 2 + 14, 1.55, -0.05, g[0]);
    else drawHandGrip(gx + cw / 2, cy + ch / 2 + 14, 1.55, -0.35, g[0]);
    gx += cw + 12;
  });
})();
`;

const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>preview</title>
<style>html,body{background:#000;margin:0;padding:0}</style></head>
<body><canvas id="c"></canvas>
<script>
${src}
${PREVIEW}
</script></body></html>`;

const file = path.join(TMP, 'preview.html');
fs.writeFileSync(file, html, 'utf8');
fs.rmSync(OUT, { force: true });
const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=' + W2 + ',' + (H2 + 120),
  '--screenshot=' + OUT, 'file:///' + file.replace(/\\/g, '/')];
execFileSync(CHROME, args, { stdio: 'pipe', timeout: 90000 });
console.log(fs.existsSync(OUT) ? 'OK   ' + OUT : 'GAGAL membuat pratinjau');
