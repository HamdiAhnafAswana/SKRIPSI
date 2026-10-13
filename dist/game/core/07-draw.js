// ==========================================================================
// core/07-draw.js
// Diambil dari backup/netcrimp2.ORI.html baris 159-181. File ini digabung otomatis oleh build.mjs
// ke index.html -- JANGAN diedit langsung di index.html.
// ==========================================================================

/* ---------- gambar umum ---------- */
function bg(wires) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#13233a'); g.addColorStop(1, '#0b1523'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(120,160,210,.06)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0; x <= W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = 0; y <= H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
    if (wires) {
        const t = performance.now() / 1000; ctx.lineCap = 'round';
        for (let k = 0; k < 8; k++) {
            ctx.beginPath(); for (let x = -10; x <= W + 10; x += 14) { const y = 505 + k * 8 + Math.sin(x / 95 + t * 1.1 + k * .45) * 11; if (x < 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
            const id = T568B[k], d = WC[id]; ctx.lineWidth = 5; ctx.strokeStyle = d.c; ctx.setLineDash(d.st ? [10, 8] : []); ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}
function deskBG() {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#14253c'); g.addColorStop(1, '#0b1523'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(120,160,210,.06)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0; x <= W; x += 40) { ctx.moveTo(x, 54); ctx.lineTo(x, H); } for (let y = 54; y <= H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
}
function tickIcon(x, y, s, c) { ctx.save(); ctx.beginPath(); ctx.moveTo(x - s * .5, y); ctx.lineTo(x - s * .15, y + s * .4); ctx.lineTo(x + s * .55, y - s * .4); ctx.strokeStyle = c; ctx.lineWidth = Math.max(2, s * .22); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore(); }
function crossIcon(x, y, s, c) { ctx.save(); ctx.beginPath(); ctx.moveTo(x - s * .4, y - s * .4); ctx.lineTo(x + s * .4, y + s * .4); ctx.moveTo(x + s * .4, y - s * .4); ctx.lineTo(x - s * .4, y + s * .4); ctx.strokeStyle = c; ctx.lineWidth = Math.max(2, s * .22); ctx.lineCap = 'round'; ctx.stroke(); ctx.restore(); }
function star(cx, cy, r, on) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * .45 : r; ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } ctx.closePath(); ctx.fillStyle = on ? C.warn : '#2a3a4e'; ctx.fill(); ctx.strokeStyle = on ? '#b7791f' : '#3a4d64'; ctx.lineWidth = 1.5; ctx.stroke(); }
function lock(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineWidth = 5; ctx.strokeStyle = '#4b6079'; ctx.beginPath(); ctx.arc(0, -8, 11, Math.PI, 0); ctx.stroke(); rr(-16, -8, 32, 26, 5); ctx.fillStyle = '#4b6079'; ctx.fill(); ctx.restore(); }
