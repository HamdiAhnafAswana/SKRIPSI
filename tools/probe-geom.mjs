// ============================================================================
//  UJI GEOMETRI KABEL LEVEL 2  --  node tools/probe-geom.mjs
//
//  Bedanya dengan play2.mjs: play2.mjs memeriksa LOGIKA (slot terisi, skor,
//  langkah maju). Script ini memeriksa TAMPILAN, dengan merekam operasi
//  canvas yang benar-benar digambar game lalu mengukurnya:
//
//   1. 8 titik tambat tersebar merata di mulut jaket, urutannya = acak awal
//   2. titik tambat TIDAK PERNAH bergeser saat diseret / dipasang / ditukar
//   3. ujung atas mendarat tepat di tengah slot
//   4. semua kabel digambar SEBELUM selubung => pangkal tertutup jaket
//   5. ujung bawah kabel selalu DI DALAM selubung, tidak keluar dari mulut
//   6. ketebalan kabel konstan di sepanjang kurva
//   7. kabel melengkung (bukan batang lurus), pangkal tetap di titik tambat
//   8. panjang kabel dibatasi dari titik tambat
//   9. label nama kabel tidak menutupi kotak slot tujuan
//
//  Stub canvas di sini mencatat moveTo/lineTo/fill/stroke/clip/fillText
//  beserta isi warna, jadi level 2 diuji lewat HASIL GAMBARNYA, bukan
//  dengan membaca source.
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

