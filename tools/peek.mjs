// ============================================================================
//  BACA PNG MENJADI PETA ASCII  --  node tools/peek.mjs <file.png> [x y w h] [lebar]
//
//  Dipakai untuk memeriksa hasil gambar level 2 tanpa membuka browser:
//  PNG dari tools/shot.mjs di-decode sendiri (tanpa pustaka luar) lalu
//  diturunkan jadi peta karakter per warna, sehingga tata letak, posisi
//  slot, garis oranye RJ-45, dan garis konduktor bisa diperiksa mata.
//
//    X = sangat terang   . terang   : sedang   - gelap   ' ' sangat gelap
//    R/O/Y/G/C/B/M = merah/oranye/kuning/hijau/sian/biru/magenta
//    W = putih           K = hitam pekat
// ============================================================================
import fs from 'node:fs';
import zlib from 'node:zlib';

const arg = process.argv.slice(2);
if (!arg.length) { console.log('pakai: node tools/peek.mjs <file.png> [x y w h] [lebar-kolom]'); process.exit(1); }
const file = arg[0];
const buf = fs.readFileSync(file);

/* ----------------------------- decoder PNG ------------------------------ */
if (buf.readUInt32BE(0) !== 0x89504e47) { console.log('bukan PNG'); process.exit(1); }
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
if (depth !== 8 || inter !== 0 || (ctype !== 2 && ctype !== 6)) { console.log('format PNG tidak didukung: depth=' + depth + ' ctype=' + ctype + ' interlace=' + inter); process.exit(1); }
const CH = ctype === 6 ? 4 : 3;
const raw = zlib.inflateSync(Buffer.concat(idat));
const px = Buffer.alloc(w * h * 3);
const stride = w * CH;
for (let y = 0; y < h; y++) {
  const ft = raw[y * (stride + 1)];
  const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
  for (let x = 0; x < stride; x++) {
    const a = x >= CH ? raw[y * (stride + 1) + 1 + x - CH] : 0;
    const b = y > 0 ? raw[(y - 1) * (stride + 1) + 1 + x] : 0;
    const c = (x >= CH && y > 0) ? raw[(y - 1) * (stride + 1) + 1 + x - CH] : 0;
    let v = line[x];
    if (ft === 1) v += a; else if (ft === 2) v += b; else if (ft === 3) v += (a + b) >> 1;
    else if (ft === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
    raw[y * (stride + 1) + 1 + x] = v & 255;
  }
  for (let x = 0; x < w; x++) { const s = y * (stride + 1) + 1 + x * CH; px[(y * w + x) * 3] = raw[s]; px[(y * w + x) * 3 + 1] = raw[s + 1]; px[(y * w + x) * 3 + 2] = raw[s + 2]; }
}
const at = (x, y) => { const i = ((y | 0) * w + (x | 0)) * 3; return [px[i], px[i + 1], px[i + 2]]; };

/* ------------------------------ peta warna ------------------------------ */
function ch(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx - mn, lum = (r * 299 + g * 587 + b * 114) / 1000;
  if (sat < 26) return lum > 225 ? 'W' : lum > 175 ? '#' : lum > 120 ? '.' : lum > 70 ? ':' : lum > 30 ? '-' : ' ';
  // huruf = warna jenuh; huruf kecil = lebih gelap
  let base;
  if (r >= g && r >= b) base = g > b * 1.25 && g > 60 ? 'O' : (g > b * 1.6 ? 'Y' : 'R');
  else if (g >= r && g >= b) base = (b > r * 1.3 && b > 70) ? 'C' : 'G';
  else base = (r > g * 1.4) ? 'M' : 'B';
  return lum < 70 ? base.toLowerCase() : base;
}

const RX = +(arg[1] || 0), RY = +(arg[2] || 0);

// mode --px x,y x,y ... : laporkan warna tepat di beberapa titik
if (arg[1] === '--px') {
  console.log(file + '  ' + w + 'x' + h);
  for (const a of arg.slice(2)) {
    const [x, y] = a.split(',').map(Number);
    const c = at(x, y);
    console.log('  (' + String(x).padStart(4) + ',' + String(y).padStart(4) + ')  rgb('
      + String(c[0]).padStart(3) + ',' + String(c[1]).padStart(3) + ',' + String(c[2]).padStart(3) + ')  '
      + ['hitam', 'sangat gelap', 'gelap', 'abu tua', 'abu', 'terang', 'putih'][Math.min(6, Math.floor(((c[0] + c[1] + c[2]) / 3) / 42))]);
  }
  process.exit(0);
}

const RW = +(arg[3] || w), RH = +(arg[4] || h);
const COLS = +(arg[5] || 118);
const cw = RW / COLS, chh = cw * 0.5;                     // chars are ~2x taller than wide
const ROWS = Math.round(RH / chh);
console.log('  ' + file + '   ' + w + 'x' + h + ' px  | wilayah ' + RX + ',' + RY + ' ' + RW + 'x' + RH + '  -> ' + COLS + 'x' + ROWS);
let out = '';
for (let ry = 0; ry < ROWS; ry++) {
  let line = '';
  for (let rx = 0; rx < COLS; rx++) {
    let r = 0, g = 0, b = 0, n = 0;
    const x0 = Math.round(RX + rx * cw), x1 = Math.round(RX + (rx + 1) * cw);
    const y0 = Math.round(RY + ry * chh), y1 = Math.round(RY + (ry + 1) * chh);
    for (let y = y0; y < Math.min(y1, h); y += 2) for (let x = x0; x < Math.min(x1, w); x += 2) { const c = at(x, y); r += c[0]; g += c[1]; b += c[2]; n++; }
    line += n ? ch(r / n, g / n, b / n) : ' ';
  }
  out += line + '\n';
}
console.log(out);
