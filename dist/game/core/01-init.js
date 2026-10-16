// ==========================================================================
// core/01-init.js
// Diambil dari backup/netcrimp2.ORI.html baris 40-44. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

const W = 960, H = 600;
let VW = 960, OX = 0;
const cv = document.getElementById('c');
let ctx = cv.getContext('2d');
const FONT_H = '"Fredoka","Nunito",system-ui,sans-serif', FONT_B = '"Nunito",system-ui,sans-serif';
const C = { panel: '#182a40', panel2: '#20364f', line: '#33506f', text: '#eaf2fb', mute: '#9db2c8', acc: '#38bdf8', ok: '#34d399', bad: '#f87171', warn: '#fbbf24', gold: '#d4a72c' };
