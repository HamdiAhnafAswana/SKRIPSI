// ============================================================================
//  PROBE WARNA TITIK-TITIK PENTING LEVEL 2  --  node tools/probe2.mjs
//
//  Membaca beberapa PNG tools/shots/ lalu melaporkan rgb di koordinat yang
//  diambil langsung dari konstanta tata letak di src/levels/level2-kabel-2d.js.
//  Dipakai untuk membuktikan ukuran & kontras tanpa membuka browser.
// ============================================================================
import fs from 'node:fs';
import zlib from 'node:zlib';

function decodePng(file) {
  const buf = fs.readFileSync(file);
  let p = 8, w = 0, h = 0, depth = 0, ctype = 0, inter = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; inter = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const CH = ctype === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(w * h * 3);
  const stride = w * CH;
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const a = x >= CH ? raw[y * (stride + 1) + 1 + x - CH] : 0;
      const b = y > 0 ? raw[(y - 1) * (stride + 1) + 1 + x] : 0;
      const c = (x >= CH && y > 0) ? raw[(y - 1) * (stride + 1) + 1 + x - CH] : 0;
      let v = raw[y * (stride + 1) + 1 + x];
      if (ft === 1) v += a; else if (ft === 2) v += b; else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      raw[y * (stride + 1) + 1 + x] = v & 255;
    }
    for (let x = 0; x < w; x++) { const s = y * (stride + 1) + 1 + x * CH; px[(y * w + x) * 3] = raw[s]; px[(y * w + x) * 3 + 1] = raw[s + 1]; px[(y * w + x) * 3 + 2] = raw[s + 2]; }
  }
  return { w, h, at: (x, y) => { const i = ((Math.round(y) * w + Math.round(x)) | 0) * 3; return [px[i], px[i + 1], px[i + 2]]; } };
}

/* ---- konstanta tata letak (sumber: src/levels/level2-kabel-2d.js) ---- */
const AX = 172, AY = 88, AW = 616, AH = 430, CX = 480;
const PIN = { x: CX - 200, y: AY + 4, w: 400, h: 136 };
const SLOT_W = 36, SLOT_GAP = 8;
const PIN_PADX = (PIN.w - (SLOT_W * 8 + SLOT_GAP * 7)) / 2;
const slotX = i => PIN.x + PIN_PADX + i * (SLOT_W + SLOT_GAP);
const slotCX = i => slotX(i) + SLOT_W / 2;
const SLOT_TOP = 118, SLOT_BOT = 182;
const SLOT_SEAT = SLOT_TOP + 16;
const BAND = { x: slotX(0) - 8, y: 190, h: 24 };
const TIP_Y = 216, WIRE_B = 396, JACK_UP = 206, JACKET_W = 220, CON_W = 18, CON_STEP = 24;
const BASE_X0 = 396;
const CONN = { x: PIN.x, w: PIN.w, y: AY + 8, h: 140 };
const looseX = i => BASE_X0 + i * CON_STEP;
const CARD_L = i => ({ x: 86, y: 120 + i * 88 }), CARD_R = i => ({ x: 874, y: 120 + i * 88 });
const BAR = { x: 8, y: 526, w: 944, h: 70 };

