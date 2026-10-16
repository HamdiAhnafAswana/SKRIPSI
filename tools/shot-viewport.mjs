// ============================================================================
//  TANGKAP LAYAR RESPONSIF  --  node tools/shot-viewport.mjs [adegan ...]
//
//  Menjalankan game sungguhan (public/game/**, jadi fit() asli ikut jalan) di
//  Chrome headless pada beberapa ukuran viewport tetap, memverifikasi kanvas
//  mengisi viewport tanpa terpotong (rasio logis 960:600 utuh), lalu
//  menyimpan PNG berukuran PAS sesuai target.
//
//  Cara kerja ukuran tetap:
//    Chrome di Windows membatasi lebar jendela minimum (~484px) dan menyisakan
//    bilah jendela. Karena itu panggung (body) dipaksa berukuran target tepat
//    lewat CSS, jendela diminta lebih besar, lalu PNG dipotong ke ukuran target
//    memakai System.Drawing (PowerShell). Kanvas mengikuti ukuran panggung
//    karena fit() membaca getBoundingClientRect() induknya.
//
//  Contoh:
//    node tools/shot-viewport.mjs
//    node tools/shot-viewport.mjs dashboard level-3
//    RES=1920x1080 node tools/shot-viewport.mjs dashboard
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createGameHTML } from './game-loader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'shots');
const TMP = path.join(process.env.TEMP || os.tmpdir(), 'nc-shotvp');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(p => fs.existsSync(p));
if (!CHROME) { console.log('Chrome/Edge tidak ditemukan'); process.exit(1); }

const PS = [
  'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
  'powershell.exe',
].find(p => p === 'powershell.exe' || fs.existsSync(p));

const RES_LIST = (process.env.RES ? [process.env.RES] : ['1920x1080', '1366x768', '390x844'])
  .filter(r => /^\d+x\d+$/.test(r));

/* --- skrip potong PNG (System.Drawing) ----------------------------------- */
const CROP_PS = path.join(TMP, 'crop.ps1');
fs.writeFileSync(CROP_PS, [
  'param([string]$In,[string]$Out,[int]$W,[int]$H)',
  'Add-Type -AssemblyName System.Drawing',
  '$img = [System.Drawing.Image]::FromFile($In)',
  '$bmp = New-Object System.Drawing.Bitmap($W,$H)',
  '$g = [System.Drawing.Graphics]::FromImage($bmp)',
  '$dst = New-Object System.Drawing.Rectangle(0,0,$W,$H)',
  '$g.DrawImage($img, $dst, $dst, [System.Drawing.GraphicsUnit]::Pixel)',
  '$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)',
  '$g.Dispose(); $bmp.Dispose(); $img.Dispose()',
].join('\r\n'), 'utf8');

function crop(png, W, H) {
  const out = png.replace(/\.png$/, '.crop.png');
  execFileSync(PS, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', CROP_PS,
    '-In', png, '-Out', out, '-W', String(W), '-H', String(H)], { stdio: 'pipe', timeout: 60000 });
  fs.rmSync(png, { force: true });
  fs.renameSync(out, png);
}

/* --- CSS + chrome aplikasi (meniru src/styles/global.css & App.jsx) ------- */
const pin = (w, h) => `<style>
  html{width:${w}px;height:${h}px}
  html,body{margin:0;padding:0;overflow:hidden;
    background:radial-gradient(1200px 620px at 50% -12%,#122b46 0%,rgba(18,43,70,0) 62%),
               radial-gradient(820px 560px at 105% 112%,#0d2540 0%,rgba(13,37,64,0) 58%),#070f1a}
  body{position:relative;width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center}
  #nama{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
  canvas{display:block;background:#0c1726;border-radius:10px;touch-action:none;
    box-shadow:0 0 0 1px rgba(56,189,248,.10),0 18px 50px rgba(0,0,0,.5)}
  .app-header{position:absolute;top:0;left:0;right:0;z-index:20;display:flex;align-items:center;
    justify-content:space-between;gap:10px;padding:8px 12px;pointer-events:none}
  .app-brand{display:flex;align-items:baseline;gap:9px;min-width:0;padding:4px 12px;border-radius:999px;
    border:1px solid rgba(56,189,248,.16);background:rgba(9,18,30,.55);backdrop-filter:blur(8px)}
  .app-header h1{margin:0;font-family:'Fredoka','Nunito',system-ui,sans-serif;font-weight:600;font-size:15px;letter-spacing:.4px;color:#e6eef7}
  .app-header p{margin:0;font-family:'Nunito',system-ui,sans-serif;font-weight:700;font-size:11px;color:#8fa6bd;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .fs-btn{pointer-events:auto;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;
    border:1px solid rgba(56,189,248,.22);background:rgba(9,18,30,.6);backdrop-filter:blur(8px);color:#cfe2f5;
    font-family:inherit;font-size:12px;font-weight:800;line-height:1}
  .fs-btn .fs-ico{font-size:14px}
  .note{position:absolute;left:0;right:0;bottom:0;margin:0;padding:10px 14px;text-align:center;font-size:12px;
    line-height:1.45;color:rgba(157,178,200,.9);pointer-events:none;
    background:linear-gradient(180deg,rgba(7,15,26,0) 0%,rgba(7,15,26,.78) 100%)}
  @media (max-width:760px){.app-header p{display:none}.fs-btn-label{display:none}}
  @media (max-width:820px),(max-height:460px){.note{display:none}}
  #__vp{position:fixed;left:-9999px;top:0;white-space:pre}
</style>`;

