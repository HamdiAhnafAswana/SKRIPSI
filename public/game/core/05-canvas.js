// ==========================================================================
// core/05-canvas.js
// Diambil dari backup/netcrimp2.ORI.html baris 113-124. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ---------- kanvas ---------- */
function fit() { const r = cv.getBoundingClientRect(); const d = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.max(1, Math.round(r.width * d)); cv.height = Math.max(1, Math.round(r.width * H / W * d)); }
window.addEventListener('resize', fit); fit();

function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function txt(s, x, y, o) { o = o || {}; ctx.font = `${o.w || 700} ${o.s || 16}px ${o.f || FONT_B}`; ctx.fillStyle = o.c || C.text; ctx.textAlign = o.a || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(s), x, y); }
function wrapLines(s, maxW, size, weight) { ctx.font = `${weight || 600} ${size}px ${FONT_B}`; const out = []; for (const p of String(s).split('\n')) { let line = ''; for (const w of p.split(' ')) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } out.push(line); } return out; }
function para(s, x, y, maxW, lh, o) { o = Object.assign({ w: 600, s: 14 }, o || {}); const L = wrapLines(s, maxW, o.s, o.w); L.forEach((l, i) => txt(l, x, y + i * lh, o)); return L.length; }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const inR = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