const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
const lum = c => (c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000;
const sat = c => Math.max(...c) - Math.min(...c);

const cache = new Map();
function img(name) {
  if (!cache.has(name)) cache.set(name, decodePng('tools/shots/' + name + '.png'));
  return cache.get(name);
}

let fail = 0, pass = 0;
function cek(ket, IMAGE, x, y, fn, ket2) {
  const c = img(IMAGE).at(x, y);
  const yes = fn(c);
  if (yes) pass++; else fail++;
  console.log((yes ? '  OK   ' : '  GAGAL') + '  ' + ket.padEnd(46) + hex(c) + '  L=' + lum(c).toFixed(0) + (ket2 ? '  ' + ket2 : ''));
  return c;
}
/* Menyisir satu kotak dan mencari piksel paling terang & paling gelap di
   dalamnya. Dipakai untuk membuktikan TEKS ada dan terbaca (bukan sekadar
   satu piksel yang kebetulan jatuh di antara dua huruf). */
function kotak(ket, IMAGE, x, y, w, h, minLum, maxLum, ket2) {
  const im = img(IMAGE);
  let hi = 0, lo = 255, hiC = [0, 0, 0];
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const c = im.at(xx, yy), L = lum(c);
    if (L > hi) { hi = L; hiC = c; }
    if (L < lo) lo = L;
  }
  const ok = hi >= minLum && (maxLum === undefined || lo <= maxLum);
  if (ok) pass++; else fail++;
  console.log((ok ? '  OK   ' : '  GAGAL') + '  ' + ket.padEnd(46)
    + 'terang=' + hi.toFixed(0) + ' gelap=' + lo.toFixed(0)
    + (maxLum === undefined ? ' (butuh >=' + minLum + ')' : ' (butuh >=' + minLum + ', <=' + maxLum + ')')
    + (ket2 ? '  ' + ket2 : ''));
}
const gelap = c => lum(c) < 70;                                  // latar area kerja
const terang = c => lum(c) > 130;                                // selubung / konduktor belang
const biru = c => c[2] > c[0] + 30 && c[2] > 60;                 // kebiruan
const emas = c => c[0] > 150 && c[1] > 110 && c[2] < 110;         // pin emas
const krem = c => c[0] > 215 && c[1] > 200 && c[2] > 175 && c[0] - c[2] < 60;
// Konduktor: belang (krem) atau polos. Warna polos core (biru/hijau/coklat)
// memang lebih gelap dari krem, jadi syaratnya "jauh lebih terang dari
// latar" (L>60) plus warnanya memang jenuh, bukan sekadar terang.
const konduktor = c => krem(c) || (sat(c) > 45 && lum(c) > 60) || (sat(c) < 45 && lum(c) > 120);

console.log('\n== LATAR AREA KERJA (gelap, tapi bukan hitam mati) ==');
cek('latar tengah atas (480,92)', '01-awal', 480, 92, c => gelap(c) && !terang(c));
cek('latar tengah (480,320)', '01-awal', 480, 320, gelap);
cek('latar bawah kiri (200,510)', '01-awal', 200, 510, gelap);
cek('latar kiri area (200,320)', '01-awal', 200, 320, gelap);

console.log('\n== SELUBUNG / JAKET (abu-lilac, jauh lebih terang dari latar) ==');
cek('jaket awal (480,440) >= 130', '01-awal', 480, 440, c => terang(c), 'abu-lilac vs latar gelap');
cek('jaket tepi kiri (CX-108,440) >= 75', '01-awal', CX - 108, 440, c => lum(c) > 75);
cek('jaket tepi kanan (CX+108,440) >= 75', '01-awal', CX + 108, 440, c => lum(c) > 75);
cek('jaket di luar jaket tetap gelap (CX-140,440)', '01-awal', CX - 140, 440, gelap);
cek('jaket naik setelah RJ-45 (480,300)', '06-rj45-terpasang', 480, 300, terang);
cek('kabel sudah naik ke RJ-45 (480,340) kosong', '04-semua-terisi', 480, 340, gelap);
kotak('selubung punya outline gelap + isi terang', '01-awal', 368, 400, 224, 116, 130, 90, 'tepi gelap, tengah terang');
cek('jaket masuk ke dalam RJ-45 (480,230)', '06-rj45-terpasang', 480, 230, c => terang(c) && c[2] > c[0], 'jaket di dalam badan konektor');
cek('badan RJ-45 di atas jaket (480,150)', '06-rj45-terpasang', 480, 150, c => !hitamMati(c));
cek('tidak ada konduktor menggantung di bawah RJ-45 (480,236)', '07-sudah-crimp', 480, 236, terang,
  'yang tampil harus selubung, bukan kawat');

console.log('\n== KONDUKTOR BERDIRI SETELAH KUPAS (tinggi 180 px, tebal 18 px) ==');
for (const i of [0, 3, 7]) {
  cek('konduktor ' + (i + 1) + ' ujung atas y=' + (TIP_Y + 6), '02-kupas', looseX(i), TIP_Y + 6, konduktor, 'x=' + looseX(i));
  cek('konduktor ' + (i + 1) + ' pangkal y=' + (WIRE_B - 6), '02-kupas', looseX(i), WIRE_B - 6, konduktor);
  cek('konduktor ' + (i + 1) + ' tengah y=300', '02-kupas', looseX(i), 300, konduktor);
}
cek('celah antar konduktor gelap (x=407,y=300)', '02-kupas', looseX(0) + CON_W / 2 + 1.5, 300, gelap);
// hanya bagian tengah bundel yang dipindai, jadi 2 tepi luar tidak ikut terhitung
celah('8 konduktor berdiri tidak saling tumpuk (y=300)', '02-kupas', 399, 561, 300, 7, 7);
celah('8 konduktor berdiri tidak saling tumpuk (y=360)', '02-kupas', 399, 561, 360, 7, 7);
celah('8 konduktor berdiri tidak saling tumpuk (y=240)', '02-kupas', 399, 561, 240, 7, 7);

