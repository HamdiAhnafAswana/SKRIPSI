// =====================================================================================================
//  TANGKAP LAYAR APLIKASI NYATA  --  node tools/shot-live.mjs [--url=http://localhost:4173/] [adegan ...]
//
//  Menjalankan build React yang sebenarnya (dist/) di Chrome headless, melewati
//  onboarding lewat localStorage, lalu mengemudi kanvas asli lewat Chrome DevTools
//  Protocol (Input.dispatchMouseEvent). Ukuran viewport ditekan paksa lewat
//  Emulation.setDeviceMetricsOverride sehingga persis 1920x1080 / 1366x768 / 390x844
//  (lebar jendela Chrome di Windows tidak bisa di bawah ~484px, jadi penimpaan wajib).
//
//  Pemeriksaan per adegan: nama adegan engine benar (klik benar-benar bekerja),
//  kanvas muat penuh di wadahnya, rasio logis 960:600 utuh, ukuran .app == viewport,
//  tanpa scroll halaman, dan onboarding sudah terlewati.
//
//  Server preview: kalau --url tidak diberikan, tool ini menjalankan `npx vite preview`
//  sendiri di port acak lalu membereskannya di akhir. Server preview yang sudah jalan
//  (npm run preview) bisa dipakai lewat --url.
// =====================================================================================================
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tools', 'shots');
fs.mkdirSync(OUT, { recursive: true });

if (typeof globalThis.WebSocket !== 'function') {
  console.log('Butuh Node >= 22 (global WebSocket) untuk Chrome DevTools Protocol.');
  process.exit(1);
}

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(p => fs.existsSync(p));
if (!CHROME) { console.log('Chrome/Edge tidak ditemukan'); process.exit(1); }

const RES_LIST = (process.env.RES ? [process.env.RES] : ['1920x1080', '1366x768', '390x844'])
  .filter(r => /^\d+x\d+$/.test(r));

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ------------------------------ seed localStorage (lewati onboarding) ------------------------------ */
const SEED = [
  'try {',
  "  localStorage.setItem('sinova_student', JSON.stringify({ nama: 'Siswa SINOVA', kelas: 'X TKJ 1', absen: '1' }));",
  "  localStorage.setItem('sinova_tutorial_completed', 'true');",
  "  localStorage.setItem('netcrimp_v1', JSON.stringify({ unlocked: 5, stars: [0,0,0,0,0], best: [0,0,0,0,0], teacher: true }));",
  "  localStorage.setItem('netcrimp_v1_nama', 'Siswa SINOVA');",
  '} catch (e) {}',
].join('\n');

const MEASURE = [
  '(() => {',
  "  const cv = document.getElementById('c');",
  "  if (!cv) return { error: 'canvas tidak ada', scene: 'none' };",
  "  const cont = document.querySelector('.game-container');",
  "  const app = document.querySelector('.app');",
  '  const r = cv.getBoundingClientRect();',
  '  const c = cont ? cont.getBoundingClientRect() : r;',
  "  let sceneLabel = 'unknown';",
  '  try {',
  "    if (typeof scene !== 'undefined') {",
  "      if (typeof menuScene !== 'undefined' && scene === menuScene) sceneLabel = 'menu';",
  "      else if (typeof levelsScene !== 'undefined' && scene === levelsScene) sceneLabel = 'levels';",
  "      else if (typeof helpScene !== 'undefined' && scene === helpScene) sceneLabel = 'help';",
  "      else if (typeof logScene !== 'undefined' && scene === logScene) sceneLabel = 'log';",
  "      else sceneLabel = 'level:' + (scene.phase || '?');",
  '    }',
  "  } catch (e) { sceneLabel = 'err:' + e.message; }",
  '  return {',
  '    scene: sceneLabel,',
  '    canvas: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],',
  '    cont: [Math.round(c.width), Math.round(c.height)],',
  '    app: app ? [app.offsetWidth, app.offsetHeight] : null,',
  '    win: [innerWidth, innerHeight],',
  '    ratio: +(r.width / r.height).toFixed(4),',
  '    attr: cv.width + "x" + cv.height,',
  '    scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],',
  "    overlay: !!document.querySelector('.sinova-overlay'),",
  "    fsBtn: !!document.querySelector('.fs-btn'),",
  "    note: !!document.querySelector('.note')",
  '  };',
  '})()',
].join('\n');

