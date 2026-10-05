/* Alat bantu: cetak satu baris / satu kolom piksel dari PNG hasil shot.
   Dipakai untuk menelusuri isi area kerja tanpa melihat gambar.
   Pakai: node tools/row.mjs <nama-shot> <y> <x0> <x1>   (atau  x0 x1 y0 y1) */
import fs from 'fs';
import zlib from 'zlib';

export function decodePng(path) {
  const b = fs.readFileSync(path);
  let o = 8, w = 0, h = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), type = b.toString('ascii', o + 4, o + 8);
    const d = b.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bitDepth = d[8]; colorType = d[9]; }
    else if (type === 'IDAT') idat.push(d);
    else if (type === 'IEND') break;
    o += 12 + len;
  }
  const CH = ({ 0: 1, 2: 3, 4: 2, 6: 4 })[colorType];
  if (bitDepth !== 8) throw new Error('bitDepth ' + bitDepth);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * CH, px = new Uint8Array(w * h * 3);
  let prev = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const cur = new Uint8Array(stride);
    for (let i = 0; i < stride; i++) {
      const x = raw[y * (stride + 1) + 1 + i];
      const a = i >= CH ? cur[i - CH] : 0, bb = prev[i], c = i >= CH ? prev[i - CH] : 0;
      let v;
      if (ft === 0) v = x;
      else if (ft === 1) v = x + a;
      else if (ft === 2) v = x + bb;
      else if (ft === 3) v = x + ((a + bb) >> 1);
      else { const pp = a + bb - c, pa = Math.abs(pp - a), pb = Math.abs(pp - bb), pc = Math.abs(pp - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? bb : c); }
      cur[i] = v & 255;
    }
    for (let x = 0; x < w; x++) { const s = x * CH; px[(y * w + x) * 3] = cur[s]; px[(y * w + x) * 3 + 1] = cur[s + 1]; px[(y * w + x) * 3 + 2] = cur[s + 2]; }
    prev = cur;
  }
  return { w, h, at: (x, y) => { const i = ((Math.round(y) * w + Math.round(x)) | 0) * 3; return [px[i], px[i + 1], px[i + 2]]; } };
}

const hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
const lum = c => ((c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000).toFixed(0);

const a = process.argv.slice(2);
if (a.length >= 4) {
  const im = decodePng('tools/shots/' + a[0] + '.png');
  const [x0, x1, y0, y1] = [+a[1], +a[2], +a[3], a[4] === undefined ? +a[3] : +a[4]];
  for (let y = y0; y <= y1; y++) {
    const parts = [];
    for (let x = x0; x <= x1; x++) parts.push(String(x).padStart(4) + ':' + hex(im.at(x, y)).slice(1) + '/' + lum(im.at(x, y)));
    console.log('y=' + y + '  ' + parts.join(' '));
  }
}