console.log('\n== KOTAK PIN 1-8 (slot 36x64, konduktor tembus pandang) ==');
kotak('slot kosong punya outline terlihat', '02-kupas', slotX(0) - 4, SLOT_TOP - 4, SLOT_W + 8,
  (SLOT_BOT - SLOT_TOP) + 8, 70, 45, 'garis slot vs isi kotak pin');
for (let i = 0; i < 8; i++) {
  cek('slot ' + (i + 1) + ' terisi, ujung di dalam slot', '04-semua-terisi', slotCX(i), SLOT_SEAT,
    konduktor, 'x=' + slotCX(i));
}
cek('pita angka pin: angka terang (x=slot1,y=' + (BAND.y + 12) + ')', '04-semua-terisi', slotCX(0), BAND.y + 12, c => lum(c) > 180);
cek('badan pita angka gelap (x=' + (slotX(0) + 4) + ',y=' + (BAND.y + 12) + ')', '04-semua-terisi', slotX(0) + 4, BAND.y + 12, gelap);

console.log('\n== RJ-45 (badan transparan menutup 8 slot, 8 pin emas) ==');
cek('badan konektor kiri (x=' + (CONN.x + 20) + ',y=200)', '06-rj45-terpasang', CONN.x + 20, 200, c => !hitamMati(c) && c[2] > c[0]);
cek('badan konektor tengah (480,205)', '06-rj45-terpasang', 480, 205, c => !hitamMati(c) && c[2] > c[0]);
cek('badan konektor kanan (x=' + (CONN.x + CONN.w - 20) + ',y=200)', '06-rj45-terpasang', CONN.x + CONN.w - 20, 200, c => !hitamMati(c) && c[2] > c[0]);
cek('konduktor tembus pandang di dalam RJ-45 (x=' + (slotCX(3) + 5) + ',y=176)', '06-rj45-terpasang', slotCX(3) + 5, 176, konduktor);
cek('di luar RJ-45 tetap gelap (x=' + (CONN.x - 12) + ',y=205)', '06-rj45-terpasang', CONN.x - 12, 205, gelap);
cek('pin emas #1 (x=' + slotCX(0) + ',y=140)', '06-rj45-terpasang', slotCX(0), 140, emas);
cek('pin emas #4 (x=' + slotCX(3) + ',y=140)', '06-rj45-terpasang', slotCX(3), 140, emas);
cek('pin emas #8 (x=' + slotCX(7) + ',y=140)', '06-rj45-terpasang', slotCX(7), 140, emas);
cek('pin emas #1 & #8 sama-sama di dalam badan', '06-rj45-terpasang', slotCX(0), 140, emas);
cek('pin emas #8 di dalam badan', '06-rj45-terpasang', slotCX(7), 140, emas);
kotak('status BELUM DI-CRIMP terbaca di RJ-45', '06-rj45-terpasang', CONN.x + 34, 212, 190, 22, 120);
kotak('status TERKUNCI terbaca di RJ-45', '07-sudah-crimp', CONN.x + 34, 212, 190, 22, 120);
kotak('label RJ-45 di badan konektor', '06-rj45-terpasang', CONN.x + 12, 104, 90, 20, 120);

console.log('\n== KRIMP: RJ-45 terkunci ==');
cek('badan konektor tetap ada setelah crimp (480,205)', '07-sudah-crimp', 480, 205, c => !hitamMati(c) && c[2] > c[0]);
cek('pin emas masih ada setelah crimp (x=' + slotCX(0) + ',y=126)', '07-sudah-crimp', slotCX(0), 126, emas);