const CANVAS_RECT = [
  '(() => {',
  "  const b = document.getElementById('c').getBoundingClientRect();",
  '  return { l: b.left, t: b.top, w: b.width, h: b.height };',
  '})()',
].join('\n');

// Koordinat logis 960x600 (lihat ui/20-scenes.js: tombol menu & kartu level)
const L = {
  mulaiBermain: [480, 247],
  card: i => [120 + 180 * i, 290],
};

const SCENES = {
  'dashboard': {},
  'pilih-level': { menu: true },
  'level-1': { menu: true, card: 0 },
  'level-2': { menu: true, card: 1 },
  'level-3': { menu: true, card: 2 },
  'level-4': { menu: true, card: 3 },
  'level-5': { menu: true, card: 4 },
};

/* --------------------------------------- util server / chrome -------------------------------------- */
function httpJson(url, timeout = 1000) {
  return new Promise((res, rej) => {
    const r = http.get(url, x => {
      let d = '';
      x.on('data', c => { d += c; });
      x.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
    });
    r.on('error', rej);
    const t = setTimeout(() => { r.destroy(); rej(new Error('timeout')); }, timeout);
    r.on('close', () => clearTimeout(t));
  });
}
async function waitHttp(url, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try { const s = await httpJson(url); if (s) return true; } catch (e) { /* retry */ }
    await sleep(250);
  }
  return false;
}

/* ------------------------------------------------- main --------------------------------------------- */
let preview = null;
const argUrl = process.argv.find(a => a.startsWith('--url='));
let url = argUrl ? argUrl.slice(6) : (process.env.SINOVA_URL || '');
if (!url) {
  const port = 4310 + Math.floor(Math.random() * 80);
  url = 'http://localhost:' + port + '/';
  preview = spawn('npx', ['vite', 'preview', '--port=' + port, '--strictPort'], { cwd: ROOT, shell: true, stdio: 'ignore' });
  console.log('menjalankan vite preview di ' + url);
  if (!await waitHttp(url)) { console.log('gagal menjalankan server preview'); process.exit(1); }
}
console.log('URL: ' + url);

const udd = path.join(os.tmpdir(), 'sinova-live-' + Math.random().toString(36).slice(2, 8));
const dbgPort = 9400 + Math.floor(Math.random() * 300);
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--user-data-dir=' + udd,
  '--remote-debugging-port=' + dbgPort,
  '--window-size=1920,1080',
  'about:blank',
], { stdio: 'ignore' });

let chromeDown = false;
function shutdown() {
  if (chromeDown) return;
  chromeDown = true;
  try { execFileSync('taskkill', ['/F', '/T', '/PID', String(chrome.pid)], { stdio: 'ignore' }); } catch (e) { /* sudah mati */ }
  if (preview) { try { execFileSync('taskkill', ['/F', '/T', '/PID', String(preview.pid)], { stdio: 'ignore' }); } catch (e) { /* ignore */ } }
}
process.on('exit', shutdown);
process.on('SIGINT', () => { shutdown(); process.exit(130); });

let wsUrl = null;
for (let i = 0; i < 80 && !wsUrl; i++) {
  try { const j = await httpJson('http://127.0.0.1:' + dbgPort + '/json/version'); wsUrl = j.webSocketDebuggerUrl; } catch (e) { await sleep(250); }
}
if (!wsUrl) { console.log('gagal terhubung ke Chrome DevTools'); process.exit(1); }

const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('WebSocket gagal')); });

