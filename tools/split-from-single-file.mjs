// ============================================================================
//  SKRIP SATU-PAKAI (migrasi).
//  Memotong netcrimp2.html yang monolit menjadi src/ per bagian & per level.
//  Jalankan HANYA KALI INI. Setelah itu, pengeditan cukup di src/.
//    node tools/split-from-single-file.mjs
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC_FILE = path.join(ROOT, 'netcrimp2.html');

const lines = fs.readFileSync(SRC_FILE, 'utf8').split(/\r?\n/);
const at = (n) => lines[n - 1];                       // 1-based
const slice = (a, b) => lines.slice(a - 1, b).join('\n');

// [nama file, baris mulai, baris selesai]  -- 1-based, inklusif
const CHUNKS = [
  ['src/core/01-init.js',            40,   44],
  ['src/core/02-storage.js',         46,   59],
  ['src/core/03-audio.js',           61,   93],
  ['src/core/04-three.js',           95,  111],
  ['src/core/05-canvas.js',         113,  124],
  ['src/core/06-input.js',          126,  157],
  ['src/core/07-draw.js',           159,  181],
  ['src/core/08-wire-colors.js',    183,  201],
  ['src/core/09-tool-icons.js',     203,  362],
  ['src/core/10-sprites.js',        364,  386],
  ['src/core/11-room-lemari.js',    388,  534],
  ['src/core/12-andi.js',           536,  622],
  ['src/core/13-level-core.js',     624,  733],

  ['src/levels/level1-alat.js',     735, 1347],
  ['src/levels/level2-kabel-3d.js', 1349, 2444],
  ['src/levels/level3-crossover.js',2446, 2567],
  ['src/levels/level4-patch-panel.js',2569, 2667],
  ['src/levels/level5-rack.js',     2669, 2814],

  ['src/ui/20-scenes.js',          2816, 2934],
  ['src/ui/21-loop.js',            2936, 2950],
];

for (const [rel, a, b] of CHUNKS) {
  const dest = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const body = slice(a, b).replace(/\s+$/, '') + '\n';
  const head = `// ${'='.repeat(74)}\n// ${rel.replace(/^src\//, '')}\n// Diambil dari netcrimp2.html baris ${a}-${b}. File ini digabung otomatis oleh build.mjs\n// ke dist/netcrimp2.html -- JANGAN diedit langsung di dist/.\n// ${'='.repeat(74)}\n\n`;
  fs.writeFileSync(dest, head + body, 'utf8');
  console.log('  ' + rel.padEnd(34) + ' baris ' + a + '-' + b + '  (' + body.split('\n').length + ' baris)');
}

// Sanity check: potongan harus menyambung seamless.
console.log('\nSelesai. Cek cepat:');
for (const [rel, a, b] of CHUNKS) console.log('  ' + at(a).trim().slice(0, 60).padEnd(62) + ' <- ' + rel);