console.log('\n== PANEL ALAT: kartu terkunci redup, kartu aktif menyala ==');
cek('kartu aktif langkah 0', '01-awal', CARD_L(0).x, CARD_L(0).y, c => lum(c) > 45, 'lebih terang');
cek('kartu terkunci kiri', '01-awal', CARD_L(2).x, CARD_L(2).y, c => lum(c) < 60, 'redup');
cek('kartu terkunci kanan', '01-awal', CARD_R(2).x, CARD_R(2).y, c => lum(c) < 60, 'redup');

console.log('\n== LAYAR PEMBUKA & MODAL (panel gelap + teks terang = kontras tinggi) ==');
cek('pembuka: luar panel gelap (40,40)', '00-pembuka', 40, 40, gelap);
cek('pembuka: panel dalam gelap (480,300)', '00-pembuka', 480, 300, gelap);
kotak('pembuka: judul besar terbaca', '00-pembuka', 200, 82, 560, 26, 150);
kotak('pembuka: 6 nama alat terbaca', '00-pembuka', 140, 190, 680, 130, 130);
kotak('modal tester: judul terbaca', '08-tester-siap', 380, 140, 200, 26, 140);
kotak('modal tester: 8 LED menyala saat LULUS', '09-tester-lulus', 256, 222, 448, 24, 130, undefined, 'LED hijau');
kotak('modal tester: 8 LED masih gelap saat SIAP', '08-tester-siap', 256, 222, 448, 24, 0, 60, 'belum dites');
kotak('modal tester: status LULUS terbaca', '09-tester-lulus', 260, 268, 440, 22, 130);
kotak('modal tester: status GAGAL terbaca', '10-tester-gagal', 260, 268, 440, 22, 130);
kotak('modal tester: 3 tombol terbaca', '08-tester-siap', 234, 446, 492, 44, 140);
kotak('modal belajar: judul terbaca', '15-belajar', 300, 98, 360, 26, 140);
kotak('modal langkah: judul terbaca', '12-modal-langkah', 300, 100, 360, 26, 140);
kotak('modal bantuan: judul terbaca', '11-modal-bantuan', 300, 84, 360, 26, 140);
// toast core (say) menutupi bar bawah selama ~4,6 detik, jadi bar Andi dibaca
// dari adegan 18-bar-andi yang sudah menunggu toastnya habis
kotak('bar Andi: blok LANGKAH + 3 kolom', '18-bar-andi', BAR.x + 6, BAR.y + 8, BAR.w - 12, BAR.h - 16, 120);
kotak('bar Andi: wajah Andi', '18-bar-andi', BAR.x + 16, BAR.y + 16, 40, 40, 120);
kotak('bar Andi: kolom APA', '18-bar-andi', 284, 550, 200, 40, 110);
kotak('bar Andi: kolom KENAPA', '18-bar-andi', 506, 550, 200, 40, 110);
kotak('bar Andi: kolom AWAS', '18-bar-andi', 728, 550, 200, 40, 110);
kotak('kartu pesan di panel kanan bawah', '18-bar-andi', 804, 384, 140, 130, 110);
kotak('strip atas: tombol + counter', '01-awal', 10, 57, 940, 26, 120);

function gelapM(c) { return lum(c) < 70; }
/* Menghitung kelompok piksel gelap berurutan pada satu baris. Dipakai untuk
   membuktikan 8 konduktor berdiri TIDAK saling tumpuk: harus ada tepat
   7 celah gelap di antara mereka. */
function celah(ket, IMAGE, x0, x1, y, minGroups, maxGroups) {
  const im = img(IMAGE);
  let groups = 0, inG = false, widest = 0, run = 0;
  for (let x = x0; x <= x1; x++) {
    const d = gelapM(im.at(x, y));
    if (d) { if (!inG) { groups++; inG = true; run = 0; } run++; widest = Math.max(widest, run); }
    else { inG = false; run = 0; }
  }
  const ok = groups >= minGroups && (maxGroups === undefined || groups <= maxGroups);
  if (ok) pass++; else fail++;
  console.log((ok ? '  OK   ' : '  GAGAL') + '  ' + ket.padEnd(46)
    + 'celah=' + groups + ' (butuh ' + minGroups + (maxGroups === undefined ? '+' : '..' + maxGroups) + ')'
    + '  lebar=' + widest + 'px');
}
function hitamMati(c) { return lum(c) < 12; }

console.log('\n' + (fail ? '  ' + fail + ' GAGAL' : '  semua ' + pass + ' pemeriksaan piksel lulus'));
process.exit(fail ? 1 : 0);