// ==========================================================================
// core/02-storage.js
// Diambil dari netcrimp2.html baris 46-59. File ini digabung otomatis oleh build.mjs
// ke dist/netcrimp2.html -- JANGAN diedit langsung di dist/.
// ==========================================================================

/* ---------- penyimpanan ---------- */
const KEY = 'netcrimp_v1';
let save = { unlocked: 1, stars: [0,0,0,0,0], best: [0,0,0,0,0], log: [], teacher: false, board: [], board2: [], badges: [], l2: {} };
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Array.isArray(s.stars)) save = Object.assign(save, s); } catch (e) {}
if (!Array.isArray(save.board2)) save.board2 = [];
if (!Array.isArray(save.badges)) save.badges = [];
if (!save.l2 || typeof save.l2 !== 'object') save.l2 = {};
if (!save.l2.grafis) save.l2.grafis = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || /Android|iPhone|iPad/i.test(navigator.userAgent) ? 'hemat' : 'normal';
if (typeof save.l2.mudah !== 'boolean') save.l2.mudah = false;
if (typeof save.l2.sound !== 'boolean') save.l2.sound = true;
function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }
const nameEl = document.getElementById('nama');
try { nameEl.value = localStorage.getItem(KEY + '_nama') || ''; } catch (e) {}
nameEl.addEventListener('input', () => { try { localStorage.setItem(KEY + '_nama', nameEl.value); } catch (e) {} });
