/**
 * Game Loader Helper
 * 
 * Membaca semua file game dari public/game/ dan menggabungkannya
 * menjadi satu string, sama seperti build monolit sebelumnya.
 * 
 * Digunakan oleh tools pengujian (verify, smoke, play2, play3) untuk
 * memastikan mereka tetap bekerja dengan arsitektur React + Vite.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAME_DIR = path.join(ROOT, 'public', 'game');

// Urutan file harus sama dengan urutan <script> di index.html
const CORE_FILES = [
  'core/00-registry.js',
  'core/01-init.js',
  'core/02-storage.js',
  'core/03-audio.js',
  'core/04-three.js',
  'core/05-canvas.js',
  'core/06-input.js',
  'core/07-draw.js',
  'core/08-wire-colors.js',
  'core/09-tool-icons.js',
  'core/10-sprites.js',
  'core/11-room-lemari.js',
  'core/12-andi.js',
  'core/13-level-core.js',
];

const LEVEL_FILES = [
  'levels/level1-alat.js',
  'levels/level2-kabel-2d.js',
  'levels/level3-crossover.js',
  'levels/level4-network.js',
  'levels/level5-crossover.js',
];

const UI_FILES = [
  'ui/20-scenes.js',
  'ui/21-loop.js',
];

const ALL_FILES = [...CORE_FILES, ...LEVEL_FILES, ...UI_FILES];

/**
 * Membaca dan menggabungkan semua file game menjadi satu string.
 * Banner komentar disisipkan antar file agar verify.mjs bisa memisahkan blok Level 2.
 * @returns {string} Gabungan semua file game
 */
export function loadGameScript() {
  const parts = [];
  for (const file of ALL_FILES) {
    const filePath = path.join(GAME_DIR, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File game tidak ditemukan: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const baseName = path.basename(file);
    parts.push(`\n/* ---- ${baseName} ${'-'.repeat(Math.max(3, 66 - baseName.length))} */\n` + content);
  }
  return parts.join('\n');
}

/**
 * Membuat HTML wrapper dengan script game di dalamnya.
 * Kompatibel dengan tools yang mengekstrak dari <script> tag.
 * @returns {string} HTML dengan script game
 */
export function createGameHTML() {
  const script = loadGameScript();
  // Regex tools mengharuskan <script> dan </script> tepat di awal baris (tanpa indentasi)
  // Wrapper IIFE diperlukan agar variabel global tidak bocor ke scope global
  // dan exports __NC harus ada untuk tools pengujian
  const wrapped = `(() => {
'use strict';
${script}

// Exports untuk tools pengujian (sama seperti build monolit)
globalThis.__NC = {
  LEVELS,
  levelTotal,
  levelList,
  go,
  startLevel,
  scene: () => scene,
  scenes: { menuScene, levelsScene, helpScene, logScene },
  save,
  persist,
  baseLevel,
  endLevel,
  quizPick,
  mouse: () => mouse,
  btns: () => btns,
  inR,
  newFrame: () => { hoverBtn = false; btns = []; }
};
})();`;
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>SINOVA — Game Engine</title>
</head>
<body>
<canvas id="c" width="960" height="600"></canvas>
<input id="nama" type="text" maxlength="30" placeholder="Isi sebelum bermain" autocomplete="off">
<script>
${wrapped}
</script>
</body>
</html>`;
}

export { ROOT, GAME_DIR, ALL_FILES };
