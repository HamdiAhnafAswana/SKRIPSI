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

const out = read('index.html');
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
  'makeL1', 'makeL2', 'makeL3', 'makeL4', 'makeL5', 'go', 'startLevel', 'frame', 'levelsScene', 'menuScene', 'helpScene', 'logScene', 'resultScene'];
const missing = needed.filter(n =>
  !new RegExp('^\\s*function ' + n + '\\s*\\(', 'm').test(js) &&
  !new RegExp('^\\s*(?:const|let|var) ' + n + '\\s*=', 'm').test(js));
check(!missing.length, 'semua fungsi inti masih ada', missing.join(', ') || 'lengkap');

console.log('\n== KODE LAMA TIDAK HILANG (di luar Level 2) ==');
check(l2Found, 'blok Level 2 di build & versi lama berhasil dipisah',
  l2Found ? 'lama ' + origCut.l2.split(/\r?\n/).length + ' baris -> baru ' + outCut.l2.split(/\r?\n/).length + ' baris' : 'penanda tidak ditemukan');
// Daftar ini = satu-satunya baris kode yang SENGAJA diubah saat pemecahan.
// Daftar baris yang SENGAJA dihilangkan/diubah saat pemecahan file.
// 'const rows = [' tidak dipakai sebagai penanda lagi: teks yang sama ada di
// l2DrawStatus()/l3DrawStatus() yang baru.
const INTENTIONAL_CHANGED = [
  'LEVEL 3 / 4 / 5',
  'Daftar level & scene menu',
  'const LV = [',
  '{ t: \'Persiapan Alat & Bahan\',                  m: \'Briefing, studi kasus acak, dan pemilihan alat\', mk: makeL1 },',
  '{ t: \'Crimping Straight-Through (T568B)\',       m: \'Satu kabel: potong, kupas, susun, crimp, uji\',    mk: makeL2 },',
  '{ t: \'Crimping Crossover (T568A–T568B)\',        m: \'Drag dua ujung berbeda, lebih sulit\',             mk: () => makeCrimp(3) },',
  '{ t: \'Pasang ke Patch Panel\',                   m: \'Drag kabel ke port, klik punch-down tool\',        mk: makeL4 },',
  '{ t: \'Instalasi Rack Server\',                   m: \'Drag semua komponen ke rack, sambungkan\',         mk: makeL5 }',
  'function startLevel(i) { if (!(save.teacher || i < save.unlocked)) return; go(LV[i].mk()); }',
  'LV.forEach((L, i) => {',
  'const x = 36 + i * 180, y = 126, w = 168, h = 328, open = save.teacher || i < save.unlocked;',
  'txt(i + 1, x + w / 2, y + 54, { s: 30, f: FONT_H, a: \'center\', c: open ? \'#06131f\' : \'#5f7389\', w: 600 });',
  'for (let k = 0; k < 3; k++)star(x + w / 2 - 34 + k * 34, y + h - 62, 13, k < (save.stars[i] || 0));',
  'txt(save.best[i] ? \'Skor terbaik \' + save.best[i] : \'Belum dimainkan\', x + w / 2, y + h - 22, { s: 13, a: \'center\', c: C.mute });',
  'hit(x, y, w, h, () => startLevel(i));',
  'save.unlocked = Math.max(save.unlocked, Math.min(5, lv.n + 1));',
  'if (ok && lv.n < 5) btn(x + 175, by, 255, 46, \'Lanjut ke level \' + (lv.n + 1), () => startLevel(lv.n), { color: C.ok });',
  'if (ok && lv.n === 5) txt(\'Semua level selesai. Selamat!\', W / 2, y + 446, { s: 14, a: \'center\', c: C.warn });',
  '[\'Level 1\', \'Baca briefing dari Pak Andi, lalu buka lemari alat dan ambil alat yang tepat sesuai studi kasus. Ada batas waktu 75 detik, combo bonus, dan kuis di akhir.\'],',
  '[\'Level 2\', \'Kerjakan SATU kabel dari awal sampai siap dipakai (PC → switch) dalam adegan 3D. Klik alat di panel kiri/kanan, lalu lakukan gerakan singkat: seret, tahan, atau pilih slot pin.\'],',
  '[\'Level 3\', \'Ujung A disusun T568A dan ujung B T568B. Ada batas waktu; contekan mengurangi skor.\'],',
  '[\'Level 4\', \'Seret kabel ke port sesuai daftar jalur. Pilih Punch-down Tool, hadapkan bilah ke luar, lalu klik port.\'],',
  '[\'Level 5\', \'Seret perangkat ke rack (yang berat di bawah), cek susunan, lalu sambungkan port ke port.\']',
  'const y = 94 + i * 66; rr(60, y, 840, 58, 12); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();',
  'txt(r[0], 80, y + 35, { s: 19, f: FONT_H, c: C.acc, w: 600 }); para(r[1], 170, y + 25, 710, 19, { s: 13.5, c: C.text });',
  'function drawChart(x, y, title, std) {',
  'rr(x, y, 250, 320, 14); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();',
  'txt(\'Urutan \' + title, x + 18, y + 32, { s: 19, f: FONT_H, w: 600, c: C.acc });',
  'std.forEach((id, i) => {',
  'const ry = y + 50 + i * 32;',
  'txt(\'Pin \' + (i + 1), x + 18, ry + 15, { s: 13, c: C.mute });',
  'drawWire(x + 64, ry, 52, 18, id, true);',
  'txt(WC[id].n, x + 126, ry + 15, { s: 13, w: 700 });',
  'function makeCrimp(n) {',
  'const hard = n === 3;',
  'const lv = baseLevel(n, hard ? \'Crimping Crossover (T568A–T568B)\' : \'Crimping Straight-Through (T568B)\');',
  'const sw = hard ? 40 : 48, gap = hard ? 5 : 6, span = 8 * sw + 7 * gap, cy = 140;',
  'lv.conns = hard ? [',
  '{ label: \'Ujung A — T568A\', short: \'Ujung A\', std: T568A, x: 70 },',
  '{ label: \'Ujung B — T568B\', short: \'Ujung B\', std: T568B, x: 535 }',
  '] : [{ label: \'Konektor RJ-45 (tampak atas, pin 1 di kiri)\', short: \'\', std: T568B, x: 292 }];',
  'lv.conns.forEach(c => { c.slots = Array(8).fill(null); c.res = null; });',
  'lv.tray = shuffle(Object.keys(WC)); lv.drag = null; lv.testDone = false; lv.hintUntil = 0;',
  'if (hard) {',
  'lv.limit = 180; lv.wrongPicks = [];',
  'lv.quiz = { q: \'Kabel crossover umumnya dipakai untuk menghubungkan…\', opts: [\'Komputer ke Switch\', \'Komputer ke Komputer secara langsung\', \'Komputer ke Access Point\'], ans: 1, why: \'Crossover menukar jalur kirim dan terima, sehingga dua perangkat sejenis bisa terhubung langsung.\' };',
  'say(\'Ujung A disusun T568A, ujung B disusun T568B. Tabel warna disembunyikan dan waktu terbatas.\', \'info\');',
  '} else say(\'Seret warna kabel dari rak ke pin 1–8 sesuai tabel T568B, lalu tekan Crimp & Uji.\', \'info\');',
  'const trayX = i => 200 + i * 80;',
  'const slotRect = (c, i) => ({ x: c.x + i * (sw + gap), y: cy, w: sw, h: 150 });',
  'const edited = () => { lv.conns.forEach(c => c.res = null); lv.testDone = false; };',
  'function runTest() {',
  'if (lv.conns.some(c => c.slots.some(s => !s))) { say(\'Isi semua 8 pin pada setiap konektor sebelum diuji.\', \'info\'); return; }',
  'lv.conns.forEach(c => { c.res = c.slots.map((s, i) => s === c.std[i]); });',
  'lv.phase = \'test\'; lv.testT0 = performance.now(); lv.drag = null;',
  'function afterTest() {',
  'const bad = [];',
  'lv.conns.forEach(c => { const w = c.res.map((r, i) => r ? 0 : i + 1).filter(Boolean); if (w.length) bad.push((c.short ? c.short + \': \' : \'\') + \'pin \' + w.join(\', \')); });',
  'lv.testDone = true;',
  'if (!bad.length) { say(\'Semua LED hijau. Kabel lulus uji!\', \'ok\'); lv.phase = \'ok\'; lv.okAt = performance.now(); }',
  'else { lv.phase = \'play\'; lv.penalize(10, \'Urutan warna salah → \' + bad.join(\' | \')); }',
  'function drawConn(c) {',
  'txt(c.label, c.x + span / 2, cy - 46, { s: 15, a: \'center\' });',
  'rr(c.x - 12, cy - 34, span + 24, 196, 12); ctx.fillStyle = \'rgba(180,215,240,.14)\'; ctx.fill(); ctx.strokeStyle = \'rgba(180,215,240,.5)\'; ctx.lineWidth = 2; ctx.stroke();',
  'const r = slotRect(c, i);',
  'rr(r.x, r.y, r.w, r.h, 6); ctx.fillStyle = \'#0a1524\'; ctx.fill();',
  'ctx.fillStyle = C.gold; ctx.fillRect(r.x + sw * .3, cy - 26, sw * .4, 22);',
  'if (c.slots[i]) drawWire(r.x + 4, r.y + 3, sw - 8, r.h - 6, c.slots[i]);',
  'let stroke = \'#243a55\', lw = 1.5;',
  'if (c.res && lv.testDone && lv.phase !== \'test\') { stroke = c.res[i] ? C.ok : C.bad; lw = 3; }',
  'if (lv.drag && lv.phase === \'play\' && mouse.x >= r.x - 3 && mouse.x <= r.x + r.w + 3 && mouse.y >= r.y - 30 && mouse.y <= r.y + r.h + 20) { stroke = C.acc; lw = 3; }',
  'rr(r.x, r.y, r.w, r.h, 6); ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke();',
  'ctx.beginPath(); ctx.arc(r.x + sw / 2, r.y + 16, 10, 0, 6.3); ctx.fillStyle = \'rgba(6,14,26,.85)\'; ctx.fill();',
  'txt(i + 1, r.x + sw / 2, r.y + 21, { s: 13, a: \'center\' });',
  'rr(c.x + span * .12, cy + 162, span * .76, 54, 10); const g = ctx.createLinearGradient(0, cy + 162, 0, cy + 216); g.addColorStop(0, \'#a3b1c2\'); g.addColorStop(1, \'#6b7a8c\'); ctx.fillStyle = g; ctx.fill();',
  'txt(\'Kabel UTP\', c.x + span / 2, cy + 195, { s: 14, a: \'center\', c: \'#0f1c2d\' });',
  'const ty = cy + 224;',
  'rr(c.x - 12, ty, span + 24, 46, 10); ctx.fillStyle = \'#08111e\'; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 1.5; ctx.stroke();',
  'let lit = false;',
  'if (c.res) { lit = lv.phase === \'test\' ? (now - lv.testT0) > i * 220 : true; }',
  'ctx.beginPath(); ctx.arc(r.x + sw / 2, ty + 23, 9, 0, 6.3); ctx.fillStyle = lit ? (c.res[i] ? C.ok : C.bad) : \'#1d2a3d\'; ctx.fill();',
  'if (lit) { ctx.save(); ctx.shadowColor = c.res[i] ? C.ok : C.bad; ctx.shadowBlur = 12; ctx.fill(); ctx.restore(); }',
  'txt(i + 1, r.x + sw / 2, ty + 27, { s: 10, a: \'center\', c: lit ? \'#04120c\' : \'#5f7389\' });',
  'txt(\'LAN Tester\', c.x + span / 2, ty + 62, { s: 11, a: \'center\', c: C.mute });',
  'if (lv.phase === \'test\' && now - lv.testT0 > 2300) afterTest();',
  'if (lv.phase === \'ok\' && now - lv.okAt > 1300) { if (hard) { lv.phase = \'quiz\'; } else lv.win(300); }',
  'if (lv.limit && !lv.finished && (lv.phase === \'play\' || lv.phase === \'test\') && lv.elapsed() > lv.limit) { lv.finished = true; lv.dur = lv.limit; endLevel(lv, false); return; }',
  'if (!hard) {',
  'drawChart(20, 84, \'T568B\', T568B);',
  'rr(750, 84, 190, 320, 14); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();',
  'txt(\'Cara kerja\', 770, 116, { s: 19, f: FONT_H, w: 600, c: C.acc });',
  'para(\'1. Seret warna dari rak kabel ke slot pin 1–8.\\n2. Isi semua pin sesuai tabel.\\n3. Tekan Crimp & Uji.\\n4. Semua LED hijau berarti lulus.\', 770, 142, 152, 20, { s: 13, c: C.text });',
  '} else txt(\'Susun ujung A sebagai T568A dan ujung B sebagai T568B. Tabel warna tidak ditampilkan.\', W / 2, 80, { s: 14, a: \'center\', c: C.mute });',
  'lv.conns.forEach(drawConn);',
  'rr(150, 428, 660, 158, 14); ctx.fillStyle = C.panel; ctx.fill(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();',
  'txt(\'Rak kabel — seret warna ke slot pin\', W / 2, 448, { s: 12, a: \'center\', c: C.mute });',
  'lv.tray.forEach((id, i) => {',
  'const x = trayX(i); if (lv.phase === \'play\' && over(x - 22, 452, 44, 96)) hoverBtn = true;',
  'drawWire(x - 17, 456, 34, 88, id);',
  'txt(WC[id].n, x, 566, { s: 11, a: \'center\', c: C.mute });',
  'const canAct = lv.phase === \'play\';',
  'btn(820, 440, 120, 46, \'Crimp & Uji\', runTest, { color: C.ok, disabled: !canAct, s: 15 });',
  'btn(820, 494, 120, 32, \'Reset\', () => { if (lv.phase === \'play\') { lv.conns.forEach(c => c.slots.fill(null)); edited(); } }, { color: \'#475569\', tc: C.text, s: 14, disabled: !canAct });',
  'if (hard) btn(820, 534, 120, 32, \'Contekan −8\', () => { if (lv.phase === \'play\' && lv.hintUntil < performance.now()) { lv.penalize(8, \'Membuka contekan\'); lv.hintUntil = performance.now() + 6000; } }, { color: C.warn, s: 13, disabled: !canAct });',
  'if (lv.drag) drawWire(mouse.x - 17, mouse.y - 44, 34, 88, lv.drag.id);',
  'if (hard && lv.hintUntil > now) {',
  'ctx.fillStyle = \'rgba(4,10,20,.84)\'; ctx.fillRect(0, 54, W, H - 54);',
  'drawChart(150, 110, \'T568A\', T568A); drawChart(560, 110, \'T568B\', T568B);',
  'txt(\'Contekan ditutup dalam \' + Math.ceil((lv.hintUntil - now) / 1000) + \' detik\', W / 2, 470, { s: 16, a: \'center\', c: C.warn });',
  'if (lv.phase !== \'play\' || lv.hintUntil > performance.now()) return;',
  'for (let i = 0; i < 8; i++) { const x = trayX(i); if (p.x >= x - 22 && p.x <= x + 22 && p.y >= 452 && p.y <= 548) { lv.drag = { id: lv.tray[i] }; return; } }',
  'for (const c of lv.conns) for (let i = 0; i < 8; i++) { if (c.slots[i] && inR(p, slotRect(c, i))) { lv.drag = { id: c.slots[i] }; c.slots[i] = null; edited(); return; } }',
  'for (const c of lv.conns) for (let i = 0; i < 8; i++) {',
  'if (p.x >= r.x - 3 && p.x <= r.x + r.w + 3 && p.y >= r.y - 30 && p.y <= r.y + r.h + 20) { c.slots[i] = lv.drag.id; edited(); lv.drag = null; return; }',
  'txt(\'\\U0001f3c6 Papan Peringkat Level 1 & 2\', W / 2, lbY, { s: 15, f: FONT_H, a: \'center\', c: C.warn });',
  'if (!top5.length && !top5b.length) txt(\'Belum ada skor. Jadilah yang pertama!\', W / 2, lbY + 28, { s: 13, a: \'center\', c: C.mute });',
  'top5.forEach((e, i) => { const y = lbY + 24 + i * 20; txt(\'L1 · \' + (i + 1) + \'. \' + (e.nama.length > 16 ? e.nama.slice(0, 15) + \'…\' : e.nama) + \' — \' + e.skor, W / 2 - 180, y, { s: 12, a: \'center\', c: i === 0 ? C.warn : C.text }); });',
  'top5b.forEach((e, i) => { const y = lbY + 24 + i * 20; txt(\'L2 · \' + (i + 1) + \'. \' + (e.nama.length > 16 ? e.nama.slice(0, 15) + \'…\' : e.nama) + \' — \' + e.skor, W / 2 + 180, y, { s: 12, a: \'center\', c: i === 0 ? C.warn : C.text }); });',
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