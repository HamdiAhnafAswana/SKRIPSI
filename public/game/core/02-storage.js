// ==========================================================================
// core/02-storage.js
// Diambil dari backup/netcrimp2.ORI.html baris 46-59. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ---------- penyimpanan ---------- */
const KEY = 'netcrimp_v1';
let save = { unlocked: 1, stars: [0,0,0,0,0,0,0], best: [0,0,0,0,0,0,0], log: [], teacher: false, board: [], board2: [], board3: [], board4: [], badges: [], l2: {}, cables: {} };
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Array.isArray(s.stars)) save = Object.assign(save, s); } catch (e) {}
/* kompatibilitas data lama: progres kini mencakup 7 level (L1..L7), isi sisa dengan default */
save.stars = Array.from({ length: 7 }, (_, i) => (save.stars && save.stars[i]) || 0);
save.best = Array.from({ length: 7 }, (_, i) => (save.best && save.best[i]) || 0);
if (!Array.isArray(save.board2)) save.board2 = [];
if (!Array.isArray(save.board3)) save.board3 = [];
if (!Array.isArray(save.board4)) save.board4 = [];
if (!Array.isArray(save.badges)) save.badges = [];
if (!save.cables || typeof save.cables !== 'object') save.cables = {};
if (!save.l2 || typeof save.l2 !== 'object') save.l2 = {};
if (!save.l2.grafis) save.l2.grafis = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || /Android|iPhone|iPad/i.test(navigator.userAgent) ? 'hemat' : 'normal';
if (typeof save.l2.mudah !== 'boolean') save.l2.mudah = false;
if (typeof save.l2.sound !== 'boolean') save.l2.sound = true;
function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }
const nameEl = document.getElementById('nama');
try { nameEl.value = localStorage.getItem(KEY + '_nama') || ''; } catch (e) {}
nameEl.addEventListener('input', () => { try { localStorage.setItem(KEY + '_nama', nameEl.value); } catch (e) {} });