let mid = 0;
const pend = new Map();
const evs = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) {
    const pair = pend.get(m.id);
    pend.delete(m.id);
    if (m.error) pair.rej(new Error(JSON.stringify(m.error)));
    else pair.res(m.result);
  } else if (m.method) {
    evs.push(m);
  }
};
function send(method, params, sessionId) {
  return new Promise((res, rej) => {
    const id = ++mid;
    pend.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}
function evWait(method, sessionId, timeout = 20000) {
  return new Promise(res => {
    const t0 = Date.now();
    const tick = () => {
      const i = evs.findIndex(m => m.method === method && m.sessionId === sessionId);
      if (i >= 0) { evs.splice(i, 1); return res(true); }
      if (Date.now() - t0 > timeout) return res(false);
      setTimeout(tick, 60);
    };
    tick();
  });
}

const t = await send('Target.createTarget', { url: 'about:blank' });
const at = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
const sid = at.sessionId;

await send('Page.enable', {}, sid);
await send('Runtime.enable', {}, sid);

async function evalJs(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }, sid);
  if (r.exceptionDetails) throw new Error('evaluate gagal: ' + JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function click(logical) {
  const b = await evalJs(CANVAS_RECT);
  const x = b.l + logical[0] * b.w / 960;
  const y = b.t + logical[1] * b.h / 600;
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x, y: y, button: 'none' }, sid);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: x, y: y, button: 'left', clickCount: 1, buttons: 1 }, sid);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x, y: y, button: 'left', clickCount: 1, buttons: 0 }, sid);
  await sleep(450);
}
async function load() {
  evs.length = 0;
  await send('Page.navigate', { url: url }, sid);
  await evWait('Page.loadEventFired', sid, 20000);
  await sleep(2200); // React mount + injeksi engine + rAF mulai menggambar
}

const wanted = process.argv.slice(2).filter(a => !a.startsWith('-'));
const names = wanted.length ? wanted : Object.keys(SCENES);

let fails = 0;
for (const res of RES_LIST) {
  const parts = res.split('x');
  const W = Number(parts[0]);
  const H = Number(parts[1]);
  console.log('\n== ' + res + ' ==');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false }, sid);
  await send('Page.addScriptToEvaluateOnNewDocument', { source: SEED }, sid);

  for (const name of names) {
    const s = SCENES[name];
    if (!s) { console.log('  (adegan tidak dikenal) ' + name); continue; }

    await load();
    if (s.menu) {
      await click(L.mulaiBermain);
      if (s.card !== undefined) await click(L.card(s.card));
      await sleep(300);
    }

    const info = await evalJs(MEASURE);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sid);
    const png = path.join(OUT, 'live-' + res + '-' + name + '.png');
    fs.writeFileSync(png, Buffer.from(shot.data, 'base64'));

    const stageOk = Math.abs(info.cont[0] - info.win[0]) < 2 && Math.abs(info.cont[1] - info.win[1]) < 2;
    const appOk = !!info.app && Math.abs(info.app[0] - info.win[0]) < 2 && Math.abs(info.app[1] - info.win[1]) < 2;
    const fits = info.canvas[0] >= -1 && info.canvas[1] >= -1
      && info.canvas[0] + info.canvas[2] <= info.win[0] + 1 && info.canvas[1] + info.canvas[3] <= info.win[1] + 1;
    const ratioOk = Math.abs(info.ratio - 960 / 600) < 0.03;
    const noScroll = info.scroll[0] <= info.win[0] + 1 && info.scroll[1] <= info.win[1] + 1;
    const want = name === 'dashboard' ? 'menu' : name === 'pilih-level' ? 'levels' : 'level:';
    const sceneOk = info.scene === want || (want === 'level:' && info.scene.indexOf('level:') === 0);
    const ok = !info.error && sceneOk && stageOk && appOk && fits && ratioOk && noScroll && !info.overlay;
    if (!ok) fails++;

    console.log('  ' + (ok ? 'OK   ' : 'GAGAL') + '  ' + name.padEnd(12)
      + 'adegan=' + info.scene
      + ' win=' + JSON.stringify(info.win) + ' cont=' + JSON.stringify(info.cont)
      + ' canvas=' + JSON.stringify(info.canvas) + ' ratio=' + info.ratio
      + ' attr=' + info.attr + (info.note ? '' : ' (note-disembunyikan)'));
    if (!ok) {
      console.log('         [raw=' + JSON.stringify(info) + ']');
      console.log('         [err=' + (info.error || '-') + ' sceneOk=' + sceneOk + ' stageOk=' + stageOk
        + ' appOk=' + appOk + ' fits=' + fits + ' ratioOk=' + ratioOk + ' noScroll=' + noScroll
        + ' overlay=' + info.overlay + ']');
    }
  }
}

try { await send('Target.closeTarget', { targetId: t.targetId }); } catch (e) { /* ignore */ }
try { ws.close(); } catch (e) { /* ignore */ }
shutdown();
process.exit(fails ? 1 : 0);