const CHROME_HTML = `<div class="app-header"><div class="app-brand"><h1>SINOVA</h1>`
  + `<p>Simulation Interactive Network Virtual Academy</p></div>`
  + `<button type="button" class="fs-btn"><span class="fs-ico">&#8982;</span>`
  + `<span class="fs-btn-label">Layar penuh</span></button></div>`
  + `<p class="note">Kontrol: seret dan lepas dengan mouse atau sentuhan. Progres dan log hasil tersimpan di browser ini.</p>`;

/* --------------------------------------------------------------- driver --- */
const DRIVER = (scenario, label, W, H) => `<script>
(function () {
  function finish(obj) {
    var b = document.createElement('div'); b.id = '__vp';
    b.textContent = JSON.stringify(obj); document.body.appendChild(b);
  }
  try {
    var NC = globalThis.__NC;
    if (!NC) throw new Error('__NC tidak ada');
    var cv = document.getElementById('c');
    var VT = 1000; performance.now = function () { return VT; };
    var draw = function () { NC.newFrame(); var s = NC.scene(); s.draw(); if (s.tick) s.tick(); };
    var ne = document.getElementById('nama'); if (ne) ne.value = 'Siswa SINOVA';
    draw();
    ${scenario}
    draw(); draw();
    var b = document.body.getBoundingClientRect();
    var r = cv.getBoundingClientRect();
    var ratio = r.width / r.height;
    var stageOk = Math.abs(b.width - ${W}) < 1.5 && Math.abs(b.height - ${H}) < 1.5;
    var fits = r.left >= b.left - 1 && r.top >= b.top - 1 && r.right <= b.right + 1 && r.bottom <= b.bottom + 1;
    var ok = stageOk && fits && Math.abs(ratio - 960 / 600) < 0.03;
    finish({
      scene: ${JSON.stringify(label)},
      cvRect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      stage: [Math.round(b.width), Math.round(b.height)], ratio: +ratio.toFixed(4),
      attr: cv.width + 'x' + cv.height, ok: ok, stageOk: stageOk, fits: fits,
      phase: (NC.scene() && NC.scene().phase) || null
    });
  } catch (e) {
    finish({ scene: ${JSON.stringify(label)}, error: String(e && e.message), stack: String(e && e.stack).slice(0, 260) });
  }
})();
</script>`;

const SCENES = {
  'dashboard': ['menuScene', 'NC.go(NC.scenes.menuScene);'],
  'pilih-level': ['levelsScene', 'NC.go(NC.scenes.levelsScene);'],
  'level-1': ['level1', 'NC.save.teacher = true; NC.startLevel(0);'],
  'level-2': ['level2', 'NC.save.teacher = true; NC.startLevel(1);'],
  'level-3': ['level3', 'NC.save.teacher = true; NC.startLevel(2);'],
  'level-4': ['level4', 'NC.save.teacher = true; NC.startLevel(3);'],
  'level-5': ['level5', 'NC.save.teacher = true; NC.startLevel(4);'],
};

const game = createGameHTML();
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const names = only.length ? only : Object.keys(SCENES);

let fails = 0;
for (const res of RES_LIST) {
  const [W, H] = res.split('x').map(Number);
  console.log('\n== ' + res + ' ==');
  for (const name of names) {
    const sc = SCENES[name];
    if (!sc) { console.log('  (tidak dikenal) ' + name); continue; }

    const file = path.join(TMP, 'vp.html');
    fs.writeFileSync(file,
      game
        .replace('</head>', pin(W, H) + '\n</head>')
        .replace('<body>', '<body>\n' + CHROME_HTML + '\n<script>window.requestAnimationFrame = function () { return 0; };</script>')
        .replace('</body>', DRIVER(sc[1], sc[0], W, H) + '\n</body>'),
      'utf8');

    const png = path.join(OUT, 'vp-' + res + '-' + name + '.png');
    fs.rmSync(png, { force: true });
    const base = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--hide-scrollbars', '--force-device-scale-factor=1',
      '--window-size=' + (W + 60) + ',' + (H + 130),
      'file:///' + file.replace(/\\/g, '/')];
    execFileSync(CHROME, base.concat('--screenshot=' + png), { stdio: 'pipe', timeout: 90000 });
    const dom = execFileSync(CHROME, base.concat('--dump-dom'), { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 90000 });
    if (fs.existsSync(png)) crop(png, W, H);

    const m = dom.match(/<div id="__vp">([\s\S]*?)<\/div>/);
    let info = { error: 'debug tidak ada' };
    if (m) { try { info = JSON.parse(m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')); } catch (e) { info = { error: 'parse gagal' }; } }
    const ok = !!info.ok;
    if (!ok) fails++;
    const detail = info.error ? ('ERROR ' + info.error)
      : ('stage=' + JSON.stringify(info.stage) + ' cv=' + JSON.stringify(info.cvRect)
        + ' ratio=' + info.ratio + ' attr=' + info.attr + (info.phase ? ' fase=' + info.phase : ''))
        + (info.ok ? '' : ('  [stageOk=' + info.stageOk + ' fits=' + info.fits + ']'));
    const exists = fs.existsSync(png);
    console.log('  ' + (ok && exists ? 'OK   ' : 'GAGAL') + '  ' + name.padEnd(12) + detail);
  }
}

console.log('\n' + (fails ? fails + ' adegan GAGAL (kanvas terpotong / rasio rusak / ukuran panggung beda)'
  : 'Semua adegan lulus: kanvas mengisi viewport, rasio 960:600 utuh, ukuran gambar pas.'));
console.log('PNG -> tools/shots/vp-<lebar>x<tinggi>-<adegan>.png');
process.exit(fails ? 1 : 0);
