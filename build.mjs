// ============================================================================
//  BUILD NetCrimp
//  Menggabungkan src/ menjadi SATU file HTML yang siap pakai:
//      netcrimp2.html   (nama & lokasi sama seperti sebelumnya)
//
//  Pakai:   node build.mjs            (atau klik dua kali build.bat)
//  Opsi:    node build.mjs --open     -> langsung dibuka di browser
//           node build.mjs --out dist/netcrimp2.html   -> taruh di folder lain
//
//  ATURAN: file netcrimp2.html di root ini hasil build -- JANGAN diedit
//  langsung, karena akan hilang saat build berikutnya. Edit di src/.
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

const outFile = path.resolve(ROOT, opt('--out', path.join(ROOT, 'netcrimp2.html')));

// Urutan = urutanevaluated. Core dulu, lalu level, lalu UI.
const GROUPS = [
  { token: '@@BUILD:CORE@@',   dir: path.join(SRC, 'core'),   title: 'CORE   (infraruktur bersama)' },
  { token: '@@BUILD:LEVELS@@', dir: path.join(SRC, 'levels'), title: 'LEVELS (satu file per level)' },
  { token: '@@BUILD:UI@@',     dir: path.join(SRC, 'ui'),     title: 'UI     (menu, scene, loop)'  },
];

const banner = (t) => `\n/* ${'='.repeat(74)}\n   ${t}\n   ${'='.repeat(74)} */\n`;

let source;
try {
  source = fs.readFileSync(path.join(SRC, 'template.html'), 'utf8');
} catch {
  console.error('Gagal: src/template.html tidak ditemukan.'); process.exit(1);
}

let total = 0;
for (const g of GROUPS) {
  if (!fs.existsSync(g.dir)) { console.error('Gagal: folder tidak ditemukan -> ' + g.dir); process.exit(1); }
  const files = fs.readdirSync(g.dir).filter(f => f.endsWith('.js')).sort();
  if (!files.length) { console.error('Gagal: tidak ada .js di ' + g.dir); process.exit(1); }

  let chunk = banner(g.title);
  for (const f of files) {
    const body = fs.readFileSync(path.join(g.dir, f), 'utf8').replace(/\s+$/, '');
    chunk += `\n/* ---- ${f} ${'-'.repeat(Math.max(3, 66 - f.length))} */\n` + body + '\n';
    total++;
    console.log('  + ' + path.relative(ROOT, path.join(g.dir, f)));
  }

  if (!source.includes(g.token)) { console.error('Gagal: placeholder ' + g.token + ' tidak ada di template.html'); process.exit(1); }
  source = source.replace(g.token, () => chunk);
}

const left = source.match(/@@BUILD:[A-Z]+@@/);
if (left) { console.error('Gagal: placeholder belum tergantikan -> ' + left[0]); process.exit(1); }

const rel = path.relative(ROOT, outFile);
const existed = fs.existsSync(outFile);
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, source, 'utf8');

const kb = (fs.statSync(outFile).size / 1024).toFixed(1);
console.log(`\n${total} file digabung -> ${rel}  (${kb} KB)${existed ? '' : '  [baru]'}`);

// Sanity check basics: IIFE utuh, tidak ada duplikat nama tingkat atas yang fatal.
const problems = [];
if ((source.match(/^\(\(\) => \{$/m) || []).length !== 1) problems.push('bentuk IIFE tidak ditemukan');
if (!/<\/html>\s*$/.test(source)) problems.push('penutup </html> hilang');
const dups = [...source.matchAll(/^\s*function ([A-Za-z_$][\w$]*)\s*\(/gm)].map(m => m[1]);
const seen = new Set(), dup = new Set();
dups.forEach(n => (seen.has(n) ? dup.add(n) : seen.add(n)));
if (dup.size) problems.push('fungsi duplikat: ' + [...dup].join(', '));
if (problems.length) { console.error('\nPERINGATAN:\n - ' + problems.join('\n - ')); process.exit(2); }
console.log('Cek dasar OK (IIFE utuh, tidak ada fungsi duplikat).');

if (flag('--open')) {
  const cmd = process.platform === 'win32' ? `start "" "${outFile}"` : `open "${outFile}"`;
  exec(cmd, () => {});
}