/* ---------- stub canvas yang mencatat setiap operasi, berurutan ---------- */
let LOG = [];
const rec = (op, a) => LOG.push(Object.assign({ op }, a));
const CTX_STUB = () => {
  const base = {
    canvas: { width: 960, height: 600 },
    measureText: t => ({ width: String(t).length * 7 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createPattern: () => ({}),
    getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    createImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    moveTo: (x, y) => rec('moveTo', { x, y }),
    lineTo: (x, y) => rec('lineTo', { x, y }),
    bezierCurveTo: (a1, b1, a2, b2, a3, b3) => rec('bezierCurveTo', { a1, b1, a2, b2, a3, b3 }),
    quadraticCurveTo: (cx, cy, x, y) => rec('quadraticCurveTo', { cx, cy, x, y }),
    arc: (x, y) => rec('arc', { x, y }),
    arcTo: (x1, y1, x2, y2) => rec('arcTo', { x1, y1, x2, y2 }),
    closePath: () => rec('closePath', {}),
    beginPath: () => rec('beginPath', {}),
    fill: () => rec('fill', { fill: base.fillStyle }),
    stroke: () => rec('stroke', { stroke: base.strokeStyle }),
    clip: () => rec('clip', {}),
    save: () => rec('save', {}),
    restore: () => rec('restore', {}),
    fillRect: (x, y, w, h) => rec('fillRect', { x, y, w, h, fill: base.fillStyle }),
    fillText: (s, x, y) => rec('fillText', { s: String(s), x, y }),
  };
  return new Proxy(base, {
    get: (t, k) => (k in t ? t[k] : () => { }),
    set: (t, k, v) => (t[k] = v, true),
  });
};

const store = new Map(), listeners = new Map();
const noop = () => {};
const onOff = { addEventListener: (k, f) => listeners.set(k, f), removeEventListener: noop };
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
  navigator: { hardwareConcurrency: 8, userAgent: 'node-geom', clipboard: { writeText: () => Promise.resolve() } },
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
function frame() { NC.newFrame(); const sc = NC.scene(); sc.draw(); if (sc.tick) sc.tick(); }
function frames(n) { for (let i = 0; i < n; i++) frame(); }
function click(x, y) {
  const sc = NC.scene(); NC.mouse().x = x; NC.mouse().y = y; frame();
  const bs = NC.btns(); let f = null;
  for (let i = bs.length - 1; i >= 0; i--) if (NC.inR({ x, y }, bs[i])) { f = bs[i].fn; break; }
  if (f) f(); else if (sc.down) sc.down({ x, y });
  if (sc.up) sc.up({ x, y });
  frame();
}
async function settle(lv, max = 40) { for (let i = 0; i < max; i++) { frames(2); if (!lv.anim) return true; await wait(70); } return false; }
/* sandbox memakai Date.now() sebagai performance.now(): tanpa jeda nyata,
   tween berbasis waktu tidak akan maju sama sekali. */
async function advance(ms) { const n = Math.ceil(ms / 60); for (let i = 0; i < n; i++) { frame(); await wait(60); } }

/* ---------- konstanta layout level 2 (sama persis dengan src) ---------- */
const INTRO_MULAI = { x: 480, y: 52 + 430 + 23 };
const CARD_L = i => ({ x: 86, y: 120 + i * 88 });
const PIN = { x: 280, w: 400 }, SLOT_W = 40, SLOT_GAP = 8;
const PIN_PADX = (PIN.w - (SLOT_W * 8 + SLOT_GAP * 7)) / 2;
const slotX = i => PIN.x + PIN_PADX + i * (SLOT_W + SLOT_GAP);
const slotCX = i => slotX(i) + SLOT_W / 2;
const SLOT_TOP = 116, SLOT_BOT = 180, SLOT_MID = 150, SLOT_SEAT = 132;
const BASE_X0 = 396, CON_STEP = 24, CON_W = 18;
const WIRE_B = 396, ANCHOR_DY = 26, JACKET_X0 = 370, JACKET_X1 = 590;
const LOOSE_Y = 306;
const T568B = ['wo', 'o', 'wg', 'b', 'wb', 'g', 'wbr', 'br'];
const NAMES = {
  wo: 'Putih-Oranye', o: 'Oranye', wg: 'Putih-Hijau', b: 'Biru',
  wb: 'Putih-Biru', g: 'Hijau', wbr: 'Putih-Coklat', br: 'Coklat'
};

/* ---------- util analisis log ---------- */
const WIRE_FILLS = new Set(['#f6efe0', '#f97316', '#16a34a', '#2563eb', '#8b5a2b']);
const JACKET_FILL = '#64748b';
const wireIdx = () => {
  const a = [];
  for (let i = 0; i < LOG.length; i++) if (LOG[i].op === 'fill' && WIRE_FILLS.has(LOG[i].fill)) a.push(i);
  return a;
};
const jacketIdx = () => {
  for (let i = 0; i < LOG.length; i++) if (LOG[i].op === 'fill' && LOG[i].fill === JACKET_FILL) return i;
  return -1;
};
/* titik-titik path yang dibangun sebelum operasi (fill/stroke/clip) di indeks i */
function ptsBefore(i) {
  const pts = [];
  for (let k = i - 1; k >= 0; k--) {
    const o = LOG[k];
    if (o.op === 'fill' || o.op === 'stroke' || o.op === 'clip' || o.op === 'beginPath') break;
    if (o.op === 'moveTo' || o.op === 'lineTo') pts.unshift({ x: o.x, y: o.y });
  }
  return pts;
}
const bb = p => ({
  x0: Math.min.apply(null, p.map(q => q.x)), x1: Math.max.apply(null, p.map(q => q.x)),
  y0: Math.min.apply(null, p.map(q => q.y)), y1: Math.max.apply(null, p.map(q => q.y)),
});

let bad = 0, passed = 0;
const ok = (l, c, e) => { c ? passed++ : bad++; console.log((c ? '  OK    ' : '  GAGAL ') + l + (e ? '   [' + e + ']' : '')); };

async function main() {
  let KAB = null;
  /* kunci ujung atas pada suatu titik: meniru kabel yang sedang diseret */
  const hold = (id, x, y) => {
    KAB.tip[id] = { x: x, y: y, vx: 0, vy: 0 };
    KAB.mov[id] = { sx: x, sy: y, tx: x, ty: y, t0: Date.now(), dur: 1e6 };
  };
  /* seret satu kabel dari kipas ke slot, seperti pemain sungguhan */
  const dragToSlot = (sc, slotI) => {
    const src = KAB.loose.indexOf(T568B[slotI]), x0 = BASE_X0 + src * CON_STEP;
    NC.mouse().x = x0; NC.mouse().y = LOOSE_Y; frame();
    sc.down({ x: x0, y: LOOSE_Y });
    for (let s = 1; s <= 8; s++) {
      sc.move({
        x: x0 + (slotCX(slotI) - x0) * (s / 8),
        y: LOOSE_Y + (SLOT_MID - LOOSE_Y) * (s / 8)
      });
      frame();
    }
    sc.up({ x: slotCX(slotI), y: SLOT_MID });
    frames(2);
    return KAB.loose[src];
  };
  /* kosongkan semua slot lalu kembalikan semua kabel ke kipas dalam keadaan diam */
  const resetToFan = (sc) => {
    sc.KAB.slots = new Array(8).fill(null);
    sc.inBox = 0; sc.step = 2; sc.sel = null; sc.drag = null;
    KAB.loose.forEach(id => { KAB.mov[id] = null; hold(id, KAB.anchor[id].x, 216); });
    frame();
  };

  NC.save.teacher = true; NC.save.unlocked = 5;
  NC.startLevel(1); frame(); click(INTRO_MULAI.x, INTRO_MULAI.y);
  const sc = NC.scene();
  KAB = sc.KAB;
  await settle(sc); frames(2);
  click(CARD_L(0).x, CARD_L(0).y); await settle(sc); frames(2);   // sarung tangan
  click(CARD_L(1).x, CARD_L(1).y); await settle(sc); frames(2);   // pengupas kabel
  resetToFan(sc); LOG = []; frame();

  console.log('== 1. TITIK TAMBAT DI MULUT JAKET ==');
  const axs = KAB.loose.map(id => KAB.anchor[id].x);
  const even = axs.every((v, i) => v === BASE_X0 + i * CON_STEP);
  ok('8 titik tambat tersebar merata di lebar mulut jaket', new Set(axs).size === 8 && even, axs.join(','));
  ok('urutan titik tambat = urutan acak awal kabel', even, 'loose=' + KAB.loose.join(','));
  ok('seluruh titik tambat berada di dalam lebar selubung (220 px)',
    axs[0] - CON_W / 2 >= JACKET_X0 && axs[7] + CON_W / 2 <= JACKET_X1,
    (axs[0] - CON_W / 2) + ' .. ' + (axs[7] + CON_W / 2) + ' dalam ' + JACKET_X0 + ' .. ' + JACKET_X1);

  console.log('\n== 2. ANCHOR TETAP SAAT DISERET & DIPASANG ==');
  const snap = () => KAB.loose.map(id => KAB.anchor[id].x + '@' + KAB.anchor[id].y).join('|');
  const before = snap();
  for (const slotI of [0, 7, 3]) {
    const id = dragToSlot(sc, slotI);
    ok('seret ke slot ' + (slotI + 1) + ' -> semua anchor tetap', snap() === before);
    await advance(700);
    ok('  ujung atas mendarat tepat di tengah slot ' + (slotI + 1),
      Math.abs(KAB.tip[id].x - slotCX(slotI)) < 2 && Math.abs(KAB.tip[id].y - SLOT_SEAT) < 2,
      '(' + KAB.tip[id].x.toFixed(1) + ',' + KAB.tip[id].y.toFixed(1) + ') vs slot (' +
      slotCX(slotI) + ',' + SLOT_SEAT + ')');
  }
  ok('pertukaran isi slot tidak mengubah anchor', snap() === before);

  console.log('\n== 3-6. URUTAN GAMBAR & BENTUK KABEL ==');
  resetToFan(sc); LOG = []; frame();
  const wi = wireIdx(), ji = jacketIdx();
  ok('8 konduktor tergambar', wi.length === 8, wi.length + ' operasi isi');
  ok('selubung digambar DI ATAS semua kabel => pangkal tertutup jaket',
    ji > 0 && wi.every(i => i < ji), 'kabel terakhir #' + wi[wi.length - 1] + ' < selubung #' + ji);
  const boxes = wi.map(i => ptsBefore(i));
  ok('ujung bawah tiap kabel berada DI DALAM selubung (tepi atas ' + WIRE_B + ')',
    boxes.every(p => bb(p).y1 > WIRE_B), 'y bawah: ' + boxes.map(p => bb(p).y1.toFixed(0)).join(','));
  ok('tidak ada kabel yang keluar dari selubung / leher RJ-45',
    boxes.every(p => bb(p).y0 > 100), 'y atas: ' + boxes.map(p => bb(p).y0.toFixed(0)).join(','));
  const widths = boxes.map(p => +(bb(p).x1 - bb(p).x0).toFixed(2));
  ok('lebar kawat di kipas = CON_W, seragam', new Set(widths).size === 1 && Math.abs(widths[0] - CON_W) < 0.6,
    [...new Set(widths)].join(','));
  /* ketebalan KONSTAN: poligon tabung menaruh titik tengah di sisi kiri lalu
     sisi kanan, jadi jarak tiap pasangan simetris selalu 2 x (CON_W/2). */
  const th = boxes.map(p => {
    const L = p.length, ds = [];
    for (let i = 0; i < Math.floor((L - 7) / 2); i++) {
      ds.push(Math.hypot(p[L - 1 - i].x - p[i].x, p[L - 1 - i].y - p[i].y));
    }
    return { lo: Math.min.apply(null, ds), hi: Math.max.apply(null, ds) };
  });
  ok('ketebalan kabel KONSTAN di sepanjang kurva (= ' + CON_W + ')',
    th.every(t => Math.abs(t.lo - CON_W) < 0.05 && Math.abs(t.hi - CON_W) < 0.05),
    th.map(t => t.lo.toFixed(2) + '..' + t.hi.toFixed(2)).join(' '));
  ok('pangkal tiap kabel tepat di titik tambat, keluar tegak dari mulut',
    boxes.every((p, k) => {
      const b = bb(p), ax = KAB.anchor[KAB.loose[k]].x;
      return Math.abs((b.x0 + b.x1) / 2 - ax) < 0.6 && Math.abs(b.y1 - (WIRE_B + ANCHOR_DY)) < 0.6;
    }), 'y1=' + bb(boxes[0]).y1.toFixed(1) + ' (harus ' + (WIRE_B + ANCHOR_DY) + ')');

  console.log('\n== 7. KABEL MELENGKUNG, PANJANG DIBATASI ==');
  const id0 = KAB.loose[0], ax0 = KAB.anchor[id0].x;
  hold(id0, ax0 + 250, 140);
  frame(); LOG = []; frame();
  /* tanpa lv.drag, konduktor digambar urut KAB.loose -> indeks 0 = id0 */
  const bent = ptsBefore(wireIdx()[0]), bbent = bb(bent);
  ok('kabel melengkung, bukan batang lurus kaku',
    (bbent.x1 - bbent.x0) > CON_W + 20 && (bbent.x1 - bbent.x0) < 340,
    'sebaran x=' + (bbent.x1 - bbent.x0).toFixed(0) + ' px (batang lurus cuma ' + CON_W + ')');
  const bot = bent.filter(q => q.y > WIRE_B + ANCHOR_DY - 0.5);
  const bcx = (Math.min.apply(null, bot.map(q => q.x)) + Math.max.apply(null, bot.map(q => q.x))) / 2;
  ok('pangkal tetap tepat di titik tambat walau ujung atas jauh',
    bot.length >= 2 && Math.abs(bcx - ax0) < 0.6, 'pangkal x=' + bcx.toFixed(1) + ' (anchor ' + ax0 + ')');
  hold(id0, ax0 + 5000, -4000); frame(); frame();
  const len = Math.hypot(KAB.tip[id0].x - ax0, (WIRE_B + ANCHOR_DY) - KAB.tip[id0].y);
  ok('ujung atas berhenti di panjang maksimum dari anchor', len > 300 && len < 600, 'panjang=' + len.toFixed(0) + ' px');
  ok('titik tambat diam di jaket walau pointer ditarik jauh',
    KAB.anchor[id0].x === ax0 && KAB.anchor[id0].y === WIRE_B + ANCHOR_DY);

  console.log('\n== 8. KEDELAPAN KABEL TERPASANG ==');
  for (let i = 0; i < 8; i++) dragToSlot(sc, i);
  await advance(800);
  ok('8 slot terisi sesuai T568B', KAB.slots.join(',') === T568B.join(','), KAB.slots.join(','));
  frame(); LOG = []; frame();
  const w3 = wireIdx(), p3 = w3.map(i => ptsBefore(i));
  ok('seluruh 8 kabel tetap keluar dari dalam selubung',
    p3.length === 8 && p3.every(p => bb(p).y1 > WIRE_B), 'y bawah: ' + p3.map(p => bb(p).y1.toFixed(0)).join(','));
  ok('tidak ada kabel menumpuk di depan / di bawah tepi atas selubung',
    jacketIdx() > w3[w3.length - 1], 'kabel terakhir #' + w3[w3.length - 1] + ' < selubung #' + jacketIdx());
  ok('anchor tetap sama setelah 8 kabel terpasang', snap() === before);

  console.log('\n== 9. LABEL TIDAK MENUTUPI SLOT TUJUAN ==');
  resetToFan(sc);
  let worst = 0, detail = '';
  for (let i = 0; i < 8; i++) {
    const id = KAB.loose[i];
    sc.sel = id;
    frame(); LOG = []; frame();
    let box = null;
    for (let k = 0; k < LOG.length; k++) {
      if (LOG[k].op === 'fillText' && LOG[k].s === NAMES[id]) {
        const lw = NAMES[id].length * 7 + 20;            // stub measureText: panjang * 7
        box = { x0: LOG[k].x - lw / 2, x1: LOG[k].x + lw / 2, y0: LOG[k].y - 16, y1: LOG[k].y + 8 };
      }
    }
    sc.sel = null;
    if (!box) { worst = 1e9; detail = 'label "' + NAMES[id] + '" tidak terdeteksi'; break; }
    for (let s = 0; s < 8; s++) {
      const ox = Math.min(box.x1, slotX(s) + SLOT_W) - Math.max(box.x0, slotX(s));
      const oy = Math.min(box.y1, SLOT_BOT) - Math.max(box.y0, SLOT_TOP);
      if (ox > 0 && oy > 0 && ox * oy > worst) { worst = ox * oy; detail = '"' + NAMES[id] + '" menimpa slot ' + (s + 1); }
    }
  }
  ok('label nama kabel tidak menutupi kotak slot tujuan', worst === 0, detail || '0 tumpang tindih dari 8 label');

  console.log('\n== RINGKASAN ==');
  console.log('  lulus : ' + passed + '\n  gagal : ' + bad);
  console.log('\n==> ' + (bad ? bad + ' UJI GEOMETRI GAGAL' : 'SEMUA UJI GEOMETRI LULUS') + '\n');
  process.exit(bad ? 1 : 0);
}
main();
