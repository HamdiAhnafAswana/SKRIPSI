// ============================================================================
//  SAPUAN WARNA SATU BARIS  --  node tools/sapu.mjs <file.png> <y> <x0> <x1> <langkah>
//
//  Mencetak rgb sepanjang satu baris piksel supaya mudah melihat di mana
//  objek mulai / berakhir (mis. konduktor berdiri di area kerja).
// ============================================================================
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import zlib from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [file, fixeds, x0s, x1s, stepS, modeS] = process.argv.slice(2);
/* mode default  : sapuan mendatar  -> <file.png> <barisY> <x0> <x1> <langkah>
   mode "vert"   : sapuan tegak     -> <file.png> <kolomX> <y0> <y1> <langkah> vert */
const vert = modeS === 'vert';
const fixed = +fixeds, x0 = +x0s, x1 = +x1s, step = +(stepS || 1);
const y = fixed;

const buf = fs.readFileSync(path.isAbsolute(file) ? file : path.join(ROOT, file));
let p = 8, w = 0, h = 0, ctype = 0;
const idat = [];
while (p < buf.length) {
  const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8);
  const d = buf.subarray(p + 8, p + 8 + len);
  if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ctype = d[9]; }
  else if (type === 'IDAT') idat.push(d); else if (type === 'IEND') break;
  p += 12 + len;
}
const CH = ctype === 6 ? 4 : 3;
const raw = zlib.inflateSync(Buffer.concat(idat));
const px = Buffer.alloc(w * h * 3);
const stride = w * CH;
for (let yy = 0; yy < h; yy++) {
  const ft = raw[yy * (stride + 1)];
  for (let x = 0; x < stride; x++) {
    const a = x >= CH ? raw[yy * (stride + 1) + 1 + x - CH] : 0;
    const b = yy > 0 ? raw[(yy - 1) * (stride + 1) + 1 + x] : 0;
    const c = (x >= CH && yy > 0) ? raw[(yy - 1) * (stride + 1) + 1 + x - CH] : 0;
    let v = raw[yy * (stride + 1) + 1 + x];
    if (ft === 1) v += a; else if (ft === 2) v += b; else if (ft === 3) v += (a + b) >> 1;
    else if (ft === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
    raw[yy * (stride + 1) + 1 + x] = v & 255;
  }
  for (let x = 0; x < w; x++) { const s = yy * (stride + 1) + 1 + x * CH; px[(yy * w + x) * 3] = raw[s]; px[(yy * w + x) * 3 + 1] = raw[s + 1]; px[(yy * w + x) * 3 + 2] = raw[s + 2]; }
}

function ch(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx - mn, lum = (r * 299 + g * 587 + b * 114) / 1000;
  if (sat < 26) return lum > 225 ? 'W' : lum > 175 ? '#' : lum > 120 ? '.' : lum > 70 ? ':' : lum > 30 ? '-' : ' ';
  let base;
  if (r >= g && r >= b) base = g > b * 1.25 && g > 60 ? 'O' : (g > b * 1.6 ? 'Y' : 'R');
  else if (g >= r && g >= b) base = (b > r * 1.3 && b > 70) ? 'C' : 'G';
  else base = (r > g * 1.4) ? 'M' : 'B';
  return lum < 70 ? base.toLowerCase() : base;
}

let line = '', detail = '';
for (let t = x0; t <= x1; t += step) {
  const i = vert ? (t * w + y) * 3 : (y * w + t) * 3;      // vert: kolom tetap = y
  const r = px[i], g = px[i + 1], b = px[i + 2];
  line += ch(r, g, b);
  if (step <= 2) detail += String(t) + ':' + ch(r, g, b) + ' ';
}
console.log(file + '  ' + (vert ? 'x=' + y + '  y=' + x0 + '..' + x1 : 'y=' + y + '  x=' + x0 + '..' + x1) + '  langkah ' + step);
console.log('| ' + line + ' |');
if (detail) console.log(detail);

/* Ringkasan: piksel paling terang di sepanjang sapuan, supaya mudah
   melihat sampai di mana gambar berhenti. */
let best = -1, bestC = [0, 0, 0], at = x0;
for (let t = x0; t <= x1; t += step) {
  const i = vert ? (t * w + y) * 3 : (y * w + t) * 3;
  const c = [px[i], px[i + 1], px[i + 2]];
  const L = (c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000;
  if (L > best) { best = L; bestC = c; at = t; }
}
console.log('terang maksimum: ' + best.toFixed(0) + ' di ' + (vert ? 'y=' : 'x=') + at
  + '  rgb(' + bestC.join(',') + ')');