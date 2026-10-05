// ============================================================================
//  CARI KARAKTER ASING (CJK / mojibake) DI SEMUA FILE SUMBER
//  --  node tools/cari-asing.mjs
//
//  File sumber kadang bisa tercemar potongan CJK atau mojibake dari
//  copy-paste. Karakter seperti itu tidak pernah muncul di UI yang
//  diharapkan dan harus dibersihkan.
//
//  Skrip ini melaporkan setiap baris yang mengandung karakter di luar blok
//  ASCII yang diizinkan (tanda baca, simbol, huruf beraksen, emoji button).
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIRS = ['src', 'tools'];

// Karakter yang SAH tampil di game: panah, bullet, bintang, centang, dll.
const OK = new Set([...'→←↑↓•★☆–—…±×÷≤≥≈≠°'] .map(c => c.codePointAt(0)));
// CJK, Hiragana, Katakana, Hangul, Sirilika, fullwidth.
const ASING = new RegExp('[' +
  '\\u0400-\\u04ff' + '\\u1100-\\u11ff' + '\\u2e80-\\u303f' + '\\u3040-\\u30ff' +
  '\\u3130-\\u318f' + '\\u3400-\\u4dbf' + '\\u4e00-\\u9fff' + '\\ua960-\\ua97f' +
  '\\uac00-\\ud7af' + '\\uf900-\\ufaff' + '\\ufe30-\\ufe4f' + '\\uff00-\\uffef' + ']');

const files = [];
for (const d of DIRS) {
  const walk = p => {
    for (const e of fs.readdirSync(p, { withFileTypes: true })) {
      const f = path.join(p, e.name);
      if (e.isDirectory()) walk(f);
      else if (/\.(js|mjs|html|css)$/.test(e.name)) files.push(f);
    }
  };
  if (fs.existsSync(path.join(ROOT, d))) walk(path.join(ROOT, d));
}

let found = 0;
for (const f of files) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (rel.startsWith('dist/') || rel.startsWith('backup/')) continue;
  if (rel === 'tools/cari-asing.mjs') continue;      // berkas ini memang memuat karakter itu
  fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((ln, i) => {
    for (const ch of ln) {
      const cp = ch.codePointAt(0);
      if (cp < 128 || OK.has(cp)) continue;
      if (!ASING.test(ch)) continue;
      const hex = 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
      console.log('  ASING  ' + rel + ':' + (i + 1) + '  ' + hex + '  "' + ch + '"');
      console.log('         ' + ln.trim().slice(0, 100));
      found++;
      return;
    }
  });
}
console.log(found
  ? '\n  ' + found + ' karakter asing ditemukan'
  : '\n  tidak ada karakter asing (CJK / mojibake) di sumber');
process.exit(found ? 1 : 0);