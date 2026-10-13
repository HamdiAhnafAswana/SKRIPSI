// ============================================================================
//  SCREENSHOT LEVEL 4 (implementasi baru)  --  node tools/shot4new.mjs
//  Memainkan Level 4 sampai rapor dan mengambil screenshot tiap tahap.
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createGameHTML } from './game-loader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'shots');
const TMP = path.join(process.env.TEMP || os.tmpdir(), 'nc-shot4new');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(p => fs.existsSync(p));
if (!CHROME) { console.log('Chrome/Edge tidak ditemukan'); process.exit(1); }

const WIN_W = 960, WIN_H = 626;
const PIN = `<style>
  *{box-sizing:border-box}
  html,body{background:#000;margin:0;padding:0}
  .wrap{max-width:none;margin:0;padding:0}
  header,.note{display:none}
  canvas{width:auto;max-width:100%;height:auto;max-height:calc(100vh - 150px);aspect-ratio:960/600;margin:0 auto;display:block;background:#0c1726}
</style>`;

const DRIVER = (scenario) => `
<script>
(function () {
  try { run(); }
  catch (e) {
    document.title = 'ERROR ' + (e && e.message);
    const d = document.createElement('div'); d.id = '__err';
    d.textContent = String((e && e.stack) || e); document.body.appendChild(d);
  }
  function run() {
  const NC = globalThis.__NC;
  const cv = document.querySelector('canvas');
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
  const mulai = () => { for (let i = 0; i < 10; i++) tap(695, 441); wait(200); tap(637, 504); wait(300); };
  const kabel = () => { drag(102, 190, 309, 422); wait(1200); drag(102, 244, 355, 422); wait(1200); };
  const cfg = () => { tap(848, 114); tap(848, 162); tap(848, 166); tap(848, 214); tap(848, 218); tap(848, 266); tap(848, 270); tap(848, 318); wait(300); };
  const ping = () => { tap(848, 362); wait(1200); };
  const lanjut = () => { tap(480, 338); wait(300); };
  const kuis = () => { for (let i = 0; i < 4; i++) { const q = lv().quiz.list[lv().quiz.idx || 0]; tap(480, 238 + q.ans * 48); wait(200); tap(480, 492); wait(200); } wait(300); };

  NC.save.teacher = true;
  NC.startLevel(3);
  draw();
  ${scenario}
  draw();
  }
})();
</script>`;

const SCENES = {
  '00-brief': ``,
  '01-mulai': `mulai();`,
  '02-kabel': `mulai(); kabel();`,
  '03-config': `mulai(); kabel(); cfg();`,
  '04-ping': `mulai(); kabel(); cfg(); ping();`,
  '05-modal': `mulai(); kabel(); cfg(); ping(); wait(1200);`,
  '06-kuis': `mulai(); kabel(); cfg(); ping(); wait(1200); lanjut();`,
  '07-rapor': `mulai(); kabel(); cfg(); ping(); wait(1200); lanjut(); kuis(); wait(500);`,
};

const game = createGameHTML();
const EXPORTS = `globalThis.__NC = { W, H, LEVELS, levelTotal, levelList, go, startLevel,
  scene: () => scene, save, persist, baseLevel, endLevel, quizPick, mouse: () => mouse, btns: () => btns, inR,
  newFrame: () => { hoverBtn = false; btns = []; } };`;
const js = ('window.requestAnimationFrame = () => 0;\n'
  + 'window.setTimeout = (f, t) => { if (t && t >= 5000) return setTimeout(f, t); f(); return 0; };\n'
  + game.match(/<script>\r?\n([\s\S]*?)\r?\n<\/script>/)[1])
  .replace(/\}\)\(\);\s*$/, EXPORTS + '\n})();');

const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
let names = only.length ? only : Object.keys(SCENES);

for (const name of names) {
  const body = SCENES[name];
  if (body === undefined) { console.log('  (tidak dikenal) ' + name); continue; }
  const file = path.join(TMP, 'nc.html');
  fs.writeFileSync(file, game.replace(/<script>\r?\n[\s\S]*?\r?\n<\/script>/, '<script>\n' + js + '\n</script>')
    .replace('</head>', PIN + '\n</head>')
    .replace('</body>', DRIVER(body) + '\n</body>'), 'utf8');
  const png = path.join(OUT, 'new-' + name.replace(/[^\w-]+/g, '-') + '.png');
  fs.rmSync(png, { force: true });
  const base = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=' + WIN_W + ',' + WIN_H,
    'file:///' + file.replace(/\\/g, '/')];
  execFileSync(CHROME, base.concat('--screenshot=' + png), { stdio: 'pipe', timeout: 90000 });
  const dom = execFileSync(CHROME, base.concat('--dump-dom'), { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 90000 });
  const err = dom.match(/<div id="__err">([\s\S]*?)<\/div>/);
  console.log('  ' + (fs.existsSync(png) ? 'OK   ' : 'GAGAL') + '  ' + name.padEnd(18) + (err ? 'ERROR: ' + err[1].slice(0, 200) : ''));
}
console.log('\nSelesai. Lihat PNG di tools/shots/new-*.png');
